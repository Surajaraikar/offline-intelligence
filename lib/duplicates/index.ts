import type { DuplicateCandidate, Person } from "@/types";
import { canonicalCompany, normalizeEmail, normalizeLinkedInUrl, normalizePhone } from "@/lib/normalization";

export function similarity(a: string, b: string) {
  const x = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const y = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (x === y) return 1;
  if (!x.length || !y.length) return 0;
  const matrix = Array.from({ length: y.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= x.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= y.length; i++) for (let j = 1; j <= x.length; j++) matrix[i][j] = y[i - 1] === x[j - 1] ? matrix[i - 1][j - 1] : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
  return 1 - matrix[y.length][x.length] / Math.max(x.length, y.length);
}

export function detectDuplicates(people: Person[]): DuplicateCandidate[] {
  const results: DuplicateCandidate[] = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const a = people[i]; const b = people[j]; const reasons: string[] = [];
    const emailMatch = a.email && b.email && normalizeEmail(a.email) === normalizeEmail(b.email);
    const linkedinMatch = a.linkedinUrl && b.linkedinUrl && normalizeLinkedInUrl(a.linkedinUrl) === normalizeLinkedInUrl(b.linkedinUrl);
    const phoneMatch = a.phone && b.phone && normalizePhone(a.phone) === normalizePhone(b.phone);
    let level: DuplicateCandidate["level"] | undefined; let confidence = 0;
    if (emailMatch || linkedinMatch || phoneMatch) {
      level = "exact"; confidence = 98;
      if (emailMatch) reasons.push("Same normalized email");
      if (linkedinMatch) reasons.push("Same normalized LinkedIn URL");
      if (phoneMatch) reasons.push("Same normalized phone");
    } else {
      const nameScore = similarity(a.fullName, b.fullName);
      const companyMatch = !!canonicalCompany(a.company) && canonicalCompany(a.company) === canonicalCompany(b.company);
      const titleScore = similarity(a.jobTitle || "", b.jobTitle || "");
      const locationMatch = !!a.location && a.location.toLowerCase() === b.location?.toLowerCase();
      if (nameScore >= 0.78 && companyMatch) { level = "probable"; confidence = Math.round(78 + nameScore * 15); reasons.push("Similar name", "Same normalized company"); }
      else if (nameScore >= 0.68 && titleScore >= 0.55 && locationMatch) { level = "possible"; confidence = Math.round(58 + nameScore * 18); reasons.push("Similar name", "Overlapping job title", "Same location"); }
    }
    if (level) results.push({ id: `dup-${a.id}-${b.id}`, personAId: a.id, personBId: b.id, confidence, level, reasons, status: "pending" });
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}
