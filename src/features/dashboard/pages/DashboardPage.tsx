import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { api } from "../../../core/api/api";
import { PageHeader } from "../../../components/ui/PageHeader";

type Data = {
  stats: { label: string; value: string; change: string }[];
  attendance: { day: string; value: number }[];
  events: string[][];
  performers: string[][];
};

const statIcons = [GraduationCap, UsersRound, CircleDollarSign, UserRoundCheck];
const feeData = [{ name: "Collected", value: 81 }, { name: "Outstanding", value: 19 }];

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Data>("/dashboard") });
  if (!data) return <div className="loading-card">Loading dashboard…</div>;

  return (
    <>
      <PageHeader
        title="Good afternoon, Ayesha"
        subtitle="Here is your school pulse for Tuesday, 18 August 2026."
        action={<button className="primary">Quick action <ChevronRight size={16} /></button>}
      />

      <section className="metric-grid">
        {data.stats.map((stat, index) => {
          const Icon = statIcons[index];
          return (
            <article className="metric-card" key={stat.label}>
              <div className="metric-top"><span className="metric-icon"><Icon size={19} /></span><span className="metric-menu">•••</span></div>
              <div className="metric-label">{stat.label}</div>
              <div className="metric-value">{stat.value}</div>
              <div className={`metric-note ${stat.change.startsWith("-") ? "down" : "up"}`}><ArrowUpRight size={14} /> {stat.change} from last month</div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-layout">
        <article className="surface attendance-card">
          <div className="surface-head"><div><h3>Attendance overview</h3><p>Student attendance during the last 7 days</p></div><select className="compact-select"><option>This week</option></select></div>
          <div className="chart-large">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.attendance}>
                <defs><linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28}/><stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="var(--brand)" fill="url(#attendanceFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface fee-card">
          <div className="surface-head"><div><h3>Fee collection</h3><p>August 2026</p></div></div>
          <div className="fee-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={feeData} innerRadius={62} outerRadius={80} paddingAngle={4} dataKey="value"><Cell fill="var(--brand)" /><Cell fill="var(--soft)" /></Pie></PieChart>
            </ResponsiveContainer>
            <div className="fee-center"><b>81%</b><span>collected</span></div>
          </div>
          <div className="fee-summary"><div><span>Collected</span><b>PKR 12.8M</b></div><div><span>Outstanding</span><b>PKR 3.1M</b></div></div>
        </article>

        <article className="surface performers-card">
          <div className="surface-head"><div><h3>Top performers</h3><p>Current term</p></div><button className="text-button">View all</button></div>
          {data.performers.map((item, index) => (
            <div className="performer" key={item[0]}>
              <span className="rank">{index + 1}</span><span className="avatar small">{item[0].split(" ").map((x) => x[0]).join("").slice(0,2)}</span>
              <div><b>{item[0]}</b><small>Grade {10 - (index % 3)} • Section A</small></div><strong>{item[1]}</strong>
            </div>
          ))}
        </article>

        <article className="surface events-card">
          <div className="surface-head"><div><h3>Upcoming events</h3><p>School calendar</p></div><CalendarDays size={19} /></div>
          {data.events.map((event) => (
            <div className="event-row" key={event[1]}><div className="event-date">{event[0].split(" ")[0]}<small>{event[0].split(" ")[1]}</small></div><div><b>{event[1]}</b><small>Main campus • 09:00 AM</small></div></div>
          ))}
        </article>

        <article className="surface ai-brief">
          <div className="ai-orb"><Sparkles size={22} /></div>
          <div><span className="eyebrow">AI school brief</span><h3>3 insights need your attention</h3><p>34 students show grade-risk signals, 12 fee accounts need follow-up, and Grade 7 C attendance is below target.</p></div>
          <button className="soft-button">Open AI intelligence <ArrowUpRight size={15} /></button>
        </article>
      </section>
    </>
  );
}
