"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowRight, ArrowUpFromLine, Command, Database, LayoutGrid, Menu, Network, Search, Sparkles, UserRoundCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app-provider";
import { AmbientGlow, PremiumEffects } from "@/components/premium-effects";
import { BrandWordmark, OfflineMark } from "@/components/brand/OfflineMark";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/people", label: "People", icon: Users },
  { href: "/applicants", label: "Applicants", icon: UserRoundCheck },
  { href: "/data-quality", label: "Data quality", icon: Activity },
  { href: "/introductions", label: "Introductions", icon: Network },
  { href: "/import", label: "Import", icon: ArrowUpFromLine },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { stage, lastProcessed, toast, processDataset } = useApp();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (pathname === "/") return <><PremiumEffects />{children}</>;
  const current = links.find((link) => pathname.startsWith(link.href))?.label || "Profile";
  return <div className="app-shell" data-app-ready={lastProcessed ? "true" : "false"}><PremiumEffects /><AmbientGlow />
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <Link href="/" className="brand" aria-label="Offline Intelligence home"><OfflineMark size={44} /></Link>
      <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
      <p className="nav-label">Operations</p>
      <nav aria-label="Primary navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}><Icon size={18} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-profile"><span className="sidebar-avatar" aria-hidden="true">SR</span><span className="sidebar-profile-info"><strong>Suraj R.</strong><small>Operator</small></span></div>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
    <div className="main-wrap"><header className="topbar">
      <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
      <div className="mobile-brand"><OfflineMark size={25} /><span>Offline Intelligence</span></div>
      <div className="topbar-context"><span>Offline</span><ArrowRight size={12} /><strong>{current}</strong></div>
      <div className="topbar-meta"><span title="Demo AI with deterministic fallback"><Sparkles size={13} /> Demo AI</span><span className="hide-mobile" title="Browser-local demo dataset"><Database size={13} /> Local data</span><span className="hide-tablet">{stage === "complete" && lastProcessed ? `Processed ${new Date(lastProcessed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : stage}</span><button className="command-trigger" onClick={() => setCommandOpen(true)}><Command size={13} /><span>Search</span><kbd>⌘ K</kbd></button></div>
    </header><main>{children}</main></div>
    {commandOpen && <CommandPalette close={() => setCommandOpen(false)} process={() => { setCommandOpen(false); void processDataset(); }} />}
    {toast && <div className="toast" role="status"><span className="toast-icon">✓</span>{toast}</div>}
  </div>;
}

function CommandPalette({ close, process }: { close: () => void; process: () => void }) {
  const [query, setQuery] = useState("");
  const items = links.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="command-backdrop" onMouseDown={close}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
    <div className="command-brand"><OfflineMark size={24} /><span>Offline Intelligence</span></div>
    <label><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" /><kbd>ESC</kbd></label>
    <p>Navigate</p>{items.map(({ href, label, icon: Icon }) => <Link href={href} onClick={close} key={href}><Icon size={17} /><span>Go to {label}</span><ArrowRight size={14} /></Link>)}
    <p>Actions</p><button onClick={process}><Sparkles size={17} /><span>Process dataset</span><small>Run intelligence pipeline</small></button><Link href="/people" onClick={close}><Users size={17} /><span>Search people</span><ArrowRight size={14} /></Link>
  </section></div>;
}
