"use client";

import { AlertCircle, ArrowRight, Check, Database, UploadCloud } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { Pagination, usePagination } from "@/components/pagination";
import { Badge, PageHeader } from "@/components/ui";
import { rawDemoPeople } from "@/data/generated-people";
import { DEFAULT_PAGE_SIZES } from "@/lib/pagination";

type ImportState = "ready" | "preview" | "importing" | "done";

export default function ImportPage() {
  const { processDataset, notify } = useApp();
  const [state, setState] = useState<ImportState>("ready");
  const [fileRows, setFileRows] = useState<string[][]>();
  const [fileError, setFileError] = useState<string>();
  const headers = fileRows?.[0] || ["Name", "Email", "Company", "Status", "Industry"];
  const previewRows = useMemo(() => fileRows ? fileRows.slice(1) : rawDemoPeople.map((record) => [record.name, record.email || "—", record.company || "—", record.status, record.industry || "—"]), [fileRows]);
  const pagination = usePagination(previewRows, DEFAULT_PAGE_SIZES.importPreview);

  const chooseDemo = () => { setFileRows(undefined); setFileError(undefined); setState("preview"); pagination.resetPage(); };
  const confirm = async () => { setState("importing"); await processDataset(); setState("done"); };
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 1_000_000 || !file.name.toLowerCase().endsWith(".csv")) { setFileError("Choose a CSV file smaller than 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { const rows = String(reader.result).split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((value) => value.trim())); if (!rows[0]?.some((value) => /name/i.test(value))) { setFileError("The CSV needs a name or full_name column."); return; } setFileRows(rows); setFileError(undefined); setState("preview"); pagination.resetPage(); notify("CSV validated — previewing 10 rows per page"); };
    reader.onerror = () => setFileError("We could not read that file. Try exporting it again as UTF-8 CSV.");
    reader.readAsText(file);
  };

  return <div className="page import-page"><PageHeader eyebrow="Airtable / CSV intake" title="Import relationship data" description="Preview, validate and confirm records before anything joins the clean relationship graph." action={<Badge tone="neutral">Local demo repository</Badge>} />
    <div className="import-layout"><section className="card import-source"><div className="source-icon"><Database size={22} /></div><div><h2>Deterministic sample dataset</h2><p>72 fictional records with realistic inconsistencies, duplicates and missing fields.</p><div className="tags"><span className="tag">72 rows</span><span className="tag">20 fields</span><span className="tag accent">Fictional data</span></div></div><button className="button button-primary" onClick={chooseDemo} data-testid="load-demo"><Database size={16} /> Load demo dataset</button></section>
      <div className="or-divider"><span>or</span></div><label className="upload-zone"><input type="file" accept=".csv,text/csv" onChange={handleFile} /><UploadCloud size={26} /><strong>Drop a CSV here or choose a file</strong><small>UTF-8 CSV · up to 1 MB · headers required</small></label>{fileError && <div className="form-error"><AlertCircle size={16} />{fileError}</div>}
      {state !== "ready" && <section className="card import-preview"><div className="card-header"><div><p className="eyebrow">Validation preview</p><h2>{fileRows ? "Uploaded CSV" : "Demo dataset"}</h2></div><Badge tone="good"><Check size={12} /> Ready to import</Badge></div><div className="validation-grid"><div><small>Rows detected</small><strong>{previewRows.length}</strong></div><div><small>Fields mapped</small><strong>{fileRows?.[0]?.length || 20}</strong></div><div><small>Warnings expected</small><strong>{fileRows ? "Review" : "23"}</strong></div><div><small>Blocking errors</small><strong>0</strong></div></div><div className="field-summary"><h3>Processing preview</h3><div><span><Check /> Trim and normalize text</span><span><Check /> Validate contact details</span><span><Check /> Flag duplicate candidates</span><span><Check /> Classify unstructured profiles</span><span><Check /> Calculate fit and matches</span></div></div><div className="preview-table"><table><thead><tr>{headers.slice(0, 5).map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{pagination.items.map((row, index) => <tr key={`${pagination.startIndex + index}-${row.join("|")}`} data-testid="import-preview-row">{row.slice(0, 5).map((cell, column) => <td key={`${column}-${cell}`}>{cell}</td>)}</tr>)}</tbody></table></div><Pagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} onPageChange={pagination.setPage} itemLabel="import rows" /><div className="confirm-bar"><p>{fileRows ? "This prototype validates uploaded CSVs; confirmed demo processing uses the stable seeded dataset." : "Confirm to replace the current demo view and run the full processing pipeline."}</p>{state === "done" ? <span className="success-message"><Check size={16} /> Import complete</span> : <button className="button button-primary" onClick={() => void confirm()} disabled={state === "importing"}>{state === "importing" ? "Processing…" : <>Confirm and process <ArrowRight size={16} /></>}</button>}</div></section>}
    </div>
  </div>;
}
