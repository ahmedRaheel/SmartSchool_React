import { useState } from "react";
import { DollarSign, Plus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useEmployees } from "../../../core/api/queries";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as A from "../../../core/api/apiAdapter";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function PayrollPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const { data: empData } = useEmployees();
  const employees = (empData as any)?.items ?? (empData as any) ?? [];
  const teachers  = employees.filter((e:any) => e.staffType === "TEACHER");

  return (
    <>
      <PageHeader title="Payroll" subtitle="Monthly payroll register and payslips"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total staff"     value={String(employees.length)} note="" color="#0F2241" bg="#EEF2FF"><DollarSign size={20}/></StatCard>
        <StatCard label="Teachers"        value={String(teachers.length)}  note="" color="#2563EB" bg="#EFF6FF"><DollarSign size={20}/></StatCard>
        <StatCard label="Est. payroll"    value="PKR 2.8M"                 note="This month"    color="#10B981" bg="#ECFDF5"><DollarSign size={20}/></StatCard>
        <StatCard label="Payslips issued" value="—"                        note="Last run"      color="#8B5CF6" bg="#F5F3FF"><DollarSign size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Payroll register</h3><p>Staff and estimated monthly compensation</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Employee</th><th>Number</th><th>Role</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No payroll data yet. Add staff in HR module.</td></tr>
              ) : employees.map((e:any) => (
                <tr key={e.id}>
                  <td><div className="person-cell">
                    <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                      {(e.firstName[0]+(e.lastName?.[0]??"")).toUpperCase()}
                    </span>
                    <div><b>{e.firstName} {e.lastName ?? ""}</b>{e.email&&<div style={{ fontSize:10,color:"var(--muted)" }}>{e.email}</div>}</div>
                  </div></td>
                  <td><code style={{ fontSize:11 }}>{e.employeeNumber ?? "—"}</code></td>
                  <td><span className="status-pill info" style={{ fontSize:9 }}>{e.staffType}</span></td>
                  <td>{e.employmentTypeCode}</td>
                  <td><span className={`status-pill ${e.status==="ACTIVE"?"success":"gray"}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
