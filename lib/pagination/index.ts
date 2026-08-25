export const DEFAULT_PAGE_SIZES = {
  people: 10,
  applicants: 8,
  introductions: 5,
  dataQuality: 8,
  importPreview: 10,
} as const;

export function pageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)));
}

export function clampPage(page: number, totalItems: number, pageSize: number) {
  return Math.min(Math.max(1, Math.trunc(page) || 1), pageCount(totalItems, pageSize));
}

export function paginate<T>(items: readonly T[], requestedPage: number, pageSize: number) {
  const page = clampPage(requestedPage, items.length, pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  return {
    items: items.slice(startIndex, endIndex),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: pageCount(items.length, pageSize),
    startIndex,
    endIndex,
  };
}

export type PaginationToken = number | "ellipsis-start" | "ellipsis-end";

export function paginationTokens(page: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  if (page >= totalPages - 3) return [1, "ellipsis-start", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis-start", page - 1, page, page + 1, "ellipsis-end", totalPages];
}
