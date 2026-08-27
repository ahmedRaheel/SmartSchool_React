import { ReactNode } from "react";

export interface DataGridColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface DataGridProps<T> {
  rows: T[];
  columns: DataGridColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

export function DataGrid<T>({ rows, columns, rowKey, loading, emptyTitle = "No records found", emptyMessage = "There is nothing to display yet." }: DataGridProps<T>) {
  return (
    <div className="premium-grid-shell">
      {loading ? <div className="grid-state"><span className="grid-loader"/><b>Loading records…</b></div> : rows.length === 0 ? (
        <div className="grid-state"><b>{emptyTitle}</b><span>{emptyMessage}</span></div>
      ) : (
        <div className="premium-grid-scroll"><table className="premium-grid"><thead><tr>{columns.map(column => <th key={column.key} style={{ width: column.width }}>{column.header}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
      )}
    </div>
  );
}
