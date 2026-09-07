import { useState, useEffect } from "react";
import { PageHeader }  from "../../../components/ui/PageHeader";
import { Modal }       from "../../../components/ui/Modal";
import { RowActions }  from "../../../components/ui/RowActions";
import { ViewDrawer }  from "../../../components/ui/ViewDrawer";
import { EditModal }   from "../../../components/ui/EditModal";
import { Pagination }  from "../../../components/ui/Pagination";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { useAuth }     from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { api }         from "../../../core/api/ApiClient";
import * as admissionsApi from "../api/admissionsApi";

const rows = (d: any): any[] => Array.isArray(d) ? d : (d?.value?.items ?? d?.items ?? []);

export function AdmissionCriteriaPage() {
  const { user }  = useAuth();
  const tenantId  = user?.roles.includes("SuperAdmin")
    ? ((sessionStorage.getItem("selected_tenant_id") ?? undefined))
    : user?.tenantId;

  const [items,    setItems]    = useState<any[]>([]);
  const [years,    setYears]    = useState<any[]>([]);
  const [classes,  setClasses]  = useState<any[]>([]);
  const [open,     setOpen]     = useState(false);
  const [viewItem, setViewItem] = useState<any|null>(null);
  const [editItem, setEditItem] = useState<any|null>(null);
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 25;

  const [f, setF] = useState<any>({
    schoolId:"", branchId:"", academicYearId:"", classId:"",
    minimumMarks:"", entranceTestMinimum:"", interviewRequired:false, requiredDocuments:"",
  });

  async function branchChanged(branchId: string) {
    setF((x:any) => ({ ...x, branchId, academicYearId:"", classId:"" }));
    if (!branchId) { setYears([]); setClasses([]); return; }
    const [y, cl] = await Promise.all([
      api.get("/api/academics/academic-year", { params:{ tenantId, page:1, pageSize:200 } }),
      api.get("/api/academics/grade-level",   { params:{ tenantId, page:1, pageSize:200 } }),
    ]);
    setYears(rows((y as any).data));
    setClasses(rows((cl as any).data));
  }

  async function load() { setItems(await admissionsApi.criteria(tenantId ?? undefined)); }
  useEffect(() => { void load(); }, [tenantId]);

  async function save() {
    await admissionsApi.createCriteria({
      ...f, tenantId,
      minimumMarks: Number(f.minimumMarks),
      entranceTestMinimum: f.entranceTestMinimum ? Number(f.entranceTestMinimum) : undefined,
    });
    setOpen(false);
    await load();
  }

  const paged = items.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Admission Criteria"
        subtitle="Define admission eligibility by school, branch, academic year and class"
        action={<button className="primary" onClick={() => setOpen(true)}>+ Add criteria</button>}
      />

      <section className="surface data-surface">
        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Min marks %</th><th>Entrance test %</th>
                <th>Interview</th><th>Required documents</th>
                <th>Status</th><th style={{ textAlign:"right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No criteria defined yet.</td></tr>
              ) : paged.map((x:any) => (
                <tr key={x.id}>
                  <td>{x.minimumMarks}%</td>
                  <td>{x.entranceTestMinimum ?? "—"}</td>
                  <td>{x.interviewRequired ? "Required" : "No"}</td>
                  <td style={{ fontSize:12 }}>{x.requiredDocuments || "—"}</td>
                  <td><span className="status-pill">{x.status}</span></td>
                  <td style={{ textAlign:"right" }}>
                    <RowActions
                      onView={() => setViewItem(x)}
                      onEdit={() => setEditItem(x)}
                      onDelete={() => setItems(p => p.filter((i:any) => i.id !== x.id))}
                      deleteLabel="criteria"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={items.length} onPage={setPage} label="criteria"/>
      </section>

      {/* Create modal */}
      <Modal open={open} title="Add admission criteria" onClose={() => setOpen(false)}>
        <div className="human-form">
          <SchoolBranchSelector tenantId={tenantId ?? ""}
            schoolId={f.schoolId} branchId={f.branchId}
            onSchoolChange={schoolId => setF((x:any) => ({ ...x, schoolId, branchId:"" }))}
            onBranchChange={branchChanged}/>
          <div className="human-form-grid">
            <label className="human-field field-wide"><span>Academic year</span>
              <select value={f.academicYearId} onChange={e => setF((x:any) => ({...x, academicYearId:e.target.value}))}>
                <option value="">Select year</option>
                {years.map((y:any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </label>
            <label className="human-field field-wide"><span>Class / Grade</span>
              <select value={f.classId} onChange={e => setF((x:any) => ({...x, classId:e.target.value}))}>
                <option value="">Select class</option>
                {classes.map((cl:any) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
              </select>
            </label>
            <label className="human-field"><span>Minimum marks %</span>
              <input type="number" value={f.minimumMarks} onChange={e => setF((x:any) => ({...x, minimumMarks:e.target.value}))}/>
            </label>
            <label className="human-field"><span>Entrance test %</span>
              <input type="number" value={f.entranceTestMinimum} onChange={e => setF((x:any) => ({...x, entranceTestMinimum:e.target.value}))}/>
            </label>
            <label className="human-field"><span>Interview</span>
              <select value={String(f.interviewRequired)} onChange={e => setF((x:any) => ({...x, interviewRequired:e.target.value==="true"}))}>
                <option value="false">Not required</option>
                <option value="true">Required</option>
              </select>
            </label>
            <label className="human-field"><span>Required documents</span>
              <input value={f.requiredDocuments} onChange={e => setF((x:any) => ({...x, requiredDocuments:e.target.value}))}/>
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="primary"
            disabled={!f.branchId || !f.academicYearId || !f.classId || !f.minimumMarks}
            onClick={() => void save()}>Save criteria</button>
        </div>
      </Modal>

      {viewItem && (
        <ViewDrawer title="Admission Criteria" item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null); }}
          fields={[
            { key:"minimumMarks",        label:"Min marks %"                   },
            { key:"entranceTestMinimum", label:"Entrance test %"               },
            { key:"interviewRequired",   label:"Interview required"            },
            { key:"requiredDocuments",   label:"Required documents", wide:true  },
            { key:"status",              label:"Status"                        },
          ]}
        />
      )}

      {editItem && (
        <EditModal title="Admission Criteria" item={editItem}
          onClose={() => setEditItem(null)}
          onSave={async data => { setEditItem(null); }}
          fields={[
            { key:"minimumMarks",        label:"Min marks %",       type:"number", required:true },
            { key:"entranceTestMinimum", label:"Entrance test %",   type:"number"               },
            { key:"interviewRequired",   label:"Interview",         type:"select", options:[{value:"false",label:"Not required"},{value:"true",label:"Required"}] },
            { key:"requiredDocuments",   label:"Required documents", wide:true                  },
          ]}
        />
      )}
    </>
  );
}
