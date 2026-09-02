"use client";

import { AlertCircle, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Person } from "@/types";
import { fitBand } from "@/lib/scoring";
import { OfflineMark } from "@/components/brand/OfflineMark";

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
  return <div className="empty-state"><OfflineMark size={42} animated={false} /><h3>{title}</h3><p>{body}</p></div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action && <div className="page-actions">{action}</div>}</div>;
}

export function PersonLink({ person, compact = false }: { person: Person; compact?: boolean }) {
  return <Link className="person-link" href={`/people/${person.id}`}><Avatar person={person} size={compact ? "sm" : "md"} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"}{person.company ? ` · ${person.company}` : ""}</small></span><ChevronRight size={16} /></Link>;
}

export function AiLabel() { return <Badge tone="ai"><Sparkles size={12} /> AI-derived</Badge>; }
export function DataIssue({ children }: { children: React.ReactNode }) { return <span className="issue"><AlertCircle size={14} />{children}</span>; }

export function ScoreRing({ value, label, tone = "copper", size = 82 }: { value: number; label?: string; tone?: "copper" | "green"; size?: number }) {
  const radius = 29;
  return <div className={`score-ring score-ring-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`${label || "Score"}: ${value}%`}>
    <svg viewBox="0 0 72 72" aria-hidden="true"><defs><linearGradient id={`score-${tone}`} x1="10" y1="8" x2="62" y2="64"><stop stopColor={tone === "green" ? "#86D99E" : "#F2B278"} /><stop offset=".5" stopColor={tone === "green" ? "#58B779" : "#DD7C3E"} /><stop offset="1" stopColor={tone === "green" ? "#2E7A50" : "#A64D25"} /></linearGradient></defs><circle className="score-ring-track" cx="36" cy="36" r={radius} /><circle className="score-ring-value" cx="36" cy="36" r={radius} pathLength="100" style={{ strokeDasharray: `${value} 100` }} /></svg>
    <strong>{value}<small>%</small></strong>{label && <span>{label}</span>}
  </div>;
}
