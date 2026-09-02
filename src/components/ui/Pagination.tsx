/**
 * Pagination — reusable paginator used by every data table.
 *
 * Usage:
 *   <Pagination page={page} pageSize={pageSize} total={total}
 *               onPage={setPage} onPageSize={setPageSize} />
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  page:        number;          // 1-based
  pageSize:    number;
  total:       number;          // total record count
  onPage:      (p: number) => void;
  onPageSize?: (ps: number) => void;
  pageSizeOptions?: number[];
  label?: string;               // e.g. "students"
}

export function Pagination({
  page, pageSize, total,
  onPage, onPageSize,
  pageSizeOptions = [10, 25, 50, 100],
  label = "records",
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Generate page window: always show first, last, and ±2 around current
  function pages(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages].filter(p => p >= 1 && p <= totalPages));
    const sorted = Array.from(set).sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && (sorted[i + 1] as number) - (sorted[i] as number) > 1) {
        result.push("...");
      }
    }
    return result;
  }

  if (total === 0 && page === 1) return null;

  return (
    <div className="pagination-bar">
      {/* Left — record count */}
      <div className="pagination-info">
        {total === 0 ? (
          <span>No {label}</span>
        ) : (
          <span>
            {from}–{to} of <b>{total.toLocaleString()}</b> {label}
          </span>
        )}
      </div>

      {/* Centre — page buttons */}
      {totalPages > 1 && (
        <div className="pagination-pages">
          <button
            className="page-btn page-btn-icon"
            onClick={() => onPage(1)}
            disabled={page === 1}
            title="First page"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            className="page-btn page-btn-icon"
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            title="Previous page"
          >
            <ChevronLeft size={13} />
          </button>

          {pages().map((p, i) =>
            p === "..." ? (
              <span key={`el-${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`page-btn${p === page ? " page-btn-active" : ""}`}
                onClick={() => p !== page && onPage(p as number)}
                disabled={p === page}
              >
                {p}
              </button>
            )
          )}

          <button
            className="page-btn page-btn-icon"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            title="Next page"
          >
            <ChevronRight size={13} />
          </button>
          <button
            className="page-btn page-btn-icon"
            onClick={() => onPage(totalPages)}
            disabled={page >= totalPages}
            title="Last page"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      )}

      {/* Right — page size picker */}
      {onPageSize && (
        <div className="pagination-size">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
