"use client";

import Link from "next/link";
import { AlertTriangle, Check, Clock3, GitMerge, ShieldCheck, Split } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, DataIssue, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";
import type { DuplicateCandidate, Person } from "@/types";

const tabs = ["exact", "probable", "possible", "incomplete", "contact"] as const;
type Tab = typeof tabs[number];

export default function DataQualityPage() {
  const { people, duplicates, decideDuplicate } = useApp();
  const [tab, setTab] = useState<Tab>("exact");
  useEffect(() => { const value = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    // URL state becomes available only after the client mounts in the local demo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value && tabs.includes(value)) setTab(value); }, []);
  const incomplete = people.filter((person) => person.completenessScore < 70);
  const contact = people.filter((person) => person.dataIssues.some((issue) => issue.includes("Invalid") || issue.includes("Suspicious") || issue.includes("contact")));
  const counts: Record<Tab, number> = { exact: duplicates.filter((candidate) => candidate.level === "exact").length, probable: duplicates.filter((candidate) => candidate.level === "probable").length, possible: duplicates.filter((candidate) => candidate.level === "possible").length, incomplete: incomplete.length, contact: contact.length };

  return <div className="page quality-page"><PageHeader eyebrow="Human review queue" title="Data quality" description="Resolve identity collisions and fill important gaps without losing source-record auditability." action={<Badge tone="warn">{duplicates.filter((candidate) => candidate.status === "pending").length + incomplete.length} need attention</Badge>} />
    <div className="quality-summary"><div><ShieldCheck size={20} /><span><strong>{people.filter((person) => person.dataIssues.length === 0).length}</strong><small>Healthy profiles</small></span></div><div><GitMerge size={20} /><span><strong>{duplicates.length}</strong><small>Duplicate candidates</small></span></div><div><AlertTriangle size={20} /><span><strong>{incomplete.length}</strong><small>Incomplete profiles</small></span></div><p>Deterministic rules surface candidates. An operator always decides.</p></div>
    <div className="tabs" role="tablist" aria-label="Data quality categories">{tabs.map((item) => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item === "contact" ? "Contact issues" : item[0].toUpperCase() + item.slice(1)}<span>{counts[item]}</span></button>)}</div>
    {(["exact", "probable", "possible"] as Tab[]).includes(tab) && <DuplicateList key={tab} candidates={duplicates.filter((candidate) => candidate.level === tab)} people={people} decide={decideDuplicate} />}
    {tab === "incomplete" && <ProfileIssues key="incomplete" people={incomplete} />}
    {tab === "contact" && <ProfileIssues key="contact" people={contact} contact />}
  </div>;
}

function DuplicateList({ candidates, people, decide }: { candidates: DuplicateCandidate[]; people: Person[]; decide: (id: string, status: DuplicateCandidate["status"]) => void }) {
  const pagination = usePagination(candidates, DEFAULT_PAGE_SIZES.dataQuality);
  if (!candidates.length) return <EmptyState title="Nothing in this queue" body="No candidates currently meet this confidence threshold." />;
  return <><div className="duplicate-list">{pagination.items.map((candidate) => { const personA = people.find((person) => person.id === candidate.personAId); const personB = people.find((person) => person.id === candidate.personBId); if (!personA || !personB) return null; return <article className="duplicate-card" key={candidate.id} data-testid="duplicate-card" data-candidate-id={candidate.id}><div className="duplicate-header"><div><Badge tone={candidate.level === "exact" ? "danger" : candidate.level === "probable" ? "warn" : "neutral"}>{candidate.level} · {candidate.confidence}%</Badge><span>Candidate {candidate.id.replace("dup-", "")}</span></div>{candidate.status !== "pending" && <Badge tone="good"><Check size={12} /> {candidate.status.replaceAll("_", " ")}</Badge>}</div><div className="comparison"><PersonRecord person={personA} /><div className="match-rationale"><span>{candidate.confidence}%</span><strong>Match confidence</strong>{candidate.reasons.map((reason) => <small key={reason}><Check size={12} />{reason}</small>)}</div><PersonRecord person={personB} /></div><div className="decision-bar"><p>Raw records stay available. Approved merges are reversible in this prototype.</p><div><button className="button button-ghost" onClick={() => decide(candidate.id, "review_later")}><Clock3 size={15} /> Review later</button><button className="button button-secondary" onClick={() => decide(candidate.id, "kept_separate")}><Split size={15} /> Keep separate</button><button className="button button-primary" onClick={() => decide(candidate.id, "merged")} data-testid="approve-merge"><GitMerge size={15} /> Approve merge</button></div></div></article>; })}</div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="duplicate candidates" /></>;
}

function PersonRecord({ person }: { person: Person }) {
  return <div className="record-card"><div><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.id}</small></span></div><dl><div><dt>Email</dt><dd>{person.email || <em>Missing</em>}</dd></div><div><dt>LinkedIn</dt><dd>{person.linkedinUrl?.replace("https://www.linkedin.com/in/", "in/") || <em>Missing</em>}</dd></div><div><dt>Company</dt><dd>{person.company || <em>Missing</em>}</dd></div><div><dt>Role</dt><dd>{person.jobTitle || <em>Missing</em>}</dd></div><div><dt>Location</dt><dd>{person.location || <em>Missing</em>}</dd></div></dl></div>;
}

function ProfileIssues({ people, contact = false }: { people: Person[]; contact?: boolean }) {
  const pagination = usePagination(people, DEFAULT_PAGE_SIZES.dataQuality);
  if (!people.length) return <EmptyState title="Queue is clear" body="No profiles currently need attention here." />;
  return <><div className="issue-table"><div className="issue-table-head"><span>Person</span><span>{contact ? "Contact warning" : "Completeness"}</span><span>Issues</span><span>Next action</span></div>{pagination.items.map((person) => <div className="issue-row" key={person.id} data-testid="quality-profile-row"><div><Avatar person={person} size="sm" /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"}</small></span></div><div>{contact ? <Badge tone="danger">Validate</Badge> : <><strong>{person.completenessScore}%</strong><ProgressBar value={person.completenessScore} /></>}</div><div className="issue-list">{person.dataIssues.filter((issue) => !contact || issue.includes("Invalid") || issue.includes("Suspicious") || issue.includes("contact")).map((issue) => <DataIssue key={issue}>{issue}</DataIssue>)}</div><Link className="button button-secondary" href={`/people/${person.id}`}>Open profile</Link></div>)}</div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel={contact ? "contact issues" : "incomplete profiles"} /></>;
}
