import type { IntroductionRecommendation, Person } from "@/types";

const overlap = (a: string[], b: string[]) => a.filter((item) => b.some((other) => other.includes(item) || item.includes(other)));
const label = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

export function matchPair(a: Person, b: Person): Omit<IntroductionRecommendation, "id" | "status" | "createdAt"> | null {
  if (a.id === b.id || (a.company && b.company && a.company === b.company)) return null;
  const aNeeds = overlap(a.lookingFor, b.canHelpWith);
  const bNeeds = overlap(b.lookingFor, a.canHelpWith);
  const sharedInterests = overlap(a.interests, b.interests);
  let score = aNeeds.length * 34 + bNeeds.length * 34;
  const reasons: string[] = [];
  if (aNeeds.length) reasons.push(`${b.firstName} can help with ${label(aNeeds[0])}, which ${a.firstName} is seeking`);
  if (bNeeds.length) reasons.push(`${a.firstName} can help with ${label(bNeeds[0])}, which ${b.firstName} is seeking`);
  if (a.industry && a.industry === b.industry) { score += 10; reasons.push(`Relevant experience in ${a.industry}`); }
  if (sharedInterests.length) { score += Math.min(12, sharedInterests.length * 6); reasons.push(`Shared interest in ${label(sharedInterests[0])}`); }
  if (a.location && a.location === b.location) { score += 7; reasons.push(`Both are based in ${a.location}`); }
  if ([a.personType, b.personType].sort().join("-") === "founder-operator") score += 10;
  score = Math.min(100, score);
  if (score < 45 || !aNeeds.length && !bNeeds.length) return null;
  const reasonText = reasons.slice(0, 3);
  return {
    personAId: a.id, personBId: b.id, score, reasons: reasonText,
    explanation: `${a.firstName} is ${a.jobTitle?.toLowerCase() || "building their next chapter"} at ${a.company || "an emerging company"}. ${b.firstName}'s experience and willingness to help create a concrete exchange around ${label((aNeeds[0] || bNeeds[0] || "shared goals"))}.`,
    draftMessage: `Hi ${a.firstName} and ${b.firstName} — I thought you two might enjoy meeting. ${reasonText[0] || "You have complementary experience and goals"}. I'll leave you both to take it from here if the timing feels right.`,
  };
}

export function generateIntroductions(people: Person[], limit = 18) {
  const matches: IntroductionRecommendation[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const key = [people[i].id, people[j].id].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const match = matchPair(people[i], people[j]);
    if (match) matches.push({ ...match, id: `intro-${people[i].id}-${people[j].id}`, status: "suggested", createdAt: new Date(2026, 7, 24).toISOString() });
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
