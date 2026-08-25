"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpFromLine, LayoutDashboard, Menu, Network, Sparkles, UserCheck, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/app-provider";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/people", label: "People", icon: UsersRound },
  { href: "/applicants", label: "Applicants", icon: UserCheck },
  { href: "/data-quality", label: "Data quality", icon: Activity },
  { href: "/introductions", label: "Introductions", icon: Network },
  { href: "/import", label: "Import", icon: ArrowUpFromLine },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const { stage, lastProcessed, toast } = useApp();
  return <div className="app-shell" data-app-ready={lastProcessed ? "true" : "false"}>
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark">O</span><span><strong>Offline</strong><small>Intelligence</small></span></div>
      <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
      <nav aria-label="Primary navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href || href !== "/" && pathname.startsWith(href) ? "active" : ""}><Icon size={18} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-footer"><div className="system-line"><span className="status-dot" /><span><strong>Demo AI</strong><small>Deterministic fallback</small></span></div><div className="system-line"><span className="status-dot local" /><span><strong>Local demo data</strong><small>Browser-persisted decisions</small></span></div></div>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    <div className="main-wrap">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="mobile-brand">Offline Intelligence</div><div className="topbar-meta"><span><Sparkles size={14} /> Demo AI</span><span className="hide-mobile">Local demo data</span><span className="hide-tablet">{stage === "complete" && lastProcessed ? `Processed ${new Date(lastProcessed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : stage}</span></div></header>
      <main>{children}</main>
    </div>
    {toast && <div className="toast" role="status"><CheckCircleIcon />{toast}</div>}
  </div>;
}

function CheckCircleIcon() { return <span className="toast-icon">✓</span>; }
