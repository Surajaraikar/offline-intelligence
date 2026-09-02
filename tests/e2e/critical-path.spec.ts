import { test, expect, type Page } from "@playwright/test";

async function waitForApp(page: Page) {
  await expect(page.locator('[data-app-ready="true"]')).toBeVisible({ timeout: 15_000 });
}

async function visibleAvatarGeometry(page: Page) {
  return page.evaluate(() => {
    const avatar = [...document.querySelectorAll<HTMLElement>('[data-testid="avatar"]')].find((element) => element.getBoundingClientRect().width > 0);
    if (!avatar) return null;
    const initials = avatar.querySelector<HTMLElement>(".avatar-initials");
    if (!initials) return null;
    const outer = avatar.getBoundingClientRect();
    const inner = initials.getBoundingClientRect();
    return { width: outer.width, height: outer.height, centerXDelta: Math.abs((outer.left + outer.width / 2) - (inner.left + inner.width / 2)), centerYDelta: Math.abs((outer.top + outer.height / 2) - (inner.top + inner.height / 2)) };
  });
}

test("operator can process data and review core queues", async ({ page }) => {
  await page.goto("/dashboard");
  await waitForApp(page);
  await expect(page.getByRole("heading", { name: "Good morning, Offline team" })).toBeVisible();
  const processButton = page.getByTestId("process-dataset");
  await processButton.click();
  await expect(processButton).toContainText("Processing", { timeout: 5_000 });
  await expect(processButton).toContainText("Process dataset", { timeout: 15_000 });
  await page.goto("/data-quality");
  await waitForApp(page);
  await expect(page.getByTestId("duplicate-card").first()).toBeVisible();
  await page.getByTestId("approve-merge").first().click();
  await page.goto("/applicants");
  await waitForApp(page);
  await page.getByTestId("score-breakdown").first().click();
  await expect(page.getByText("Leadership relevance").first()).toBeVisible();
});

test("pagination preserves filters, boundaries, avatar geometry, and later-page actions", async ({ page }) => {
  await page.goto("/people");
  await waitForApp(page);
  const peopleRows = page.getByTestId("people-table-row");
  await expect(peopleRows).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Previous page of people" })).toBeDisabled();
  const firstPageIds = await peopleRows.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-person-id")));
  await page.getByRole("button", { name: "Next page of people" }).click();
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  await expect(peopleRows).toHaveCount(10);
  const secondPageIds = await peopleRows.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-person-id")));
  expect(secondPageIds).not.toEqual(firstPageIds);
  expect(secondPageIds.some((id) => firstPageIds.includes(id))).toBe(false);
  await page.getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Applicant" }).click();
  await expect(page.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/Showing 1–10 of 34/)).toBeVisible();

  const geometry = await visibleAvatarGeometry(page);
  expect(geometry).not.toBeNull();
  expect(geometry!.width).toBe(geometry!.height);
  expect(geometry!.centerXDelta).toBeLessThanOrEqual(1);
  expect(geometry!.centerYDelta).toBeLessThanOrEqual(1);

  await page.goto("/applicants");
  await waitForApp(page);
  const applicantCards = page.getByTestId("applicant-card");
  await expect(applicantCards).toHaveCount(8);
  const applicantPageOne = await applicantCards.evaluateAll((cards) => cards.map((card) => card.getAttribute("data-person-id")));
  await page.getByRole("button", { name: "Next page of applicants" }).click();
  const applicantPageTwo = await applicantCards.evaluateAll((cards) => cards.map((card) => card.getAttribute("data-person-id")));
  expect(applicantPageTwo).not.toEqual(applicantPageOne);
  await page.getByTestId("score-breakdown").first().click();
  await expect(page.getByText("Leadership relevance").first()).toBeVisible();

  await page.goto("/introductions");
  await waitForApp(page);
  await expect(page.getByTestId("introduction-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Next page of introductions" }).click();
  const laterCard = page.getByTestId("introduction-card").first();
  const introductionId = await laterCard.getAttribute("data-introduction-id");
  await laterCard.getByTestId("approve-introduction").click();
  await expect(page.getByText("Introduction approved — no message was sent")).toBeVisible();
  await expect(page.locator(`[data-introduction-id="${introductionId}"]`)).toHaveCount(0);

  await page.goto("/import");
  await waitForApp(page);
  await page.getByTestId("load-demo").click();
  await expect(page.getByTestId("import-preview-row")).toHaveCount(10);
  await expect(page.getByText(/Showing 1–10 of 72/)).toBeVisible();
});

test("major routes remain responsive and error-free at target widths", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Relationships, understood." })).toBeVisible();
  for (const [route, heading] of [["/dashboard", "Good morning, Offline team"], ["/people", "People"], ["/people/person-001", "Ananya Rao"], ["/data-quality", "Data quality"], ["/applicants", "Applicants"], ["/introductions", "Suggested introductions"], ["/import", "Import relationship data"]]) {
    await page.goto(route);
    await waitForApp(page);
    await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
  }

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    for (const route of ["/people", "/applicants", "/introductions", "/data-quality"]) {
      await page.goto(route);
      await waitForApp(page);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(hasOverflow, `horizontal overflow at ${route} / ${width}px`).toBe(false);
      const geometry = await visibleAvatarGeometry(page);
      if (geometry) expect(Math.abs(geometry.width - geometry.height)).toBeLessThan(.1);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people");
  await waitForApp(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous page of people" })).toBeDisabled();
  expect(errors).toEqual([]);
});
