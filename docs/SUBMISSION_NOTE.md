# Offline Intelligence — submission note

## What I built

Offline Intelligence is a production-style prototype that converts inconsistent relationship and applicant data into an actionable CRM for a founder community. It loads 72 deterministic fictional records, normalizes their structure, surfaces duplicate and incomplete profiles, classifies unstructured context, ranks applicants with an explainable fit score, recommends useful introductions, and keeps every consequential action behind human approval.

The operator experience spans a dashboard, searchable people directory, detailed profiles, data-quality queues, applicant review, introduction review, and a guarded import workflow. Merge and introduction decisions persist locally across refreshes and remain reversible in the prototype.

## Architecture

The application uses Next.js App Router, React, TypeScript, Tailwind CSS, Zod, and Lucide icons. A typed processing layer separates raw import records from cleaned `Person` records. Deterministic utilities handle normalization, validation, completeness, duplicate rules, weighted scoring, and initial compatibility matching.

The repository boundary defaults to a seeded local provider so the product works immediately without credentials. The included PostgreSQL migration maps the same domain into Supabase-ready tables for people, raw imports, processing runs, duplicate candidates, fit assessments, introduction recommendations, and activity events.

AI access sits behind an `AIProvider` interface with `OpenAICompatibleProvider` and `DeterministicDemoProvider` implementations. Live calls are server-only through an API route, use structured JSON, are validated with Zod, use a timeout and limited retry, and fall back to deterministic enrichment if the request fails. The prototype labels this fallback as “Demo AI.”

## Where AI was useful

AI is reserved for ambiguous, unstructured information: biographies, application responses, interests and goals, contribution potential, profile summaries, match explanations, and warm introduction drafts.

Conventional code handles trimming and normalization, contact validation, missing fields, exact duplicate detection, weighted score arithmetic, and initial compatibility scoring. The final fit score is never invented by a language model. AI supports operator decisions; it never merges records or sends an introduction automatically.

## What I would build next with another week

- Production Airtable two-way synchronization with conflict handling
- Webhook-triggered and scheduled processing
- Relationship, interaction, and existing-connection history
- Feedback-driven matching from operator decisions
- Email and calendar integration with explicit approval before sending
- External enrichment only with consent and privacy safeguards
- Immutable audit logs and role-based access controls
- Background jobs, retries, dead-letter handling, and monitoring
- AI cost, latency, confidence, and quality tracking
- Metrics for accepted introductions and resulting conversations
- Stronger security, privacy, retention, and deletion controls

The current prototype does not send external messages, perform durable server-side writes, sync Airtable, or claim that its fictional data represents real Offline members.
