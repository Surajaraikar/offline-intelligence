"use client";

import Link from "next/link";
import { ArrowRight, DatabaseZap, Ellipsis, Network, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { PageHeader } from "@/components/ui";
import type { ProcessingStage } from "@/types";

const stages: Array<{ key: ProcessingStage; label: string }> = [{ key: "normalizing", label: "Normalize" }, { key: "quality", label: "Validate" }, { key: "classifying", label: "Classify" }, { key: "scoring", label: "Score" }, { key: "matching", label: "Match" }, { key: "complete", label: "Ready" }];

export default function DashboardPage() {
  const { people, duplicates, introductions, activity, stage, lastProcessed, processDataset } = useApp();
  const applicants = people.filter((person) => person.lifecycleStatus === "applicant");
  const strong = applicants.filter((person) => (person.fitScore || 0) >= 80);
  const potential = applicants.filter((person) => (person.fitScore || 0) >= 65 && (person.fitScore || 0) < 80);
  const incomplete = people.filter((person) => person.completenessScore < 70);
  const warnings = people.filter((person) => person.dataIssues.some((issue) => issue.includes("Invalid") || issue.includes("Suspicious")));
  const pendingDuplicates = duplicates.filter((candidate) => candidate.status === "pending");
  const suggested = introductions.filter((intro) => intro.status === "suggested");
  const completeness = people.length ? Math.round(people.reduce((sum, person) => sum + person.completenessScore, 0) / people.length) : 0;
  const featuredIntro = suggested[0] || introductions[0];
  const personA = featuredIntro ? people.find((person) => person.id === featuredIntro.personAId) : undefined;
  const personB = featuredIntro ? people.find((person) => person.id === featuredIntro.personBId) : undefined;
  const processing = !["idle", "complete"].includes(stage);

  return <div className="page dashboard-page dashboard-command-center">
    <PageHeader eyebrow="Relationship operations" title="Good morning, Offline team" description="See where attention is needed, which applicants stand out, and where a thoughtful introduction could help." action={<div className="process-action"><button className="button button-primary" data-magnetic data-spotlight onClick={() => void processDataset()} disabled={processing} data-testid="process-dataset"><span className="button-state">{processing ? <RefreshCw className="spin" size={17} /> : <DatabaseZap size={17} />}{processing ? "Processing…" : "Process dataset"}</span></button><small>{lastProcessed ? `Last processed ${new Date(lastProcessed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Ready"}</small></div>} />
    {processing && <ProcessingPanel stage={stage} />}

    <section className="intelligence-grid">
      <article className="intel-module network-module" data-spotlight><ModuleHeader eyebrow="Network health" href="/people" /><div className="network-number"><strong><AnimatedNumber value={people.length} /></strong><span>People</span></div><p>Structured across the active relationship graph.</p><div className="network-micro-bars" aria-hidden="true">{[34,52,43,68,57,82,66,91,74,60,83,48].map((height,index) => <i key={index} style={{ height:`${height}%` }} />)}</div><div className="module-foot"><span><i className="status-dot local" /> {people.filter((person) => person.enrichmentStatus === "complete").length} processed</span><Link href="/people">Explore graph <ArrowRight size={13} /></Link></div></article>

      <article className="intel-module applicant-module" data-spotlight><ModuleHeader eyebrow="Applicant intelligence" href="/applicants" /><div className="applicant-module-summary"><div><strong><AnimatedNumber value={applicants.length} /></strong><span>Applicants</span></div><div><b>{strong.length}</b><span>Strong fit</span></div></div><div className="applicant-vertical-chart" aria-label="Applicant fit distribution"><VerticalBar label="Strong" value={strong.length} total={applicants.length} tone="green" /><VerticalBar label="Potential" value={potential.length} total={applicants.length} tone="champagne" /><VerticalBar label="Review" value={applicants.length - strong.length - potential.length} total={applicants.length} tone="orange" /><VerticalBar label="Low" value={0} total={applicants.length} tone="muted" /></div></article>

      <article className="intel-module weekly-module" data-spotlight><ModuleHeader eyebrow="Relationship activity" /><WeeklyActivity count={activity.length} /><div className="weekly-current"><b>{activity.length}</b><span>signals this session</span></div></article>

      <article className="intel-module readiness-module" data-spotlight><ModuleHeader eyebrow="Data readiness" href="/data-quality" /><ReadinessArcs value={completeness} /><div className="readiness-legend"><span><i className="cream" />{people.filter((person) => person.completenessScore >= 80).length} Healthy</span><span><i className="champagne" />{incomplete.length} Enrichment</span><span><i className="danger" />{warnings.length} Warnings</span></div></article>

      <article className="intel-module intro-intelligence-module" data-spotlight><ModuleHeader eyebrow="Introduction intelligence" href="/introductions" /><div className="intro-network-visual"><ProfileNode initials={initials(personA?.fullName)} name={personA?.fullName || "Relationship A"} /><div className="intro-curve"><svg viewBox="0 0 240 82" preserveAspectRatio="none" aria-hidden="true"><path d="M5 60 C70 4 168 4 235 60" /></svg><strong>{featuredIntro?.score || 0}%</strong><span>reciprocal fit</span></div><ProfileNode initials={initials(personB?.fullName)} name={personB?.fullName || "Relationship B"} /></div><div className="intro-signal-chips">{(featuredIntro?.reasons || ["Shared context", "Complementary needs"]).slice(0,2).map((reason) => <span key={reason}>{reason}</span>)}</div><div className="module-foot"><span><Network size={14} /> {suggested.length} suggested matches</span><Link className="champagne-action" href="/introductions">Review strongest <ArrowRight size={13} /></Link></div></article>

      <article className="intel-module review-operations-module" data-spotlight><ModuleHeader eyebrow="Review status" href="/data-quality" /><div className="operation-rows"><OperationRow index="01" label="Duplicate candidates" value={`${pendingDuplicates.length} detected`} href="/data-quality?tab=exact" /><OperationRow index="02" label="Incomplete profiles" value={`${incomplete.length} profiles`} href="/data-quality?tab=incomplete" /><OperationRow index="03" label="Contact warnings" value={`${warnings.length} warnings`} href="/data-quality?tab=contact" /></div><div className="latest-signal"><small>Latest signal</small><strong>{activity[0]?.title || "Relationship graph ready"}</strong><span>{activity[0]?.detail || "No unresolved processing events"}</span></div></article>
    </section>
  </div>;
}

function ModuleHeader({ eyebrow, href }: { eyebrow: string; href?: string }) { return <header className="module-header"><span>{eyebrow}</span>{href ? <Link href={href} aria-label={`Open ${eyebrow}`}><Plus size={17} /></Link> : <button aria-label={`${eyebrow} options`}><Ellipsis size={17} /></button>}</header>; }
function AnimatedNumber({ value }: { value: number }) { const [display,setDisplay] = useState(value ? 0 : value); useEffect(() => { if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) { const frame=requestAnimationFrame(() => setDisplay(value)); return () => cancelAnimationFrame(frame); } const started=performance.now(); let frame=0; const tick=(now:number) => { const progress=Math.min(1,(now-started)/820); setDisplay(Math.round(value*(1-Math.pow(1-progress,3)))); if(progress<1) frame=requestAnimationFrame(tick); }; frame=requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); },[value]); return <>{display}</>; }
function VerticalBar({ label,value,total,tone }: { label:string; value:number; total:number; tone:string }) { const height=total ? Math.max(12,value/total*100) : 8; return <div><div className="vertical-track"><i className={tone} style={{ height:`${height}%` }} /><b>{value}</b></div><span>{label}</span></div>; }
function WeeklyActivity({ count }: { count:number }) { const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; return <div className="weekly-bars">{days.map((day,index) => { const value=Math.min(92,24+((count+index*3)%7)*10); return <div key={day}><span><i className={index===1 ? "active" : ""} style={{ height:`${value}%` }} /></span><small>{day}</small></div>; })}</div>; }
function ReadinessArcs({ value }: { value:number }) { return <div className="readiness-arcs"><svg viewBox="0 0 240 145" aria-hidden="true"><path className="arc-track arc-outer" pathLength="100" d="M22 126 A98 98 0 0 1 218 126" /><path className="arc-fill arc-outer-fill" pathLength="100" d="M22 126 A98 98 0 0 1 218 126" style={{ strokeDasharray:`${value} 100` }} /><path className="arc-track arc-middle" pathLength="100" d="M45 126 A75 75 0 0 1 195 126" /><path className="arc-fill arc-middle-fill" pathLength="100" d="M45 126 A75 75 0 0 1 195 126" style={{ strokeDasharray:`${Math.max(18,value-12)} 100` }} /><path className="arc-track arc-inner" pathLength="100" d="M68 126 A52 52 0 0 1 172 126" /><path className="arc-fill arc-inner-fill" pathLength="100" d="M68 126 A52 52 0 0 1 172 126" style={{ strokeDasharray:`${Math.max(12,value-22)} 100` }} /></svg><strong>{value}%</strong><span>ready</span></div>; }
function ProfileNode({ initials:letters,name }: { initials:string; name:string }) { return <div className="profile-node"><i>{letters}</i><strong>{name}</strong></div>; }
function OperationRow({ index,label,value,href }: { index:string; label:string; value:string; href:string }) { return <Link href={href}><b>{index}</b><span><strong>{label}</strong><small>{value}</small></span><ArrowRight size={16} /></Link>; }
function ProcessingPanel({ stage }: { stage:ProcessingStage }) { return <section className="processing-card" aria-live="polite"><div><span className="processing-icon"><RefreshCw className="spin" size={20} /></span><div><strong>Processing relationship intelligence</strong><p>Deterministic checks run first. AI handles unstructured context.</p></div></div><div className="stage-list">{stages.map((item,index) => { const activeIndex=stages.findIndex((entry) => entry.key===stage); return <span key={item.key} className={index<activeIndex?"done":index===activeIndex?"active":""}><b>{index<activeIndex?"✓":String(index+1).padStart(2,"0")}</b><small>{item.label}</small></span>; })}</div></section>; }
function initials(name?:string) { if(!name) return "OI"; return name.split(" ").slice(0,2).map((part) => part[0]).join("").toUpperCase(); }
