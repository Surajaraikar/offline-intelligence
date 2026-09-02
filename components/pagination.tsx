"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { paginate, paginationTokens } from "@/lib/pagination";
import { FilterSelect } from "@/components/filter-select";

export function usePagination<T>(items: readonly T[], pageSize: number) {
  const [requestedPage, setRequestedPage] = useState(1);
  const result = useMemo(() => paginate(items, requestedPage, pageSize), [items, requestedPage, pageSize]);
  const setPage = useCallback((nextPage: number) => setRequestedPage(nextPage), []);
  const resetPage = useCallback(() => setRequestedPage(1), []);
  return { ...result, setPage, resetPage };
}

type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
};

export function Pagination({ page, pageSize, totalItems, totalPages, onPageChange, pageSizeOptions, onPageSizeChange, itemLabel = "records" }: PaginationProps) {
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, totalItems);
  const tokens = paginationTokens(page, totalPages);
  return <nav className="pagination" aria-label={`${itemLabel} pagination`} data-testid="pagination">
    <div className="pagination-summary" aria-live="polite">Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong></div>
    <div className="pagination-controls">
      <button className="pagination-nav" type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label={`Previous page of ${itemLabel}`}><ChevronLeft size={15} /><span>Previous</span></button>
      <div className="pagination-pages">{tokens.map((token) => typeof token === "number" ? <button type="button" key={token} aria-label={`Page ${token}`} aria-current={token === page ? "page" : undefined} className={token === page ? "active" : ""} onClick={() => onPageChange(token)}>{token}</button> : <span key={token} className="pagination-ellipsis" aria-hidden="true">…</span>)}</div>
      <button className="pagination-nav" type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label={`Next page of ${itemLabel}`}><span>Next</span><ChevronRight size={15} /></button>
    </div>
    {pageSizeOptions && onPageSizeChange && <div className="page-size-control"><span>Rows</span><FilterSelect compact label={`Rows per page for ${itemLabel}`} value={String(pageSize)} onChange={(value) => onPageSizeChange(Number(value))} options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))} /></div>}
  </nav>;
}
