"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, CircleUserRound } from "lucide-react";
import { AmbientGlow } from "@/components/premium-effects";
import { OfflineMark } from "@/components/brand/OfflineMark";

export default function LandingPage() {
  return <main className="landing landing-editorial"><AmbientGlow landing />
    <nav className="landing-nav"><Link href="/" className="landing-brand" aria-label="Offline Intelligence home"><OfflineMark size={44} /></Link><div className="landing-actions"><Link className="nav-cta" href="/dashboard">Open dashboard <ArrowRight size={14} /></Link><Link className="landing-system-icon" href="/dashboard" aria-label="View system"><CircleUserRound size={18} /></Link></div></nav>
    <section className="editorial-hero">
      <div className="editorial-side editorial-side-left"><p>AI-native relationship intelligence<br />for curated founder communities.</p><div className="avatar-stack"><i>AR</i><i>RM</i><i>MS</i><i>AK</i></div><strong>72 structured relationships</strong></div>
      <div className="editorial-copy"><p className="hero-kicker"><i /> Relationship intelligence</p><h1><span>Relationships,</span><br /><em>understood.</em></h1><p className="hero-copy">AI-native intelligence for the people, applications and introductions that matter.</p><div className="hero-actions"><Link className="hero-primary" data-magnetic data-spotlight href="/dashboard">Open intelligence <ArrowRight size={17} /></Link></div></div>
      <div className="editorial-side editorial-side-right"><p>From raw member data<br />to high-context introductions.</p><span><b>94%</b> data readiness</span></div>
      <svg className="landing-relationship-path" viewBox="0 0 1100 420" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="landing-path-gradient" x1="0" x2="1"><stop offset="0" stopColor="#8d421f" stopOpacity=".28" /><stop offset=".45" stopColor="#e47737" /><stop offset="1" stopColor="#f1c86b" stopOpacity=".28" /></linearGradient></defs><path pathLength="1" d="M80 270 C 245 75, 405 360, 585 205 S 875 85, 1020 235" /></svg>
      <MetricFloat className="float-people" value="72" label="People" detail="Relationship graph" /><MetricFloat className="float-applicants" value="34" label="Applicants" detail="Under review" /><MetricFloat className="float-intros" value="17" label="Introductions" detail="High-signal matches" />
      <div className="landing-path-caption"><span>People</span><ArrowRight size={13} /><span>Context</span><ArrowRight size={13} /><span>Matching</span><ArrowRight size={13} /><span>Introduction</span></div>
    </section>
    <footer className="landing-meta"><span>Applicant intelligence</span><i /><span>Relationship graph</span><i /><span>Human review</span><a href="#product" aria-label="Explore Offline Intelligence"><ArrowDown size={14} /></a></footer>
  </main>;
}

function MetricFloat({ className, value, label, detail }: { className: string; value: string; label: string; detail: string }) {
  return <div className={`landing-float ${className}`}><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
