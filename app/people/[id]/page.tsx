"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Clock3, ExternalLink, Mail, MapPin, Pencil, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useApp } from "@/components/app-provider";
import { AiLabel, Avatar, Badge, DataIssue, EmptyState, PersonLink, ProgressBar, ScoreRing } from "@/components/ui";
import { fitBreakdownParts } from "@/lib/scoring";

export default function PersonProfilePage() {
  const params = useParams<{ id: string }>();
  const { people, introductions, loading, reprocessPerson, updatePerson } = useApp();
  const [editing, setEditing] = useState(false);
  const person = people.find((profile) => profile.id === params.id);
  if (loading) return <div className="page"><div className="skeleton-profile" /></div>;
  if (!person) return <div className="page"><EmptyState title="Profile not found" body="This record may not exist in the current demo dataset." /></div>;
  const matches = introductions.filter((intro) => intro.personAId === person.id || intro.personBId === person.id).slice(0, 3);

  return <div className="page profile-page">
    <Link className="back-link" href="/people"><ArrowLeft size={16} /> Back to people</Link>
    <section className="profile-hero" data-spotlight>
      <div className="profile-identity"><Avatar person={person} size="xl" /><div><div className="profile-title-line"><h1>{person.fullName}</h1><Badge tone={person.lifecycleStatus === "applicant" ? "ai" : "neutral"}>{person.lifecycleStatus}</Badge><Badge>{person.personType}</Badge></div><p>{person.jobTitle || "Role missing"}{person.company ? ` at ${person.company}` : ""}</p><div className="profile-meta"><span><MapPin size={15} />{person.location || "Location missing"}</span><span><BriefcaseBusiness size={15} />{person.industry || "Industry missing"}</span>{person.email && <a href={`mailto:${person.email}`}><Mail size={15} />{person.email}</a>}{person.linkedinUrl && <a href={person.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={13} /></a>}</div></div></div>
      <div className="profile-signals"><ScoreRing value={person.fitScore || 0} label="fit" tone={(person.fitScore || 0) >= 80 ? "green" : "copper"} /><ScoreRing value={person.completenessScore} label="complete" tone={person.completenessScore >= 80 ? "green" : "copper"} /></div>
      <div className="profile-actions"><button className="button button-secondary" onClick={() => reprocessPerson(person.id)}><RefreshCw size={16} /> Reprocess</button><button className="button button-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button><Link className="button button-primary" href={`/introductions?person=${person.id}`}><Search size={16} /> Find introductions</Link></div>
    </section>
    <div className="profile-grid"><div className="profile-main">
      <section className="card dossier-overview"><div className="card-header"><div><p className="eyebrow">Overview</p><h2>Relationship dossier</h2></div><AiLabel /></div><p className="summary-text">{person.profileSummary}</p></section>
      <section className="card dossier-context"><div className="card-header"><div><p className="eyebrow">Context map</p><h2>Offers, seeks and interests</h2></div></div><div className="tag-sections"><TagGroup label="Interests" values={person.interests} /><TagGroup label="Expertise" values={person.expertise} /><TagGroup label="Looking for" values={person.lookingFor} accent /><TagGroup label="Can help with" values={person.canHelpWith} accent /></div></section>
      {person.lifecycleStatus === "applicant" && <section className="card"><div className="card-header"><div><p className="eyebrow">Relationship signal</p><h2>Why they want to join</h2></div><AiLabel /></div><blockquote>{person.applicationAnswer || "No application response provided."}</blockquote></section>}
      <section className="card"><div className="card-header"><div><p className="eyebrow">Introductions</p><h2>Suggested connections</h2></div><Link className="text-link" href={`/introductions?person=${person.id}`}>See all</Link></div><div className="match-list">{matches.map((match) => { const other = people.find((profile) => profile.id === (match.personAId === person.id ? match.personBId : match.personAId)); return other && <div key={match.id}><PersonLink person={other} compact /><span className="match-score">{match.score}% match</span><p>{match.reasons[0]}</p></div>; })}{!matches.length && <EmptyState title="No strong matches yet" body="Reprocess after adding more goals and ways this person can help." />}</div></section>
    </div><aside className="profile-side">
      <section className="card score-card"><div className="card-header"><div><p className="eyebrow">Applicant fit</p><h2>Transparent review signal</h2></div></div><p className="microcopy">A prioritization aid for human review, never an objective assessment.</p><div className="score-breakdown">{fitBreakdownParts(person.fitBreakdown).map(({ key, part }) => <div key={key}><span><strong>{labelKey(key)}</strong><small>{part.reason}</small></span><b>{part.score}/{part.max}</b><ProgressBar value={part.score / part.max * 100} tone={part.score / part.max > .7 ? "green" : "amber"} /></div>)}</div></section>
      <section className="card"><div className="card-header"><div><p className="eyebrow">Data quality</p><h2>{person.completenessScore}% complete</h2></div><ShieldCheck size={18} /></div><ProgressBar value={person.completenessScore} tone={person.completenessScore >= 80 ? "green" : "amber"} /><div className="issue-list">{person.dataIssues.length ? person.dataIssues.map((issue) => <DataIssue key={issue}>{issue}</DataIssue>) : <Badge tone="good">No issues detected</Badge>}</div></section>
      <section className="card metadata-card"><p className="eyebrow">Processing history</p><dl><div><dt>Status</dt><dd><Badge tone="good">{person.enrichmentStatus}</Badge></dd></div><div><dt>Source</dt><dd>{person.source.replaceAll("_", " ")}</dd></div><div><dt>Updated</dt><dd><Clock3 size={11} /> {new Date(person.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd></div><div><dt>AI mode</dt><dd>Deterministic demo</dd></div></dl></section>
    </aside></div>
    {editing && <EditDialog person={person} onClose={() => setEditing(false)} onSave={(updates) => { updatePerson(person.id, updates); setEditing(false); }} />}
  </div>;
}

function TagGroup({ label, values, accent }: { label: string; values: string[]; accent?: boolean }) { return <div><h3>{label}</h3><div className="tags">{values.length ? values.map((value) => <span className={accent ? "tag accent" : "tag"} key={value}>{value}</span>) : <small>Not yet classified</small>}</div></div>; }
function labelKey(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase()); }

function EditDialog({ person, onClose, onSave }: { person: ReturnType<typeof useApp>["people"][number]; onClose: () => void; onSave: (updates: Partial<typeof person>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ jobTitle: String(data.get("jobTitle")), company: String(data.get("company")), location: String(data.get("location")), bio: String(data.get("bio")) }); };
  return <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title"><button className="icon-button modal-close" onClick={onClose} aria-label="Close edit dialog"><X size={19} /></button><p className="eyebrow">Demo session</p><h2 id="edit-title">Edit {person.firstName}&apos;s profile</h2><p>Updates are kept in this browser session and do not change the raw import record.</p><form onSubmit={submit}><label>Job title<input name="jobTitle" defaultValue={person.jobTitle} /></label><label>Company<input name="company" defaultValue={person.company} /></label><label>Location<input name="location" defaultValue={person.location} /></label><label>Biography<textarea name="bio" defaultValue={person.bio} rows={4} /></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Save changes</button></div></form></div></div>;
}
