/**
 * Pagination — smart page controls with ellipsis, page size selector.
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  page:       number;
  pageSize:   number;
  total:      number;
  onPage:     (p: number) => void;
  onPageSize?: (ps: number) => void;
  label?:     string;
  pageSizeOptions?: number[];
}

function pageRange(current: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", last];
  if (current >= last - 3) return [1, "…", last-4, last-3, last-2, last-1, last];
  return [1, "…", current - 1, current, current + 1, "…", last];
}

export function Pagination({
  page, pageSize, total, onPage, onPageSize,
  label = "records", pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  if (total === 0) return null;
  const lastPage   = Math.max(1, Math.ceil(total / pageSize));
  const start      = (page - 1) * pageSize + 1;
  const end        = Math.min(page * pageSize, total);
  const pages      = pageRange(page, lastPage);

  return (
    <div className="pagination">
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <span>
          Showing <b>{start}–{end}</b> of <b>{total}</b> {label}
        </span>
        {onPageSize && (
          <select
            value={pageSize}
            onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
            style={{ fontSize:11, padding:"3px 6px", border:"1.5px solid var(--line)", borderRadius:7, background:"var(--surface)", color:"var(--text)", cursor:"pointer" }}
          >
            {pageSizeOptions.map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
      </div>

      {lastPage > 1 && (
        <div className="pagination-controls">
          <button onClick={() => onPage(1)}       disabled={page === 1}        title="First page"><ChevronsLeft  size={12}/></button>
          <button onClick={() => onPage(page - 1)} disabled={page === 1}        title="Previous"><ChevronLeft   size={12}/></button>
          {pages.map((p, i) =>
            p === "…"
              ? <span key={`e${i}`} style={{ fontSize:11, padding:"0 4px", color:"var(--muted)" }}>…</span>
              : <button key={p} className={page === p ? "active" : ""} onClick={() => onPage(p as number)}>{p}</button>
          )}
          <button onClick={() => onPage(page + 1)} disabled={page === lastPage} title="Next"><ChevronRight  size={12}/></button>
          <button onClick={() => onPage(lastPage)} disabled={page === lastPage} title="Last page"><ChevronsRight size={12}/></button>
        </div>
      )}
    </div>
  );
}
