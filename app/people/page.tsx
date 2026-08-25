"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Avatar, Badge, EmptyState, PageHeader, ProgressBar, ScorePill } from "@/components/ui";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";

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

  const options = (key: "industry" | "location") => [...new Set(people.map((person) => person[key]).filter(Boolean))].sort() as string[];
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

  return <div className="page people-page">
    <PageHeader eyebrow="Relationship graph" title="People directory" description="Search structured profiles, inspect data quality, and find the context behind every relationship." action={<Badge tone="neutral">{filtered.length} of {people.length} people</Badge>} />
    <div className="filter-panel">
      <div className="filter-toolbar"><label className={`search-field ${search ? "active" : ""}`}><Search size={17} /><input aria-label="Search people" placeholder="Search name, role, company or email…" value={search} onChange={(event) => { setSearch(event.target.value); pagination.resetPage(); }} /></label>{hasActiveFilters && <button className="text-button reset-filters" onClick={reset}><SlidersHorizontal size={15} /> Reset filters</button>}</div>
      <div className="filter-grid">
        <Filter label="Type" value={type} onChange={update(setType)} options={["founder", "operator", "investor", "advisor", "other"]} />
        <Filter label="Status" value={status} onChange={update(setStatus)} options={["applicant", "member", "alumni", "prospect"]} />
        <Filter label="Industry" value={industry} onChange={update(setIndustry)} options={options("industry")} />
        <Filter label="Location" value={location} onChange={update(setLocation)} options={options("location")} />
        <Filter label="Fit" value={fit} onChange={update(setFit)} pairs={[["80", "80–100"], ["65", "65–79"], ["under65", "Below 65"]]} />
        <Filter label="Completeness" value={complete} onChange={update(setComplete)} pairs={[["healthy", "80%+"], ["incomplete", "Below 70%"]]} />
        <Filter label="Processing" value={processing} onChange={update(setProcessing)} options={["complete", "not_started", "failed"]} />
      </div>
    </div>
    {loading ? <div className="skeleton-table" /> : filtered.length === 0 ? <EmptyState title="No people match these filters" body="Try widening the fit range or clearing one of the profile filters." /> : <>
      <div className="table-card desktop-table"><table><thead><tr><th>Person</th><th>Role / company</th><th>Type</th><th>Status</th><th>Location</th><th>Fit score</th><th>Completeness</th><th>Data quality</th></tr></thead><tbody>{pagination.items.map((person) => <tr key={person.id} data-testid="people-table-row" data-person-id={person.id}><td><Link className="table-person" href={`/people/${person.id}`}><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.email || "No email"}</small></span></Link></td><td><strong className="truncate-text">{person.jobTitle || "—"}</strong><small className="truncate-text">{person.company || "Company missing"}</small></td><td><Badge>{person.personType}</Badge></td><td><Badge tone={person.lifecycleStatus === "applicant" ? "ai" : "neutral"}>{person.lifecycleStatus}</Badge></td><td>{person.location || "—"}</td><td><ScorePill score={person.fitScore} /></td><td><div className="compact-progress"><span>{person.completenessScore}%</span><ProgressBar value={person.completenessScore} tone={person.completenessScore >= 80 ? "green" : "amber"} /></div></td><td>{person.dataIssues.length ? <Badge tone="warn">{person.dataIssues.length} issue{person.dataIssues.length > 1 ? "s" : ""}</Badge> : <Badge tone="good">Healthy</Badge>}</td></tr>)}</tbody></table></div>
      <div className="mobile-cards">{pagination.items.map((person) => <Link className="mobile-person-card" href={`/people/${person.id}`} key={person.id} data-testid="people-mobile-card" data-person-id={person.id}><div><Avatar person={person} /><span className="person-copy"><strong>{person.fullName}</strong><small>{person.jobTitle || "Role missing"} · {person.company || "Company missing"}</small></span><ScorePill score={person.fitScore} /></div><div><Badge>{person.personType}</Badge><Badge tone={person.lifecycleStatus === "applicant" ? "ai" : "neutral"}>{person.lifecycleStatus}</Badge><span>{person.location}</span></div><ProgressBar value={person.completenessScore} tone={person.completenessScore >= 80 ? "green" : "amber"} /></Link>)}</div>
      <Pagination page={pagination.page} pageSize={pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} pageSizeOptions={[10, 20, 50]} onPageSizeChange={(size) => { setPageSize(size); pagination.resetPage(); }} itemLabel="people" />
    </>}
  </div>;
}

function Filter({ label, value, onChange, options = [], pairs }: { label: string; value: string; onChange: (value: string) => void; options?: string[]; pairs?: string[][] }) {
  return <label className={`filter-control ${value !== "all" ? "active" : ""}`}><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="all">All {label.toLowerCase()}</option>{(pairs || options.map((option) => [option, option.replaceAll("_", " ")])).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
