/**
 * DataTable — generic sortable table with empty and loading states.
 * Replaces the repeated <table className="premium-table"> boilerplate in every page.
 *
 * Usage:
 *   <DataTable
 *     columns={[{ key:"name", label:"Name" }, { key:"status", label:"Status" }]}
 *     rows={students}
 *     loading={isLoading}
 *     emptyText="No students found."
 *     rowKey={r => r.id}
 *     renderCell={(col, row) => col.key === "status"
 *       ? <span className="status-pill">{row.status}</span>
 *       : row[col.key]}
 *     actions={row => <RowActions onView={...} onEdit={...} onDelete={...} />}
 *   />
 */
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T = any> {
  key:       string;
  label:     string;
  width?:    number | string;
  align?:    "left" | "center" | "right";
  sortable?: boolean;
  render?:   (value: any, row: T) => React.ReactNode;
}

interface Props<T = any> {
  columns:      Column<T>[];
  rows:         T[];
  rowKey:       (row: T) => string;
  loading?:     boolean;
  emptyText?:   string;
  /** Optional custom cell renderer — overrides column.render */
  renderCell?:  (col: Column<T>, row: T) => React.ReactNode;
  /** Actions cell rendered at the end of each row */
  actions?:     (row: T) => React.ReactNode;
  onRowClick?:  (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns, rows, rowKey, loading, emptyText = "No records found.",
  renderCell, actions, onRowClick,
}: Props<T>) {
  const [sortKey, setSortKey]   = useState<string | null>(null);
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : rows;

  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="table-wrap">
      <table className="premium-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  textAlign: col.align ?? "left",
                  cursor: col.sortable ? "pointer" : undefined,
                  userSelect: col.sortable ? "none" : undefined,
                }}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc"
                      ? <ChevronUp size={12} style={{ opacity: .7 }}/>
                      : <ChevronDown size={12} style={{ opacity: .7 }}/>
                  )}
                </span>
              </th>
            ))}
            {actions && <th style={{ textAlign: "right" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--indigo)", borderTopColor: "transparent", animation: "spin .6s linear infinite" }}/>
                  Loading…
                </div>
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={colCount} style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: 13 }}>
                {emptyText}
              </td>
            </tr>
          ) : sorted.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? "pointer" : undefined }}
            >
              {columns.map(col => {
                const val = row[col.key];
                const content = renderCell
                  ? renderCell(col, row)
                  : col.render
                    ? col.render(val, row)
                    : (val !== undefined && val !== null && val !== "" ? String(val) : <span style={{ color: "var(--muted-2)" }}>—</span>);
                return (
                  <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                    {content}
                  </td>
                );
              })}
              {actions && (
                <td style={{ textAlign: "right" }} onClick={e => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
