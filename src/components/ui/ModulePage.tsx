import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Filter,
  Lightbulb,
  MoreHorizontal,
  Search,
  Sparkles,
} from "lucide-react";
import type { ModuleData } from "../../mocks/moduleData";
import { PageHeader } from "./PageHeader";

export function ModulePage({ data }: { data: ModuleData }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      data.records.filter((item) =>
        [item.title, item.subtitle, item.meta, item.status, item.value]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data.records, query],
  );

  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={data.subtitle}
        action={<button className="primary"><span>+</span> {data.action}</button>}
      />

      <section className="metric-grid">
        {data.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            <div className={`metric-note ${metric.trend ?? "neutral"}`}>
              {metric.trend === "up" && <ArrowUpRight size={14} />}
              {metric.note}
            </div>
          </article>
        ))}
      </section>

      <section className="module-layout">
        <article className="surface data-surface">
          <div className="surface-head">
            <div>
              <h3>Overview</h3>
              <p>Current records and operational status</p>
            </div>
            <button className="icon-button" aria-label="More options"><MoreHorizontal size={19} /></button>
          </div>
          <div className="data-toolbar">
            <label className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${data.title.toLowerCase()}...`}
              />
            </label>
            <button className="secondary"><Filter size={16} /> Filter</button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><b>{item.title}</b><small>{item.subtitle}</small></td>
                    <td>{item.subtitle}</td>
                    <td>{item.meta}</td>
                    <td><span className={`status-pill ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></td>
                    <td><span className="table-value">{item.value}</span><ChevronRight size={15} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Showing {filtered.length} of {data.records.length} mock records</span>
            <div><button className="pager active">1</button><button className="pager">2</button><button className="pager">3</button></div>
          </div>
        </article>

        <aside className="surface insight-panel">
          <div className="insight-icon"><Sparkles size={20} /></div>
          <span className="eyebrow">Smart insights</span>
          <h3>What needs attention</h3>
          <p className="muted">Mock intelligence prepared for this module.</p>
          <div className="insight-list">
            {data.insights.map((insight) => (
              <div className="insight-item" key={insight}>
                <Lightbulb size={17} />
                <span>{insight}</span>
              </div>
            ))}
          </div>
          <button className="soft-button">View recommendations <ArrowUpRight size={15} /></button>
        </aside>
      </section>
    </>
  );
}
