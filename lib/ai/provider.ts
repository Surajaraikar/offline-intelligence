import { z } from "zod";
import type { Person, PersonType } from "@/types";

export const enrichmentSchema = z.object({
  personType: z.enum(["founder", "operator", "investor", "advisor", "other"]),
  industry: z.string().min(1).max(80),
  interests: z.array(z.string().min(1)).max(8),
  expertise: z.array(z.string().min(1)).max(8),
  lookingFor: z.array(z.string().min(1)).max(8),
  canHelpWith: z.array(z.string().min(1)).max(8),
  profileSummary: z.string().min(20).max(500),
  applicationQuality: z.number().min(0).max(1),
  contributionPotential: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  rationale: z.array(z.string()).max(6),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;
export type EnrichmentInput = Pick<Person, "jobTitle" | "company" | "industry" | "bio" | "applicationAnswer" | "interests" | "lookingFor" | "canHelpWith" | "personType">;
export type MatchInput = { personA: Person; personB: Person; reasons: string[] };
export type MatchExplanation = { explanation: string; confidence: number };

export interface AIProvider {
  enrichPerson(input: EnrichmentInput): Promise<EnrichmentResult>;
  explainIntroduction(input: MatchInput): Promise<MatchExplanation>;
  draftIntroduction(input: MatchInput): Promise<string>;
}

function inferExpertise(input: EnrichmentInput) {
  const text = `${input.jobTitle} ${input.bio}`.toLowerCase();
  const expertise = ["product strategy", "team building"];
  if (/sales|growth|partnership/.test(text)) expertise.unshift("go-to-market");
  if (/technology|cto|engineer|systems/.test(text)) expertise.unshift("technology leadership");
  if (/fund|invest|partner/.test(text)) expertise.unshift("fundraising");
  return [...new Set(expertise)].slice(0, 4);
}

export class DeterministicDemoProvider implements AIProvider {
  async enrichPerson(input: EnrichmentInput): Promise<EnrichmentResult> {
    const answer = input.applicationAnswer || "";
    const specificity = Math.min(1, (answer.length / 180) + (/share|help|office hours|lessons/i.test(answer) ? 0.24 : 0));
    const contribution = Math.min(1, 0.38 + input.canHelpWith.length * 0.14 + (/share|help|mentor|office hours/i.test(answer) ? 0.18 : 0));
    const type = input.personType || (/founder|ceo/i.test(input.jobTitle || "") ? "founder" : "operator") as PersonType;
    return enrichmentSchema.parse({
      personType: type,
      industry: input.industry || "Cross-industry",
      interests: input.interests,
      expertise: inferExpertise(input),
      lookingFor: input.lookingFor,
      canHelpWith: input.canHelpWith,
      profileSummary: `${input.jobTitle || "Community professional"}${input.company ? ` at ${input.company}` : ""}, with experience in ${(input.industry || "building teams").toLowerCase()}. Brings ${inferExpertise(input).slice(0, 2).join(" and ")} expertise and is looking to exchange practical support with peers.`,
      applicationQuality: Number(specificity.toFixed(2)), contributionPotential: Number(contribution.toFixed(2)), confidence: 0.78,
      rationale: ["Role and biography signals", "Specificity of stated goals", "Concrete offers to help"],
    });
  }
  async explainIntroduction(input: MatchInput) { return { explanation: `${input.personA.firstName} and ${input.personB.firstName} have a concrete exchange: ${input.reasons[0] || "complementary goals and experience"}.`, confidence: 0.82 }; }
  async draftIntroduction(input: MatchInput) { return `Hi ${input.personA.firstName} and ${input.personB.firstName} — connecting you because ${input.reasons[0]?.toLowerCase() || "your experience and goals look complementary"}. Hope you enjoy the conversation; I'll leave you both to find a time that works.`; }
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: { apiKey: string; baseUrl: string; model: string }) {}
  private async request<T>(system: string, input: unknown, schema: z.ZodType<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", signal: controller.signal, headers: { "content-type": "application/json", authorization: `Bearer ${this.config.apiKey}` }, body: JSON.stringify({ model: this.config.model, temperature: 0.1, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }] }) });
        if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
        const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        return schema.parse(JSON.parse(body.choices?.[0]?.message?.content || "{}"));
      } catch (error) { lastError = error; } finally { clearTimeout(timeout); }
    }
    throw lastError;
  }
  enrichPerson(input: EnrichmentInput) { return this.request("Classify this profile. Return only JSON matching the requested enrichment fields; all scores must be 0 to 1.", input, enrichmentSchema); }
  explainIntroduction(input: MatchInput) { return this.request("Explain this suggested introduction concisely. Return JSON with explanation and confidence.", { a: input.personA.profileSummary, b: input.personB.profileSummary, reasons: input.reasons }, z.object({ explanation: z.string(), confidence: z.number().min(0).max(1) })); }
  draftIntroduction(input: MatchInput) { return this.request("Draft a warm private-community introduction. Return JSON with draft.", { a: input.personA.firstName, b: input.personB.firstName, reasons: input.reasons }, z.object({ draft: z.string() })).then((result) => result.draft); }
}

export function createAIProvider(): { provider: AIProvider; mode: "live" | "demo" } {
  const key = process.env.AI_API_KEY;
  if (key) return { provider: new OpenAICompatibleProvider({ apiKey: key, baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1", model: process.env.AI_MODEL || "gpt-4.1-mini" }), mode: "live" };
  return { provider: new DeterministicDemoProvider(), mode: "demo" };
}

export async function enrichWithFallback(input: EnrichmentInput, provider: AIProvider) {
  try { return await provider.enrichPerson(input); } catch { return new DeterministicDemoProvider().enrichPerson(input); }
}
