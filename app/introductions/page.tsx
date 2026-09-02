"use client";

import { Check, RefreshCw, Sparkles, ThumbsDown, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";

const statuses = ["suggested", "approved", "dismissed"] as const;

export default function IntroductionsPage() {
  const { people, introductions, decideIntroduction, regenerateDraft } = useApp();
  const [status, setStatus] = useState<typeof statuses[number]>("suggested");
  const [personId, setPersonId] = useState<string>();
  const [regenerating, setRegenerating] = useState<string>();
  useEffect(() => { setPersonId(new URLSearchParams(window.location.search).get("person") || undefined); }, []); // eslint-disable-line react-hooks/set-state-in-effect
  const filtered = useMemo(() => introductions.filter((intro) => intro.status === status && (!personId || intro.personAId === personId || intro.personBId === personId)), [introductions, status, personId]);
  const pagination = usePagination(filtered, DEFAULT_PAGE_SIZES.introductions);
  const refreshDraft = (id: string) => { setRegenerating(id); window.setTimeout(() => { regenerateDraft(id); setRegenerating(undefined); }, 360); };

  return <div className="page introductions-page"><PageHeader eyebrow="Matching engine" title="Suggested introductions" description="Review high-signal, reciprocal connections. Nothing is sent until a human approves and acts." action={<Badge tone="ai"><Sparkles size={12} /> Demo AI drafts</Badge>} />
    <div className="intro-toolbar"><div className="segmented" role="tablist" aria-label="Introduction status">{statuses.map((item) => <button role="tab" aria-selected={status === item} className={status === item ? "active" : ""} key={item} onClick={() => { setStatus(item); pagination.resetPage(); }}>{item[0].toUpperCase() + item.slice(1)}<span>{introductions.filter((intro) => intro.status === item).length}</span></button>)}</div>{personId && <button className="filter-chip" onClick={() => { setPersonId(undefined); pagination.resetPage(); }}>Filtered to {people.find((person) => person.id === personId)?.fullName} ×</button>}</div>
    {!filtered.length ? <EmptyState title={`No ${status} introductions`} body={status === "suggested" ? "Try changing the filters or process more relationship context." : "Operator decisions will appear here."} /> : <><div className="intro-list">{pagination.items.map((intro) => {
      const personA = people.find((person) => person.id === intro.personAId); const personB = people.find((person) => person.id === intro.personBId); if (!personA || !personB) return null;
      const refreshing = regenerating === intro.id;
      return <article className={`intro-card status-${intro.status}`} key={intro.id} data-testid="introduction-card" data-introduction-id={intro.id}>
        <div className="intro-match"><div className="intro-people"><PersonNode person={personA} /><MatchConnector score={intro.score} /><PersonNode person={personB} /></div><div className="reason-list">{intro.reasons.map((reason) => <span key={reason}><Check size={14} />{reason}</span>)}</div></div>
        <div className="intro-copy"><div className="why-box"><span><UsersRound size={16} /> Why this could be valuable</span><p>{intro.explanation}</p></div><div className={`draft-box ${refreshing ? "is-refreshing" : ""}`}><div><span><Sparkles size={16} /> AI intro draft</span><Badge tone="ai"><Sparkles size={11} /> AI draft</Badge></div><p>{intro.draftMessage}</p><button className="text-button" onClick={() => refreshDraft(intro.id)} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} size={14} /> {refreshing ? "Regenerating…" : "Regenerate draft"}</button></div></div>
        <div className="intro-actions"><p>{intro.status === "suggested" ? "Review before any outreach" : `Status: ${intro.status}`}</p><div>{intro.status === "suggested" ? <><button className="button button-secondary" onClick={() => decideIntroduction(intro.id, "dismissed")}><ThumbsDown size={15} /> Dismiss</button><button className="button button-primary" onClick={() => decideIntroduction(intro.id, "approved")} data-testid="approve-introduction"><Check size={15} /> Approve</button></> : <button className="button button-secondary" onClick={() => decideIntroduction(intro.id, "suggested")}>Return to review</button>}</div></div>
      </article>;
    })}</div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="introductions" /></>}
  </div>;
}

function PersonNode({ person }: { person: ReturnType<typeof useApp>["people"][number] }) { return <div className="intro-person-node"><Avatar person={person} size="lg" /><strong>{person.fullName}</strong><small>{person.jobTitle} · {person.company}</small></div>; }
function MatchConnector({ score }: { score: number }) { return <div className="match-connector"><svg viewBox="0 0 180 80" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={`intro-gradient-${score}`}><stop stopColor="#8C4829" /><stop offset=".5" stopColor="#E18449" /><stop offset="1" stopColor="#F2C274" /></linearGradient></defs><path d="M2 58 C50 10 130 10 178 58" stroke={`url(#intro-gradient-${score})`} /></svg><strong>{score}%</strong><small>match</small></div>; }
