import type { Person, PersonType, RawPersonRecord } from "@/types";

const titleCase = (value: string) => value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, p, c) => `${p}${c.toUpperCase()}`);

export function normalizeName(value = "") {
  return titleCase(value.trim().replace(/\s+/g, " "));
}

export function normalizeEmail(value?: string) {
  const email = value?.trim().toLowerCase();
  return email || undefined;
}

export function isValidEmail(value?: string) {
  return !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeLinkedInUrl(value?: string) {
  if (!value?.trim()) return undefined;
  let cleaned = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  cleaned = cleaned.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!cleaned.startsWith("linkedin.com/in/")) return undefined;
  return `https://www.${cleaned}`;
}

export function normalizePhone(value?: string) {
  if (!value?.trim()) return undefined;
  const hasPlus = value.trim().startsWith("+");
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 10 || digits.length > 15) return undefined;
  return `${hasPlus || digits.startsWith("91") ? "+" : "+"}${digits}`;
}

export function normalizeCompany(value?: string) {
  if (!value?.trim()) return undefined;
  const cleaned = value.trim().replace(/[.,]/g, "").replace(/\s+/g, " ");
  return titleCase(cleaned).replace(/\bPvt Ltd\b/i, "Pvt Ltd").replace(/\bAi\b/g, "AI");
}

export function canonicalCompany(value?: string) {
  return (value || "").toLowerCase().replace(/\b(private|pvt|limited|ltd|inc|llc|technologies|technology)\b/g, "").replace(/[^a-z0-9]/g, "");
}

export function normalizeJobTitle(value?: string) {
  if (!value?.trim()) return undefined;
  const key = value.trim().toLowerCase().replace(/[._-]/g, " ").replace(/\s+/g, " ");
  const map: Record<string, string> = {
    ceo: "Founder & CEO", "co founder": "Co-founder", cofounder: "Co-founder",
    cto: "Chief Technology Officer", coo: "Chief Operating Officer",
    "vp sales": "VP, Sales", "head growth": "Head of Growth", "product lead": "Product Lead",
  };
  return map[key] || titleCase(key);
}

export function parseList(value?: string) {
  if (!value?.trim()) return [];
  return [...new Set(value.split(/[,;|]/).map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function requiredFieldIssues(person: Pick<Person, "fullName" | "email" | "linkedinUrl" | "company" | "jobTitle" | "bio" | "lifecycleStatus">) {
  const issues: string[] = [];
  if (!person.fullName) issues.push("Missing name");
  if (!person.email && !person.linkedinUrl) issues.push("No contact channel");
  if (!person.company) issues.push("Missing company");
  if (!person.jobTitle) issues.push("Missing job title");
  if (!person.bio) issues.push("Missing bio");
  if (person.lifecycleStatus === "applicant" && !person.email) issues.push("Applicant email missing");
  return issues;
}

export function calculateCompleteness(person: Partial<Person>) {
  const checks = [person.fullName, person.email || person.phone, person.linkedinUrl, person.company, person.jobTitle, person.location, person.industry, person.bio, person.interests?.length, person.lookingFor?.length || person.canHelpWith?.length];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function mapType(value?: string): PersonType {
  const type = value?.trim().toLowerCase();
  return ["founder", "operator", "investor", "advisor"].includes(type || "") ? type as PersonType : "other";
}

export function normalizeRawRecord(raw: RawPersonRecord): Person {
  const fullName = normalizeName(raw.name);
  const parts = fullName.split(" ");
  const email = normalizeEmail(raw.email);
  const linkedinUrl = normalizeLinkedInUrl(raw.linkedin);
  const person: Person = {
    id: raw.id,
    firstName: parts[0] || "Unknown",
    lastName: parts.slice(1).join(" "),
    fullName,
    email,
    phone: normalizePhone(raw.phone),
    linkedinUrl,
    company: normalizeCompany(raw.company),
    jobTitle: normalizeJobTitle(raw.title),
    location: raw.location ? normalizeName(raw.location) : undefined,
    industry: raw.industry ? normalizeName(raw.industry) : undefined,
    personType: mapType(raw.type),
    lifecycleStatus: (["applicant", "member", "alumni", "prospect"].includes(raw.status.toLowerCase()) ? raw.status.toLowerCase() : "prospect") as Person["lifecycleStatus"],
    bio: raw.bio?.trim(),
    applicationAnswer: raw.application?.trim(),
    interests: parseList(raw.interests),
    expertise: [],
    lookingFor: parseList(raw.lookingFor),
    canHelpWith: parseList(raw.canHelpWith),
    completenessScore: 0,
    dataIssues: [],
    source: "demo",
    enrichmentStatus: "not_started",
    createdAt: raw.createdAt,
    updatedAt: raw.createdAt,
    rawRecordId: raw.id,
  };
  if (email && !isValidEmail(email)) person.dataIssues.push("Invalid email format");
  if (raw.linkedin && !linkedinUrl) person.dataIssues.push("Suspicious LinkedIn URL");
  person.dataIssues.push(...requiredFieldIssues(person));
  person.completenessScore = calculateCompleteness(person);
  return person;
}
