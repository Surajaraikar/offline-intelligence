"use client";

import Link from "next/link";
import { AlertTriangle, Check, Clock3, GitMerge, ShieldCheck, Split } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, DataIssue, EmptyState, PageHeader, ProgressBar, ScoreRing } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";
import type { DuplicateCandidate, Person } from "@/types";

const tabs = ["exact", "probable", "possible", "incomplete", "contact"] as const;
type Tab = typeof tabs[number];

export default function DataQualityPage() {
  const { people, duplicates, decideDuplicate } = useApp();
  const [tab, setTab] = useState<Tab>("exact");
  useEffect(() => { const value = new URLSearchParams(window.location.search).get("tab") as Tab | null; if (value && tabs.includes(value)) setTab(value); }, []); // eslint-disable-line react-hooks/set-state-in-effect
  const incomplete = people.filter((person) => person.completenessScore < 70);
  const contact = people.filter((person) => person.dataIssues.some((issue) => issue.includes("Invalid") || issue.includes("Suspicious") || issue.includes("contact")));
  const counts: Record<Tab, number> = { exact: duplicates.filter((candidate) => candidate.level === "exact").length, probable: duplicates.filter((candidate) => candidate.level === "probable").length, possible: duplicates.filter((candidate) => candidate.level === "possible").length, incomplete: incomplete.length, contact: contact.length };
  const pending = duplicates.filter((candidate) => candidate.status === "pending").length + incomplete.length;

  return <div className="page quality-page"><PageHeader eyebrow="Human review" title="Data quality" description="Resolve identity collisions and missing context while preserving source-record auditability." action={<Badge tone="warn">{pending} need attention</Badge>} />
    <div className="quality-summary" data-spotlight><Metric icon={<ShieldCheck />} value={people.filter((person) => person.dataIssues.length === 0).length} label="Healthy profiles" tone="good" /><Metric icon={<GitMerge />} value={duplicates.length} label="Duplicate candidates" tone="copper" /><Metric icon={<AlertTriangle />} value={incomplete.length} label="Incomplete profiles" tone="warn" /><p>Deterministic rules surface candidates. An operator always decides.</p></div>
    <div className="tabs quality-tabs" role="tablist" aria-label="Data quality categories">{tabs.map((item) => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "contact" ? "Contact issues" : item[0].toUpperCase() + item.slice(1)}<span>{counts[item]}</span></button>)}</div>
    <div className="tab-transition" key={tab}>{(["exact", "probable", "possible"] as Tab[]).includes(tab) && <DuplicateList candidates={duplicates.filter((candidate) => candidate.level === tab)} people={people} decide={decideDuplicate} />}{tab === "incomplete" && <ProfileIssues people={incomplete} />}{tab === "contact" && <ProfileIssues people={contact} contact />}</div>
  </div>;
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) { return <div className={`quality-metric metric-${tone}`}>{icon}<span><strong>{value}</strong><small>{label}</small><i /></span></div>; }

function DuplicateList({ candidates, people, decide }: { candidates: DuplicateCandidate[]; people: Person[]; decide: (id: string, status: DuplicateCandidate["status"]) => void }) {
  const pagination = usePagination(candidates, DEFAULT_PAGE_SIZES.dataQuality);
  const [merging, setMerging] = useState<string>();
  const approveMerge = (id: string) => { setMerging(id); window.setTimeout(() => { decide(id, "merged"); setMerging(undefined); }, 720); };
  if (!candidates.length) return <EmptyState title="Nothing in this queue" body="No candidates currently meet this confidence threshold." />;
  return <><div className="duplicate-list">{pagination.items.map((candidate) => {
    const personA = people.find((person) => person.id === candidate.personAId);
    const personB = people.find((person) => person.id === candidate.personBId);
    if (!personA || !personB) return null;
    const isMerging = merging === candidate.id;
    return <article className={`duplicate-card status-${candidate.status} ${isMerging ? "is-merging" : ""}`} key={candidate.id} data-testid="duplicate-card" data-candidate-id={candidate.id}>
      <div className="duplicate-header"><div><Badge tone={candidate.level === "exact" ? "danger" : candidate.level === "probable" ? "warn" : "neutral"}>{candidate.level} · {candidate.confidence}%</Badge><span>Candidate {candidate.id.replace("dup-", "")}</span></div><Badge tone={candidate.status === "pending" ? "warn" : "good"}>{candidate.status === "pending" ? "Pending review" : <><Check size={12} /> {candidate.status.replaceAll("_", " ")}</>}</Badge></div>
      <div className="comparison"><PersonRecord person={personA} /><div className="match-rationale"><span className="match-label">Match engine</span><ScoreRing value={candidate.confidence} label="confidence" /><div className="match-signals">{candidate.reasons.map((reason) => <small key={reason}><Check size={12} />{reason}</small>)}</div><i className="merge-connection" aria-hidden="true" /></div><PersonRecord person={personB} /></div>
      <div className="decision-bar"><p>Raw source records remain available. Approved merges are reversible.</p><div>{candidate.status === "merged" ? <button className="button button-secondary" onClick={() => decide(candidate.id, "pending")}><Split size={15} /> Undo merge</button> : <><button className="button button-ghost" onClick={() => decide(candidate.id, "review_later")}><Clock3 size={15} /> Review later</button><button className="button button-secondary" onClick={() => decide(candidate.id, "kept_separate")}><Split size={15} /> Keep separate</button><button className="button button-primary" onClick={() => approveMerge(candidate.id)} disabled={isMerging} data-testid="approve-merge"><GitMerge className={isMerging ? "spin" : ""} size={15} /> {isMerging ? "Merging…" : "Approve merge"}</button></>}</div></div>
    </article>;
  })}</div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="duplicate candidates" /></>;
}

function PersonRecord({ person }: { person: Person }) {
  return <div className="record-card"><div><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.id}</small></span></div><dl><Field label="Email" value={person.email} /><Field label="LinkedIn" value={person.linkedinUrl?.replace("https://www.linkedin.com/in/", "in/")} /><Field label="Company" value={person.company} /><Field label="Role" value={person.jobTitle} /><Field label="Location" value={person.location} /></dl></div>;
}
function Field({ label, value }: { label: string; value?: string }) { return <div><dt>{label}</dt><dd>{value || <em>Missing</em>}</dd></div>; }

function ProfileIssues({ people, contact = false }: { people: Person[]; contact?: boolean }) {
  const pagination = usePagination(people, DEFAULT_PAGE_SIZES.dataQuality);
  if (!people.length) return <EmptyState title="Queue is clear" body="No profiles currently need attention here." />;
  return <><div className="issue-table"><div className="issue-table-head"><span>Person</span><span>{contact ? "Contact warning" : "Completeness"}</span><span>Missing information</span><span>Next action</span></div>{pagination.items.map((person) => <div className="issue-row" key={person.id} data-testid="quality-profile-row"><div><Avatar person={person} size="sm" /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"}</small></span></div><div>{contact ? <Badge tone="danger">Validate</Badge> : <><strong>{person.completenessScore}%</strong><ProgressBar value={person.completenessScore} /></>}</div><div className="issue-list">{person.dataIssues.filter((issue) => !contact || issue.includes("Invalid") || issue.includes("Suspicious") || issue.includes("contact")).map((issue) => <DataIssue key={issue}>{issue}</DataIssue>)}</div><Link className="button button-secondary" href={`/people/${person.id}`}>Open profile</Link></div>)}</div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel={contact ? "contact issues" : "incomplete profiles"} /></>;
}
