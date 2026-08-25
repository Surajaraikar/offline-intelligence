import { rawDemoPeople } from "@/data/generated-people";
import { DeterministicDemoProvider } from "@/lib/ai/provider";
import { detectDuplicates } from "@/lib/duplicates";
import { generateIntroductions } from "@/lib/matching";
import { normalizeRawRecord, calculateCompleteness, requiredFieldIssues } from "@/lib/normalization";
import { calculateFitScore } from "@/lib/scoring";
import type { ActivityEvent, Person } from "@/types";

export async function processDemoDataset() {
  const provider = new DeterministicDemoProvider();
  const people: Person[] = [];
  for (const raw of rawDemoPeople) {
    const person = normalizeRawRecord(raw);
    const enrichment = await provider.enrichPerson(person);
    Object.assign(person, enrichment, { enrichmentStatus: "complete" as const });
    person.completenessScore = calculateCompleteness(person);
    person.dataIssues = [...new Set([...person.dataIssues.filter((issue) => issue.includes("Invalid") || issue.includes("Suspicious")), ...requiredFieldIssues(person)])];
    person.fitBreakdown = calculateFitScore(person);
    person.fitScore = person.fitBreakdown.total;
    people.push(person);
  }
  const duplicates = detectDuplicates(people);
  const introductions = generateIntroductions(people);
  const now = new Date(Date.UTC(2026, 7, 25, 10)).toISOString();
  const activity: ActivityEvent[] = [
    { id: "evt-1", type: "import", title: "Demo dataset imported", detail: `${rawDemoPeople.length} fictional records loaded`, createdAt: now },
    { id: "evt-2", type: "normalize", title: "Records normalized", detail: "Names, contact details, companies and titles cleaned", createdAt: now },
    { id: "evt-3", type: "duplicate", title: "Duplicate review prepared", detail: `${duplicates.length} candidate pairs need human review`, createdAt: now },
    { id: "evt-4", type: "fit", title: "Applicant fit calculated", detail: "Transparent weighted scores generated", createdAt: now },
    { id: "evt-5", type: "introduction", title: "Introductions suggested", detail: `${introductions.length} high-signal matches found`, createdAt: now },
  ];
  return { people, duplicates, introductions, activity };
}
