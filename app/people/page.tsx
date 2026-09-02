"use client";

import Link from "next/link";
import { ArrowRight, Command, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { FilterSelect, type SelectOption } from "@/components/filter-select";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, EmptyState, PageHeader, ProgressBar, ScorePill } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";

const option = (value: string, label?: string): SelectOption => ({ value, label: label || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()) });

export default function PeoplePage() {
  const { people, loading } = useApp();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [location, setLocation] = useState("all");
  const [fit, setFit] = useState("all");
  const [complete, setComplete] = useState("all");
  const [processing, setProcessing] = useState("all");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZES.people);
  const values = (key: "industry" | "location") => [...new Set(people.map((person) => person[key]).filter(Boolean))].sort() as string[];
  const filtered = useMemo(() => people.filter((person) => {
    const haystack = `${person.fullName} ${person.email} ${person.company} ${person.jobTitle}`.toLowerCase();
    const fits = fit === "all" || fit === "80" && (person.fitScore || 0) >= 80 || fit === "65" && (person.fitScore || 0) >= 65 && (person.fitScore || 0) < 80 || fit === "under65" && (person.fitScore || 0) < 65;
    const completeness = complete === "all" || complete === "healthy" && person.completenessScore >= 80 || complete === "incomplete" && person.completenessScore < 70;
    return haystack.includes(search.toLowerCase()) && (type === "all" || person.personType === type) && (status === "all" || person.lifecycleStatus === status) && (industry === "all" || person.industry === industry) && (location === "all" || person.location === location) && fits && completeness && (processing === "all" || person.enrichmentStatus === processing);
  }), [people, search, type, status, industry, location, fit, complete, processing]);
  const pagination = usePagination(filtered, pageSize);
  const hasActiveFilters = !!search || [type, status, industry, location, fit, complete, processing].some((value) => value !== "all");
  const update = (setter: (value: string) => void) => (value: string) => { setter(value); pagination.resetPage(); };
  const reset = () => { setSearch(""); setType("all"); setStatus("all"); setIndustry("all"); setLocation("all"); setFit("all"); setComplete("all"); setProcessing("all"); pagination.resetPage(); };
  const all = (label: string) => option("all", `All ${label}`);

  return <div className="page people-page">
    <PageHeader eyebrow="Relationship graph" title="People" description={`${people.length} structured relationships`} action={<div className="people-header-actions"><span><strong>{people.length}</strong> total</span><Link className="button button-primary" href="/import"><Upload size={15} /> Import data</Link></div>} />
    <div className="filter-panel" data-spotlight>
      <div className="filter-toolbar"><label className={`search-field ${search ? "active" : ""}`}><Search size={20} /><input aria-label="Search people" placeholder="Search people, companies, roles…" value={search} onChange={(event) => { setSearch(event.target.value); pagination.resetPage(); }} /><kbd><Command size={11} /> K</kbd></label>{hasActiveFilters && <button className="text-button reset-filters" onClick={reset}><SlidersHorizontal size={15} /> Clear filters</button>}</div>
      <div className="filter-grid" aria-label="People filters">
        <FilterSelect label="Type" value={type} onChange={update(setType)} options={[all("Type"), ...["founder", "operator", "investor", "advisor", "other"].map((item) => option(item))]} />
        <FilterSelect label="Status" value={status} onChange={update(setStatus)} options={[all("Status"), ...["applicant", "member", "alumni", "prospect"].map((item) => option(item))]} />
        <FilterSelect label="Industry" value={industry} onChange={update(setIndustry)} options={[all("Industry"), ...values("industry").map((item) => option(item, item))]} />
        <FilterSelect label="Location" value={location} onChange={update(setLocation)} options={[all("Location"), ...values("location").map((item) => option(item, item))]} />
        <FilterSelect label="Fit" value={fit} onChange={update(setFit)} options={[all("Fit"), option("80", "80–100"), option("65", "65–79"), option("under65", "Below 65")]} />
        <FilterSelect label="Completeness" value={complete} onChange={update(setComplete)} options={[all("Completeness"), option("healthy", "80%+"), option("incomplete", "Below 70%")]} />
        <FilterSelect label="Processing" value={processing} onChange={update(setProcessing)} options={[all("Processing"), ...["complete", "not_started", "failed"].map((item) => option(item))]} />
      </div>
    </div>
    {loading ? <div className="skeleton-table" /> : filtered.length === 0 ? <EmptyState title="No people match these filters" body="Try widening the fit range or clearing one of the profile filters." /> : <>
      <div className="table-card desktop-table"><table><thead><tr><th>Person</th><th>Role / company</th><th>Type</th><th>Status</th><th>Location</th><th>Fit score</th><th>Completeness</th><th>Data quality</th><th aria-label="Profile action" /></tr></thead><tbody>{pagination.items.map((person) => <tr key={person.id} data-testid="people-table-row" data-person-id={person.id}><td><Link className="table-person" href={`/people/${person.id}`}><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.email || "No email"}</small></span></Link></td><td><strong className="truncate-text">{person.jobTitle || "—"}</strong><small className="truncate-text">{person.company || "Company missing"}</small></td><td><Badge>{person.personType}</Badge></td><td><Badge tone={person.lifecycleStatus === "applicant" ? "ai" : "neutral"}>{person.lifecycleStatus}</Badge></td><td>{person.location || "—"}</td><td><ScorePill score={person.fitScore} /></td><td><div className="compact-progress"><span>{person.completenessScore}%</span><ProgressBar value={person.completenessScore} tone={person.completenessScore >= 80 ? "green" : "amber"} /></div></td><td>{person.dataIssues.length ? <Badge tone="warn">{person.dataIssues.length} issue{person.dataIssues.length > 1 ? "s" : ""}</Badge> : <Badge tone="good">Healthy</Badge>}</td><td><Link className="row-action" href={`/people/${person.id}`} aria-label={`View ${person.fullName}`}><span>View profile</span><ArrowRight size={15} /></Link></td></tr>)}</tbody></table></div>
      <div className="mobile-cards">{pagination.items.map((person) => <Link className="mobile-person-card" href={`/people/${person.id}`} key={person.id} data-testid="people-mobile-card" data-person-id={person.id}><div><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"} · {person.company || "Company missing"}</small></span><ScorePill score={person.fitScore} /></div><div><Badge>{person.personType}</Badge><Badge tone={person.lifecycleStatus === "applicant" ? "ai" : "neutral"}>{person.lifecycleStatus}</Badge><span>{person.location}</span></div><ProgressBar value={person.completenessScore} tone={person.completenessScore >= 80 ? "green" : "amber"} /></Link>)}</div>
      <Pagination page={pagination.page} pageSize={pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} pageSizeOptions={[10, 20, 50]} onPageSizeChange={(size) => { setPageSize(size); pagination.resetPage(); }} itemLabel="people" />
    </>}
  </div>;
}
