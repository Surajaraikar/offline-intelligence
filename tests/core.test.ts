import { describe, expect, it } from "vitest";
import { calculateCompleteness, canonicalCompany, normalizeEmail, normalizeLinkedInUrl, normalizeName, requiredFieldIssues } from "@/lib/normalization";
import { detectDuplicates } from "@/lib/duplicates";
import { calculateFitScore } from "@/lib/scoring";
import { generateIntroductions, matchPair } from "@/lib/matching";
import { enrichmentSchema, enrichWithFallback, type AIProvider } from "@/lib/ai/provider";
import { processDemoDataset } from "@/lib/data/process";

describe("normalization", () => {
  it("normalizes emails", () => expect(normalizeEmail(" Ananya@Example.TEST ")).toBe("ananya@example.test"));
  it("normalizes LinkedIn profile URLs", () => expect(normalizeLinkedInUrl("HTTP://linkedin.com/in/Ananya-Rao/?trk=x")).toBe("https://www.linkedin.com/in/ananya-rao"));
  it("normalizes names and canonical companies", () => { expect(normalizeName("  aNANYA   rAO ")).toBe("Ananya Rao"); expect(canonicalCompany("Kite Robotics Pvt. Ltd.")).toBe("kiterobotics"); });
  it("detects missing required fields", () => expect(requiredFieldIssues({ fullName: "A", lifecycleStatus: "applicant" })).toEqual(expect.arrayContaining(["No contact channel", "Missing company", "Applicant email missing"])));
  it("calculates profile completeness between 0 and 100", () => { expect(calculateCompleteness({ fullName: "A" })).toBe(10); expect(calculateCompleteness({ fullName: "A", email: "a@b.test", linkedinUrl: "x", company: "C", jobTitle: "T", location: "L", industry: "I", bio: "B", interests: ["x"], lookingFor: ["y"] })).toBe(100); });
});

describe("duplicate detection", () => {
  it("finds exact, probable, and possible candidates", async () => { const { duplicates } = await processDemoDataset(); expect(duplicates.some((d) => d.level === "exact")).toBe(true); expect(duplicates.some((d) => d.level === "probable")).toBe(true); expect(duplicates.some((d) => d.level === "possible")).toBe(true); });
  it("uses normalized exact emails", async () => { const { people } = await processDemoDataset(); const candidates = detectDuplicates(people); expect(candidates.some((d) => d.reasons.includes("Same normalized email"))).toBe(true); });
});

describe("fit scoring", () => {
  it("keeps the weighted total within bounds and sums components", async () => { const { people } = await processDemoDataset(); const score = calculateFitScore(people[0]); const sum = score.leadershipRelevance.score + score.experienceRelevance.score + score.contributionPotential.score + score.applicationQuality.score + score.networkRelevance.score + score.profileCompleteness.score; expect(score.total).toBe(sum); expect(score.total).toBeGreaterThanOrEqual(0); expect(score.total).toBeLessThanOrEqual(100); });
});

describe("introduction matching", () => {
  it("prevents self matches and same-company matches", async () => { const { people } = await processDemoDataset(); expect(matchPair(people[0], people[0])).toBeNull(); const clone = { ...people[1], company: people[0].company }; expect(matchPair(people[0], clone)).toBeNull(); });
  it("returns unique unordered pairs", async () => { const { people } = await processDemoDataset(); const matches = generateIntroductions(people, 50); const pairs = matches.map((m) => [m.personAId, m.personBId].sort().join("|")); expect(matches.length).toBeGreaterThan(0); expect(new Set(pairs).size).toBe(pairs.length); expect(matches.every((m) => m.score >= 45)).toBe(true); });
});

describe("AI validation and fallback", () => {
  it("rejects out-of-range AI scores", () => expect(() => enrichmentSchema.parse({ personType: "founder", industry: "Health", interests: [], expertise: [], lookingFor: [], canHelpWith: [], profileSummary: "A sufficiently descriptive profile summary.", applicationQuality: 2, contributionPotential: .5, confidence: .8, rationale: [] })).toThrow());
  it("falls back deterministically when a provider fails", async () => { const failing: AIProvider = { enrichPerson: async () => { throw new Error("offline"); }, explainIntroduction: async () => ({ explanation: "x", confidence: 1 }), draftIntroduction: async () => "x" }; const result = await enrichWithFallback({ jobTitle: "Founder", company: "Nimble", industry: "Healthcare", bio: "10 years building teams", interests: [], lookingFor: ["fundraising"], canHelpWith: ["product strategy"], personType: "founder" }, failing); expect(result.personType).toBe("founder"); expect(result.confidence).toBeLessThanOrEqual(1); });
});
