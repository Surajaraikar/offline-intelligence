import type { FitBreakdown, Person } from "@/types";

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));

export function calculateFitScore(person: Person): FitBreakdown {
  const seniorTitle = /founder|chief|vp|vice president|head|director|partner/i.test(person.jobTitle || "");
  const leadership = person.personType === "founder" ? 25 : person.personType === "operator" && seniorTitle ? 22 : seniorTitle ? 17 : 8;
  const years = Number(person.bio?.match(/(\d{1,2})\+? years?/i)?.[1] || 0);
  const experience = Math.min(20, 7 + Math.min(years, 12) + (person.expertise.length >= 2 ? 2 : 0));
  const contribution = (person.contributionPotential ?? 0.5) * 20;
  const quality = (person.applicationQuality ?? 0.5) * 15;
  const network = Math.min(10, 3 + person.lookingFor.length * 1.2 + person.canHelpWith.length * 1.4 + (person.interests.length ? 1 : 0));
  const completeness = person.completenessScore / 10;
  const breakdown: FitBreakdown = {
    leadershipRelevance: { score: clamp(leadership, 25), max: 25, reason: leadership >= 22 ? "Founder or senior operator role" : leadership >= 17 ? "Relevant leadership role" : "Limited leadership signal" },
    experienceRelevance: { score: clamp(experience, 20), max: 20, reason: years ? `${years}+ years of relevant experience` : "Experience inferred from role and expertise" },
    contributionPotential: { score: clamp(contribution, 20), max: 20, reason: person.canHelpWith.length >= 2 ? "Offers multiple concrete ways to help peers" : "Contribution signal is still developing" },
    applicationQuality: { score: clamp(quality, 15), max: 15, reason: (person.applicationQuality || 0) > 0.72 ? "Specific, thoughtful application response" : (person.applicationQuality || 0) > 0.48 ? "Clear but could be more specific" : "Thin or generic application response" },
    networkRelevance: { score: clamp(network, 10), max: 10, reason: "Based on needs, offers, and community overlap" },
    profileCompleteness: { score: clamp(completeness, 10), max: 10, reason: `${person.completenessScore}% of useful profile fields present` },
    total: 0,
  };
  breakdown.total = Object.entries(breakdown).filter(([key]) => key !== "total").reduce((sum, [, value]) => sum + (value as { score: number }).score, 0);
  return breakdown;
}

export function fitBand(score = 0) {
  if (score >= 80) return "Strong fit";
  if (score >= 65) return "Potential fit";
  if (score >= 45) return "Needs review";
  return "Low fit";
}

export function fitBreakdownParts(breakdown?: FitBreakdown) {
  if (!breakdown) return [];
  return Object.entries(breakdown)
    .filter(([key]) => key !== "total")
    .map(([key, value]) => ({ key, part: value as { score: number; max: number; reason: string } }));
}
