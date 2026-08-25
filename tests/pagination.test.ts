import { describe, expect, it } from "vitest";
import { clampPage, pageCount, paginate, paginationTokens } from "@/lib/pagination";

const records = Array.from({ length: 23 }, (_, index) => ({ id: `record-${index + 1}`, group: index % 2 ? "member" : "applicant" }));

describe("client pagination", () => {
  it("returns the configured number of records and correct boundaries", () => {
    const first = paginate(records, 1, 10);
    const last = paginate(records, 3, 10);
    expect(first.items).toHaveLength(10);
    expect(first.items[0].id).toBe("record-1");
    expect(first.items[9].id).toBe("record-10");
    expect(last.items).toHaveLength(3);
    expect(last.items[0].id).toBe("record-21");
    expect(last.items[2].id).toBe("record-23");
    expect(last.endIndex).toBe(23);
  });

  it("paginates filtered results while retaining the full filtered count", () => {
    const filtered = records.filter((record) => record.group === "applicant");
    const result = paginate(filtered, 1, 5);
    expect(result.totalItems).toBe(filtered.length);
    expect(result.items).toEqual(filtered.slice(0, 5));
    expect(result.totalPages).toBe(pageCount(filtered.length, 5));
  });

  it("clamps the page when the collection shrinks", () => {
    expect(clampPage(8, 72, 10)).toBe(8);
    expect(clampPage(8, 12, 10)).toBe(2);
    expect(paginate(records.slice(0, 4), 3, 10).page).toBe(1);
  });

  it("does not duplicate or omit records across pages", () => {
    const pages = Array.from({ length: pageCount(records.length, 8) }, (_, index) => paginate(records, index + 1, 8).items).flat();
    expect(pages.map((record) => record.id)).toEqual(records.map((record) => record.id));
    expect(new Set(pages.map((record) => record.id)).size).toBe(records.length);
  });

  it("exposes first and last pages with compact ellipses", () => {
    expect(paginationTokens(1, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 12]);
    expect(paginationTokens(7, 12)).toEqual([1, "ellipsis-start", 6, 7, 8, "ellipsis-end", 12]);
    expect(paginationTokens(12, 12)).toEqual([1, "ellipsis-start", 8, 9, 10, 11, 12]);
  });
});
