"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleCheck, DatabaseZap, Network, RefreshCw, UserCheck, UsersRound } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Badge, PageHeader, PersonLink, ProgressBar } from "@/components/ui";
import type { ProcessingStage } from "@/types";

const stageInfo: Array<{ key: ProcessingStage; label: string }> = [
  { key: "normalizing", label: "Normalizing" }, { key: "quality", label: "Checking data quality" }, { key: "classifying", label: "Classifying profiles" }, { key: "scoring", label: "Calculating fit" }, { key: "matching", label: "Generating introductions" }, { key: "complete", label: "Complete" },
];

export default function DashboardPage() {
  const { people, duplicates, introductions, activity, stage, processDataset } = useApp();
  const applicants = people.filter((p) => p.lifecycleStatus === "applicant");
  const strong = applicants.filter((p) => (p.fitScore || 0) >= 80);
  const incomplete = people.filter((p) => p.completenessScore < 70);
  const pendingDuplicates = duplicates.filter((d) => d.status === "pending");
  const suggested = introductions.filter((i) => i.status === "suggested");
  const completeness = people.length ? Math.round(people.reduce((sum, p) => sum + p.completenessScore, 0) / people.length) : 0;
  const processing = !["idle", "complete"].includes(stage);

  return <div className="page dashboard-page">
    <div className="demo-banner"><span><DatabaseZap size={16} /> Fictional demonstration data</span><small>All names, companies and contact details are synthetic.</small></div>
    <PageHeader eyebrow="Relationship operations" title="Good morning, Offline team" description="See who needs attention, which applicants stand out, and where a thoughtful introduction could help." action={<button className="button button-primary" onClick={() => void processDataset()} disabled={processing} data-testid="process-dataset">{processing ? <RefreshCw className="spin" size={17} /> : <DatabaseZap size={17} />}{processing ? "Processing…" : "Process sample dataset"}</button>} />

    {processing && <section className="processing-card" aria-live="polite"><div><span className="processing-icon"><RefreshCw className="spin" size={20} /></span><div><strong>Processing your relationship graph</strong><p>Deterministic checks run first; Demo AI handles unstructured context.</p></div></div><div className="stage-list">{stageInfo.map((item, index) => { const activeIndex = stageInfo.findIndex((s) => s.key === stage); return <span key={item.key} className={index < activeIndex ? "done" : index === activeIndex ? "active" : ""}>{index < activeIndex ? "✓" : index + 1}<small>{item.label}</small></span>; })}</div></section>}

    <section className="metric-grid" aria-label="Key metrics">
      <Metric label="Total people" value={people.length} detail="Across 4 lifecycle stages" icon={<UsersRound />} />
      <Metric label="New applicants" value={applicants.length} detail="Awaiting human review" icon={<UserCheck />} />
      <Metric label="Strong fit" value={strong.length} detail="Scored 80 or higher" icon={<CircleCheck />} tone="good" />
      <Metric label="Possible duplicates" value={pendingDuplicates.length} detail="Never auto-merged" icon={<AlertTriangle />} tone="warn" />
      <Metric label="Incomplete profiles" value={incomplete.length} detail="Below 70% complete" icon={<AlertTriangle />} />
      <Metric label="Suggested intros" value={suggested.length} detail="Require your approval" icon={<Network />} tone="accent" />
    </section>

    <section className="dashboard-grid">
      <div className="card span-2"><div className="card-header"><div><p className="eyebrow">Portfolio view</p><h2>Applicant-fit distribution</h2></div><Badge tone="neutral">Prioritization aid</Badge></div><FitDistribution applicants={applicants} /><p className="microcopy">Scores rank the review queue; they do not replace operator judgment.</p></div>
      <div className="card health-card"><div className="card-header"><div><p className="eyebrow">Dataset health</p><h2>{completeness}% complete</h2></div><span className="health-score">{completeness}</span></div><ProgressBar value={completeness} tone={completeness > 75 ? "green" : "amber"} /><div className="health-list"><span><i className="dot green" />{people.filter((p) => p.completenessScore >= 80).length} healthy profiles</span><span><i className="dot amber" />{incomplete.length} need enrichment</span><span><i className="dot red" />{people.filter((p) => p.dataIssues.some((i) => i.includes("Invalid") || i.includes("Suspicious"))).length} contact warnings</span></div></div>
      <div className="card span-2"><div className="card-header"><div><p className="eyebrow">Operator queue</p><h2>Needs attention</h2></div><Link className="text-link" href="/data-quality">Review all <ArrowRight size={15} /></Link></div><div className="attention-list"><AttentionItem href="/data-quality?tab=exact" count={duplicates.filter((d) => d.level === "exact" && d.status === "pending").length} label="Exact duplicate candidates" detail="Shared email, LinkedIn URL or phone" tone="danger" /><AttentionItem href="/data-quality?tab=incomplete" count={incomplete.length} label="Incomplete profiles" detail="Important context is missing" tone="warn" /><AttentionItem href="/data-quality?tab=contact" count={people.filter((p) => p.dataIssues.some((i) => i.includes("Invalid") || i.includes("Suspicious"))).length} label="Suspicious contact details" detail="Validate before reaching out" tone="neutral" /></div></div>
      <div className="card"><div className="card-header"><div><p className="eyebrow">Latest processing</p><h2>Recently processed</h2></div></div><div className="recent-people">{people.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3).map((person) => <PersonLink key={person.id} person={person} compact />)}</div><div className="subsection-title">Audit trail</div><div className="activity-list">{activity.slice(0, 3).map((event) => <div key={event.id}><span className="activity-icon">{event.type === "introduction" ? "↗" : event.type === "duplicate" ? "≋" : "✓"}</span><div><strong>{event.title}</strong><p>{event.detail}</p><small>{new Date(event.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></div></div>)}</div></div>
    </section>
  </div>;
}

function Metric({ label, value, detail, icon, tone = "default" }: { label: string; value: number; detail: string; icon: React.ReactNode; tone?: string }) { return <div className={`metric-card metric-${tone}`}><span className="metric-icon">{icon}</span><div><small>{label}</small><strong>{value || "—"}</strong><p>{detail}</p></div></div>; }

function FitDistribution({ applicants }: { applicants: ReturnType<typeof useApp>["people"] }) {
  const bands = [{ label: "Strong fit", min: 80, max: 100, color: "green" }, { label: "Potential fit", min: 65, max: 79, color: "amber" }, { label: "Needs review", min: 45, max: 64, color: "orange" }, { label: "Low fit", min: 0, max: 44, color: "gray" }];
  return <div className="distribution">{bands.map((band) => { const count = applicants.filter((p) => (p.fitScore || 0) >= band.min && (p.fitScore || 0) <= band.max).length; const width = applicants.length ? Math.max(4, count / applicants.length * 100) : 0; return <div key={band.label}><span>{band.label}<small>{band.min}–{band.max}</small></span><div className="dist-track"><i className={`dist-${band.color}`} style={{ width: `${width}%` }} /></div><strong>{count}</strong></div>; })}</div>;
}

function AttentionItem({ href, count, label, detail, tone }: { href: string; count: number; label: string; detail: string; tone: string }) { return <Link href={href}><span className={`attention-count ${tone}`}>{count}</span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={17} /></Link>; }
