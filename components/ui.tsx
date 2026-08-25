"use client";

import { AlertCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Person } from "@/types";
import { fitBand } from "@/lib/scoring";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "danger" | "ai" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ person, size = "md" }: { person: Pick<Person, "firstName" | "lastName" | "fullName">; size?: "sm" | "md" | "lg" | "xl" }) {
  const initials = `${person.firstName?.trim()[0] || ""}${person.lastName?.trim()[0] || ""}`.toUpperCase() || person.fullName.trim()[0]?.toUpperCase() || "?";
  return <span className={`avatar avatar-${size}`} aria-hidden="true" data-testid="avatar"><span className="avatar-initials">{initials}</span></span>;
}

export function ScorePill({ score = 0 }: { score?: number }) {
  const band = fitBand(score);
  return <span className={`score-pill score-${band.toLowerCase().replaceAll(" ", "-")}`} title={`${band}; prioritization aid for human review`}><strong>{score}</strong><small>/100</small></span>;
}

export function ProgressBar({ value, tone = "amber" }: { value: number; tone?: "amber" | "green" | "red" }) {
  return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span className={`progress-fill progress-${tone}`} style={{ width: `${Math.max(2, value)}%` }} /></div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><CheckCircle2 size={24} /><h3>{title}</h3><p>{body}</p></div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action && <div className="page-actions">{action}</div>}</div>;
}

export function PersonLink({ person, compact = false }: { person: Person; compact?: boolean }) {
  return <Link className="person-link" href={`/people/${person.id}`}><Avatar person={person} size={compact ? "sm" : "md"} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"}{person.company ? ` · ${person.company}` : ""}</small></span><ChevronRight size={16} /></Link>;
}

export function AiLabel() { return <Badge tone="ai"><Sparkles size={12} /> AI-derived</Badge>; }
export function DataIssue({ children }: { children: React.ReactNode }) { return <span className="issue"><AlertCircle size={14} />{children}</span>; }
