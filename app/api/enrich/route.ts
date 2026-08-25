import { NextResponse } from "next/server";
import { z } from "zod";
import { createAIProvider, enrichWithFallback } from "@/lib/ai/provider";

const enrichmentCache = new Map<string, { expiresAt: number; value: unknown }>();

async function inputHash(input: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const requestSchema = z.object({
  jobTitle: z.string().optional(), company: z.string().optional(), industry: z.string().optional(), bio: z.string().optional(), applicationAnswer: z.string().optional(),
  interests: z.array(z.string()).default([]), lookingFor: z.array(z.string()).default([]), canHelpWith: z.array(z.string()).default([]),
  personType: z.enum(["founder", "operator", "investor", "advisor", "other"]).optional(),
});

export async function GET() { const { mode } = createAIProvider(); return NextResponse.json({ mode, provider: mode === "live" ? "OpenAI-compatible" : "Deterministic demo" }); }
export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid enrichment input", issues: parsed.error.flatten() }, { status: 400 });
  const cacheKey = await inputHash(parsed.data); const cached = enrichmentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json({ mode: "cached", enrichment: cached.value });
  const { provider, mode } = createAIProvider(); const enrichment = await enrichWithFallback(parsed.data, provider);
  enrichmentCache.set(cacheKey, { expiresAt: Date.now() + 60 * 60 * 1000, value: enrichment });
  return NextResponse.json({ mode, enrichment });
}
