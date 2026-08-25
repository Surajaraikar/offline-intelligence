"use client";

import { Check, MessageCircleMore, RefreshCw, Sparkles, ThumbsDown, UsersRound } from "lucide-react";
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
  useEffect(() => {
    // URL state becomes available only after the client mounts in the local demo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPersonId(new URLSearchParams(window.location.search).get("person") || undefined);
  }, []);
  const filtered = useMemo(() => introductions.filter((intro) => intro.status === status && (!personId || intro.personAId === personId || intro.personBId === personId)), [introductions, status, personId]);
  const pagination = usePagination(filtered, DEFAULT_PAGE_SIZES.introductions);

  return <div className="page introductions-page"><PageHeader eyebrow="Relationship matching" title="Suggested introductions" description="Review high-signal, reciprocal connections. Nothing is sent until a human approves and acts." action={<Badge tone="ai"><Sparkles size={12} /> Demo AI drafts</Badge>} />
    <div className="intro-toolbar"><div className="segmented">{statuses.map((item) => <button className={status === item ? "active" : ""} key={item} onClick={() => { setStatus(item); pagination.resetPage(); }}>{item[0].toUpperCase() + item.slice(1)}<span>{introductions.filter((intro) => intro.status === item).length}</span></button>)}</div>{personId && <button className="filter-chip" onClick={() => { setPersonId(undefined); pagination.resetPage(); }}>Filtered to {people.find((person) => person.id === personId)?.fullName} ×</button>}</div>
    {!filtered.length ? <EmptyState title={`No ${status} introductions`} body={status === "suggested" ? "The current filter has no pending recommendations." : "Operator decisions will appear here."} /> : <>
      <div className="intro-list">{pagination.items.map((intro) => { const personA = people.find((person) => person.id === intro.personAId); const personB = people.find((person) => person.id === intro.personBId); if (!personA || !personB) return null; return <article className="intro-card" key={intro.id} data-testid="introduction-card" data-introduction-id={intro.id}><div className="intro-match"><div className="intro-people"><div><Avatar person={personA} size="lg" /><strong>{personA.fullName}</strong><small>{personA.jobTitle} · {personA.company}</small></div><span className="connection-line"><i /><b>{intro.score}%</b><small>match</small><i /></span><div><Avatar person={personB} size="lg" /><strong>{personB.fullName}</strong><small>{personB.jobTitle} · {personB.company}</small></div></div><div className="reason-list">{intro.reasons.map((reason) => <span key={reason}><Check size={14} />{reason}</span>)}</div></div><div className="intro-copy"><div className="why-box"><span><UsersRound size={16} /> Why this could be valuable</span><p>{intro.explanation}</p></div><div className="draft-box"><div><span><MessageCircleMore size={16} /> Draft introduction</span><Badge tone="ai"><Sparkles size={11} /> AI draft</Badge></div><p>{intro.draftMessage}</p><button className="text-button" onClick={() => regenerateDraft(intro.id)}><RefreshCw size={14} /> Regenerate draft</button></div></div><div className="intro-actions"><p>{intro.status === "suggested" ? "Review before any outreach" : `Status: ${intro.status}`}</p><div>{intro.status === "suggested" && <><button className="button button-secondary" onClick={() => decideIntroduction(intro.id, "dismissed")}><ThumbsDown size={15} /> Dismiss</button><button className="button button-primary" onClick={() => decideIntroduction(intro.id, "approved")} data-testid="approve-introduction"><Check size={15} /> Approve</button></>}{intro.status !== "suggested" && <button className="button button-secondary" onClick={() => decideIntroduction(intro.id, "suggested")}>Return to review</button>}</div></div></article>; })}</div>
      <Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="introductions" />
    </>}
  </div>;
}
