"use client";

import Link from "next/link";
import { ChevronDown, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, EmptyState, PageHeader, ProgressBar, ScoreRing } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";
import { fitBand, fitBreakdownParts } from "@/lib/scoring";

const bands = ["All", "Strong fit", "Potential fit", "Needs review", "Low fit"];

export default function ApplicantsPage() {
  const { people } = useApp();
  const [band, setBand] = useState("All");
  const [expanded, setExpanded] = useState<string>();
  const applicants = useMemo(() => people.filter((person) => person.lifecycleStatus === "applicant" && (band === "All" || fitBand(person.fitScore) === band)).sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0) || a.id.localeCompare(b.id)), [people, band]);
  const pagination = usePagination(applicants, DEFAULT_PAGE_SIZES.applicants);
  const count = (item: string) => people.filter((person) => person.lifecycleStatus === "applicant" && (item === "All" || fitBand(person.fitScore) === item)).length;

  return <div className="page applicants-page"><PageHeader eyebrow="Review queue" title="Applicants" description="Prioritize thoughtful human review with transparent scoring." action={<div className="aid-note" title="Scores rank the queue and never replace operator judgment"><Info size={16} /> How scoring works</div>} />
    <div className="segmented applicant-tabs" role="tablist" aria-label="Filter applicant fit band">{bands.map((item) => <button role="tab" aria-selected={band === item} className={band === item ? "active" : ""} key={item} onClick={() => { setBand(item); pagination.resetPage(); }}>{item}<span>{count(item)}</span></button>)}</div>
    {!applicants.length ? <EmptyState title="No applicants in this band" body="Try another fit range to continue reviewing the queue." /> : <>
      <div className="applicant-list">{pagination.items.map((person, index) => {
        const strong = (person.fitScore || 0) >= 80;
        return <article className={`applicant-card fit-${strong ? "strong" : "potential"}`} key={person.id} data-testid="applicant-card" data-person-id={person.id}>
          <div className="applicant-rank">{String(pagination.startIndex + index + 1).padStart(2, "0")}</div>
          <div className="applicant-main"><div className="applicant-person"><Avatar person={person} /><div className="person-copy"><Link href={`/people/${person.id}`}>{person.fullName}</Link><p>{person.jobTitle || "Role missing"} · {person.company || "Company missing"}</p><span>{person.location} · {person.industry}</span></div></div><div className="applicant-reasons"><strong>Why this score</strong><p>{person.fitBreakdown?.leadershipRelevance.reason}. {person.fitBreakdown?.contributionPotential.reason}.</p><div className="tags">{person.expertise.slice(0, 2).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></div>
          <div className="applicant-score"><ScoreRing value={person.fitScore || 0} tone={strong ? "green" : "copper"} size={90} /><Badge tone={strong ? "good" : (person.fitScore || 0) >= 65 ? "warn" : "neutral"}>{fitBand(person.fitScore)}</Badge><button className="text-button breakdown-trigger" data-testid="score-breakdown" onClick={() => setExpanded(expanded === person.id ? undefined : person.id)} aria-expanded={expanded === person.id}>Breakdown <ChevronDown size={15} /></button></div>
          {expanded === person.id && <div className="applicant-breakdown">{fitBreakdownParts(person.fitBreakdown).map(({ key, part }) => <div key={key}><span><strong>{labelKey(key)}</strong><small>{part.reason}</small></span><b>+{part.score}</b><ProgressBar value={part.score / part.max * 100} tone={part.score / part.max >= .7 ? "green" : "amber"} /></div>)}<div className="breakdown-total"><span><strong>Total score</strong><small>Transparent prioritization aid</small></span><b>{person.fitScore}/100</b></div></div>}
        </article>;
      })}</div>
      <Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="applicants" />
    </>}
  </div>;
}

function labelKey(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase()); }
