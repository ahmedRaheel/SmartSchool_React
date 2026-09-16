import { PkPhoneInput, PkMobileInput, PkEmailInput, PkWebsiteInput, PkCnicInput, PkAddressBlock, PkCitySelect, PkProvinceSelect } from "../../../components/ui/PakistanFields";
import { parseMeta, toItems } from "../../../core/utils/dataHelpers";

/**
 * AdmissionsPage — Full two-phase admission flow:
 *
 * Phase 1: INQUIRY → submitted by parent/walk-in, AI chatbot can capture
 * Phase 2: APPLICATION → criteria checked (marks, age, gender-branch policy)
 *         ↓
 *         WORKFLOW auto-evaluates → Principal/Admin approves/rejects
 *         ↓
 *         ACCEPTED → student + parent accounts created automatically
 *         ↓
 *         ENROLLMENT in class section (Students module)
 *
 * Documents required: birth cert, photo, previous result, guardian CNIC
 * Gender policy enforced: Boys-only branch rejects female applicants
 */
import { useState, useRef, useMemo, useEffect } from "react";
import { EditModal } from "../../../components/ui/EditModal";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { RowActions } from "../../../components/ui/RowActions";
import { Pagination } from "../../../components/ui/Pagination";
import {
  AlertTriangle, Bot, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardCheck, FileText, GraduationCap, Plus, Search, Users, X,
 Zap, Clock, ArrowRight} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useSchools, useCampuses, useAcademicYears, useClassSections , useUpdateApplication, useDeleteApplication, useApplicationById} from "../../../core/api/queries";
import { admissionsApi } from "../api/admissionsApi";
import { AdmissionCriteriaPage } from "./AdmissionCriteriaPage";
import { api } from "../../../core/api/ApiClient";
import * as admissionsData from "../../../core/api/apiAdapter";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { env } from "../../../config/env";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "inquiries" | "applications" | "criteria" | "workflow";
type AppStatus = "SUBMITTED_APPLICATION" | "ADMISSION_ACCEPTED" | "ADMISSION_REJECTED" | "WAITING_LIST";

const STATUS_META: Record<string, { label:string; pill:string; color:string; bg:string }> = {
  SUBMITTED_APPLICATION: { label:"Submitted",  pill:"info",    color:"#2563EB", bg:"#EFF6FF" },
  ADMISSION_ACCEPTED:    { label:"Accepted ✓", pill:"success", color:"#059669", bg:"#ECFDF5" },
  ADMISSION_REJECTED:    { label:"Rejected",   pill:"danger",  color:"#EF4444", bg:"#FFF0F1" },
  WAITING_LIST:          { label:"Waitlisted", pill:"warning", color:"#D97706", bg:"#FFFBEB" },
  // Inquiry statuses
  NEW:          { label:"New",          pill:"info",    color:"#2563EB", bg:"#EFF6FF" },
  UNDER_REVIEW: { label:"Under Review", pill:"warning", color:"#D97706", bg:"#FFFBEB" },
  APPROVED:     { label:"Approved",     pill:"success", color:"#059669", bg:"#ECFDF5" },
  ENROLLED:     { label:"Enrolled",     pill:"success", color:"#059669", bg:"#ECFDF5" },
  REJECTED:     { label:"Rejected",     pill:"danger",  color:"#EF4444", bg:"#FFF0F1" },
};

// Mock data matching backend AdmissionApplicationDto
const MOCK_APPLICATIONS = [
  { Id:"app1", FirstName:"Mariam", LastName:"Shah",   DateOfBirth:"2012-04-15", Gender:"Female", Email:"mariam.shah@email.com",   Phone:"+92 300 0000001", GuardianName:"Irfan Shah",   GuardianEmail:"irfan@email.com",   GuardianPhone:"+92 300 0000011", PreviousMarks:78, Status:"SUBMITTED_APPLICATION", SubmittedAt:"2026-08-28T10:00:00Z", DecisionNotes:null, StudentId:null, BranchId:"cccccccc-cccc-cccc-cccc-cccccccccccc", SchoolId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ClassId:"gl5", docsComplete:true  },
  { Id:"app2", FirstName:"Danish",  LastName:"Ali",    DateOfBirth:"2011-07-22", Gender:"Male",   Email:"danish.ali@email.com",    Phone:"+92 300 0000002", GuardianName:"Shahid Ali",   GuardianEmail:"shahid@email.com",  GuardianPhone:"+92 300 0000012", PreviousMarks:85, Status:"ADMISSION_ACCEPTED",    SubmittedAt:"2026-08-25T09:00:00Z", DecisionNotes:"Excellent marks — fast-tracked", StudentId:"new-stu-123", BranchId:"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", SchoolId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ClassId:"gl3", docsComplete:true  },
  { Id:"app3", FirstName:"Sara",    LastName:"Butt",   DateOfBirth:"2009-12-01", Gender:"Female", Email:"sara.butt@email.com",     Phone:"+92 300 0000003", GuardianName:"Kamran Butt",  GuardianEmail:"kamran@email.com",  GuardianPhone:"+92 300 0000013", PreviousMarks:45, Status:"ADMISSION_REJECTED",    SubmittedAt:"2026-08-22T11:00:00Z", DecisionNotes:"Marks below minimum (50%)", StudentId:null, BranchId:"cccccccc-cccc-cccc-cccc-cccccccccccc", SchoolId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ClassId:"gl9", docsComplete:false },
  { Id:"app4", FirstName:"Zara",    LastName:"Ali",    DateOfBirth:"2007-03-11", Gender:"Female", Email:"zara.ali@email.com",      Phone:"+92 300 0000005", GuardianName:"Ali Raza",     GuardianEmail:"ali.raza@email.com",GuardianPhone:"+92 300 0000015", PreviousMarks:62, Status:"SUBMITTED_APPLICATION", SubmittedAt:"2026-08-30T08:30:00Z", DecisionNotes:null, StudentId:null, BranchId:"cccccccc-cccc-cccc-cccc-cccccccccccc", SchoolId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ClassId:"gl10", docsComplete:true  },
  { Id:"app5", FirstName:"Hassan",  LastName:"Noor",   DateOfBirth:"2011-09-05", Gender:"Male",   Email:"hassan.noor@email.com",   Phone:"+92 300 0000004", GuardianName:"Noor Ahmed",   GuardianEmail:"noor@email.com",    GuardianPhone:"+92 300 0000014", PreviousMarks:70, Status:"WAITING_LIST",          SubmittedAt:"2026-08-27T14:00:00Z", DecisionNotes:"Waitlisted — Grade 8 full", StudentId:null, BranchId:"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", SchoolId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", ClassId:"gl4", docsComplete:true  },
];

const MOCK_INQUIRIES = [
  { id:"inq1", applicantFirstName:"Farrukh", applicantLastName:"Khan", gradeApplied:"Grade 9 (Matric)", guardianName:"Imran Khan", guardianPhone:"+92 300 1234567", source:"Website",     status:"NEW",          submittedAt:"2026-08-31T09:00:00Z" },
  { id:"inq2", applicantFirstName:"Alishba", applicantLastName:"Malik", gradeApplied:"A-Level",          guardianName:"Tariq Malik", guardianPhone:"+92 300 7654321", source:"Walk-In",     status:"UNDER_REVIEW", submittedAt:"2026-08-30T11:00:00Z" },
  { id:"inq3", applicantFirstName:"Talha",   applicantLastName:"Ahmed", gradeApplied:"Grade 7 (Matric)", guardianName:"Ahmed Bhai",  guardianPhone:"+92 300 5555555", source:"AI Chatbot",  status:"APPROVED",     submittedAt:"2026-08-29T15:00:00Z" },
  { id:"inq4", applicantFirstName:"Sadia",   applicantLastName:"Bibi",  gradeApplied:"O-Level",          guardianName:"Sabir Bibi",  guardianPhone:"+92 300 3333333", source:"Referral",    status:"ENROLLED",     submittedAt:"2026-08-28T08:00:00Z" },
];

const MOCK_CRITERIA = [
  { Id:"cr1", BranchName:"Main Campus (Boys)",   ClassName:"Grade 9", MinimumMarks:50, EntranceTestMinimum:null, MinimumAge:13, MaximumAge:16, InterviewRequired:false, GenderPolicy:"BOYS_ONLY",  Seats:40, Enrolled:38 },
  { Id:"cr2", BranchName:"Girls Branch",          ClassName:"Grade 9", MinimumMarks:55, EntranceTestMinimum:null, MinimumAge:13, MaximumAge:16, InterviewRequired:false, GenderPolicy:"GIRLS_ONLY", Seats:40, Enrolled:35 },
  { Id:"cr3", BranchName:"Cambridge Centre",      ClassName:"O-Level", MinimumMarks:70, EntranceTestMinimum:65,  MinimumAge:14, MaximumAge:17, InterviewRequired:true,  GenderPolicy:"CO_EDUCATION",Seats:30, Enrolled:28 },
  { Id:"cr4", BranchName:"Cambridge Centre",      ClassName:"A-Level", MinimumMarks:75, EntranceTestMinimum:70,  MinimumAge:16, MaximumAge:20, InterviewRequired:true,  GenderPolicy:"CO_EDUCATION",Seats:25, Enrolled:22 },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function AdmissionsPage() {
  const PAGE_SIZE = 25;
  const { user } = useAuth();
  const [viewAppId, setViewAppId] = useState<string | null>(null);
  const [editAppId, setEditAppId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [criteriaRows, setCriteriaRows] = useState<any[]>([]);

  const tid = effectiveTenantId(user) ?? "";

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [phase, setPhase]        = useState<Phase>("inquiries");
  const [search, setSearch]      = useState("");
  const [selected, setSelected]  = useState<any | null>(null);
  const [newAppModal, setNewApp] = useState(false);
  const [newInqModal, setNewInq] = useState(false);
  const [docCompliant, setDocComp] = useState(false);
  const [entranceMarks, setEntranceMarks] = useState("");
  const [interviewPassed, setInterviewPassed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [apps, setApps]          = useState<any[]>([]);
  const [inqs, setInqs]          = useState<any[]>([]);

  const { data: schoolsData }  = useSchools();
  const { data: campusesData } = useCampuses();
  const { data: yearsData }    = useAcademicYears();
  const { data: sectionsData } = useClassSections();

  const schools  = toItems(schoolsData);
  const campuses = toItems(campusesData);
  const years    = toItems(yearsData);
  const sections = toItems(sectionsData);

  // New application form
  const [appForm, setAppForm] = useState({
    schoolId:"", branchId:"", academicYearId:"", classId:"", classSectionId:"",
    firstName:"", lastName:"", dateOfBirth:"", gender:"",
    email:"", phone:"", address:"",
    guardianName:"", guardianCnic:"", guardianEmail:"", guardianPhone:"", relationship:"Father",
    previousSchool:"", previousMarks:"",
  });


  // New inquiry form
  const [inqForm, setInqForm] = useState({
    firstName:"", lastName:"", gradeApplied:"", guardianName:"", guardianPhone:"", source:"Walk-In",
  });

  function afsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setAppForm(p=>({...p,[k]:e.target.value})); }
  function ifsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setInqForm(p=>({...p,[k]:e.target.value})); }

  const filteredCampuses = appForm.schoolId ? campuses.filter((c:any)=>c.schoolId===appForm.schoolId) : campuses;
  const filteredYears = years.filter((year: any) => !appForm.branchId || year.campusId === appForm.branchId);
  const filteredSections = sections.filter((section: any) =>
    section.campusId === appForm.branchId && section.academicYearId === appForm.academicYearId);
  const marks = appForm.previousMarks ? Number(appForm.previousMarks) : undefined;
  const criteria = criteriaRows.find((item: any) => item.branchId === appForm.branchId &&
    item.academicYearId === appForm.academicYearId && item.classId === appForm.classId);
  const viewAppItem = apps.find(item => item.Id === (viewAppId ?? editAppId));

  function displayApplication(item: any) {
    return Object.fromEntries(Object.entries(item).map(([key, value]) =>
      [key.charAt(0).toUpperCase() + key.slice(1), value]));
  }

  async function loadAdmissions() {
    if (!tid) return;
    setLoading(true);
    setError("");
    try {
      if (env.useMocks) {
        setApps(MOCK_APPLICATIONS);
        setInqs(MOCK_INQUIRIES);
        return;
      }
      const [applications, inquiryPage, rules] = await Promise.all([
        admissionsApi.list(tid), admissionsData.getInquiriesPage(tid, 1, 100), admissionsApi.criteria(tid),
      ]);
      setApps(applications.map(displayApplication));
      setInqs(toItems(inquiryPage).map((item: any) => ({ ...item, ...parseMeta(item.metadataJson) })));
      setCriteriaRows(rules);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAdmissions(); }, [tid]);

  const filteredApps = useMemo(() =>
    apps.filter(a => `${a.FirstName} ${a.LastName} ${a.GuardianName}`.toLowerCase().includes(search.toLowerCase())),
    [apps, search]
  );
  const filteredInqs = useMemo(() =>
    inqs.filter(i => `${i.applicantFirstName} ${i.applicantLastName} ${i.guardianName}`.toLowerCase().includes(search.toLowerCase())),
    [inqs, search]
  );

  async function changeStatus(appId: string, status: AppStatus, notes?: string) {
    setProcessing(true);
    setError("");
    try {
      if (env.useMocks) {
        setApps(items => items.map(item => item.Id === appId ? { ...item, Status: status } : item));
        setSelected((item: any) => item ? { ...item, Status: status } : item);
        return;
      }
      await admissionsApi.status(appId, status, tid, notes, entranceMarks === "" ? undefined : Number(entranceMarks), interviewPassed);
      await loadAdmissions();
      const current = (await admissionsApi.list(tid)).find(item => item.id === appId);
      setSelected(current ? displayApplication(current) : null);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setProcessing(false);
    }
  }

  async function submitApplication() {
    if (processing) return;
    setProcessing(true);
    setError("");
    try {
      const body = {
        ...appForm, tenantId: tid, previousMarks: marks,
        dateOfBirth: appForm.dateOfBirth || undefined,
        academicYearId: appForm.academicYearId || undefined,
        classId: appForm.classId || undefined,
        classSectionId: appForm.classSectionId || undefined,
      };
      const saved = env.useMocks
        ? { id: crypto.randomUUID(), status: "SUBMITTED_APPLICATION" }
        : await admissionsApi.create(body);
      const item = displayApplication({ ...body, ...saved, submittedAt: new Date().toISOString() });
      if (env.useMocks) setApps(items => [item, ...items]);
      else await loadAdmissions();
      setNewApp(false);
      setPhase("applications");
      setSelected(item);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setProcessing(false);
    }
  }

  async function submitInquiry() {
    if (processing) return;
    setProcessing(true);
    setError("");
    try {
      const details = {
        applicantFirstName: inqForm.firstName, applicantLastName: inqForm.lastName,
        gradeApplied: inqForm.gradeApplied, guardianName: inqForm.guardianName,
        guardianPhone: inqForm.guardianPhone, source: inqForm.source,
        status: "NEW", submittedAt: new Date().toISOString(),
      };
      const saved = await admissionsData.createInquiry({
        tenantId: tid, name: `${inqForm.firstName} ${inqForm.lastName}`.trim(),
        metadataJson: JSON.stringify(details),
      });
      if (env.useMocks) setInqs(items => [{ ...saved, ...details }, ...items]);
      else await loadAdmissions();
      setNewInq(false);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setProcessing(false);
    }
  }

  async function reviewInquiry(item: any) {
    try {
      await admissionsData.updateInquiry(item.id, {
        tenantId: tid, name: item.name,
        metadataJson: JSON.stringify({ ...parseMeta(item.metadataJson), status: "UNDER_REVIEW" }),
      });
      await loadAdmissions();
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  async function deleteApplication(id: string) {
    try {
      await api.delete(`/api/admissions/workflow/applications/${id}`, { params: { tenantId: tid } });
      await loadAdmissions();
    } catch (failure) {
      setError(getErrorMessage(failure));
    }
  }

  const counts = {
    submitted: apps.filter(a=>a.Status==="SUBMITTED_APPLICATION").length,
    accepted:  apps.filter(a=>a.Status==="ADMISSION_ACCEPTED").length,
    rejected:  apps.filter(a=>a.Status==="ADMISSION_REJECTED").length,
    waiting:   apps.filter(a=>a.Status==="WAITING_LIST").length,
  };

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Two-phase admission: Inquiry → Application → Approval → Enrollment"
        action={
          <div className="page-actions">
            {phase==="inquiries"    && <button className="primary" onClick={()=>setNewInq(true)}><Plus size={14}/> New Inquiry</button>}
            {phase==="applications" && <button className="primary" onClick={()=>setNewApp(true)}><Plus size={14}/> New Application</button>}
          </div>
        }
      />

      {error && <div role="alert" className="surface" style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}>{error}</div>}
      {loading && <p role="status">Loading admissions…</p>}
      {/* KPIs */}
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Pending review" value={String(counts.submitted)} note="Need decision"  color="#2563EB" bg="#EFF6FF"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Accepted"       value={String(counts.accepted)}  note="Enrolled this term" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Rejected"       value={String(counts.rejected)}  note=""              color="#EF4444" bg="#FFF0F1"><X size={20}/></StatCard>
        <StatCard label="Waitlisted"     value={String(counts.waiting)}   note=""              color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
      </section>

      {/* Flow diagram */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"10px 16px",background:"var(--surface-2)",borderRadius:12,flexWrap:"wrap"}}>
        {[
          { label:"1. Inquiry", color:"#2563EB",  bg:"#EFF6FF",  icon:"📋" },
          { label:"2. Application + Docs", color:"#7C3AED", bg:"#F5F3FF", icon:"📝" },
          { label:"3. Auto-check criteria", color:"#D97706", bg:"#FFFBEB", icon:"⚡" },
          { label:"4. Approve / Reject", color:"#059669",   bg:"#ECFDF5", icon:"✅" },
          { label:"5. Student enrolled", color:"#0F2241",   bg:"#EEF2FF", icon:"🎓" },
        ].map((s,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
            {i>0 && <ArrowRight size={14} style={{color:"var(--muted)"}}/>}
            <span style={{padding:"4px 12px",borderRadius:20,background:s.bg,color:s.color,fontSize:11,fontWeight:700}}>
              {s.icon} {s.label}
            </span>
          </div>
        ))}
        <div style={{marginLeft:"auto",fontSize:11,color:"var(--muted)"}}>
          <Bot size={12} style={{display:"inline",marginRight:4}}/>AI auto-evaluates every application
        </div>
      </div>

      {/* Phase tabs */}
      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={phase==="inquiries"?"active":""} onClick={()=>{setPhase("inquiries");setSelected(null);}}>📋 Inquiries ({inqs.length})</button>
        <button className={phase==="applications"?"active":""} onClick={()=>{setPhase("applications");setSelected(null);}}>📝 Applications ({apps.length})</button>
        <button className={phase==="criteria"?"active":""} onClick={()=>{setPhase("criteria");setSelected(null);}}>⚖️ Admission Criteria</button>
        <button className={phase==="workflow"?"active":""} onClick={()=>{setPhase("workflow");setSelected(null);}}>⚡ Automation Rules ({criteriaRows.length} active)</button>
      </div>

      {/* ── INQUIRIES ── */}
      {phase==="inquiries" && !selected && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search inquiries…"/>
            </label>
            <p style={{fontSize:11,color:"var(--muted)"}}>Inquiries are the first contact. Convert to a full application once the family confirms interest.</p>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Applicant</th><th>Grade applied</th><th>Guardian</th><th>Source</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredInqs.map(i => {
                  const sm = STATUS_META[i.status] ?? STATUS_META.NEW;
                  return (
                    <tr key={i.id}>
                      <td><b>{i.applicantFirstName} {i.applicantLastName}</b></td>
                      <td>{i.gradeApplied}</td>
                      <td><div>{i.guardianName}</div><div style={{fontSize:10,color:"var(--muted)"}}>{i.guardianPhone}</div></td>
                      <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"var(--surface-2)"}}>{i.source}</span></td>
                      <td style={{fontSize:11}}>{new Date(i.submittedAt).toLocaleDateString()}</td>
                      <td><span className={`status-pill ${sm.pill}`}>{sm.label}</span></td>
                      <td>
                        <div className="row-actions">
                          {i.status==="NEW" && <button className="table-action" style={{fontSize:10}} onClick={() => void reviewInquiry(i)}>Review</button>}
                          {i.status==="UNDER_REVIEW" && <button className="table-action" style={{fontSize:10,color:"#059669"}} onClick={()=>{setNewApp(true);setAppForm(p=>({...p,firstName:i.applicantFirstName,lastName:i.applicantLastName,guardianName:i.guardianName,guardianPhone:i.guardianPhone}));}}>Convert → Application</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── APPLICATIONS LIST / DETAIL ── */}
      {phase==="applications" && !selected && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search applications…"/>
            </label>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Applicant</th><th>Branch</th><th>Marks</th><th>Gender</th><th>Guardian</th><th>Docs</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredApps.map(a => {
                  const sm = STATUS_META[a.Status] ?? STATUS_META.SUBMITTED_APPLICATION;
                  const branch = campuses.find((c:any)=>c.id===a.BranchId);
                  return (
                    <tr key={a.Id} style={{cursor:"pointer"}} onClick={()=>{ setEntranceMarks(a.EntranceTestMarks == null ? "" : String(a.EntranceTestMarks)); setInterviewPassed(a.InterviewPassed ?? false); setSelected(a); }}>
                      <td><b>{a.FirstName} {a.LastName}</b><div style={{fontSize:10,color:"var(--muted)"}}>{new Date(a.SubmittedAt).toLocaleDateString()}</div></td>
                      <td style={{fontSize:11}}>{branch?.name ?? "—"}</td>
                      <td>
                        <b style={{color:a.PreviousMarks>=70?"#10B981":a.PreviousMarks>=50?"#D97706":"#EF4444"}}>
                          {a.PreviousMarks}%
                        </b>
                      </td>
                      <td>{a.Gender}</td>
                      <td style={{fontSize:11}}>{a.GuardianName}</td>
                      <td>
                        {a.docsComplete
                          ? <span style={{color:"#10B981",fontSize:11,fontWeight:700}}>✓ Complete</span>
                          : <span style={{fontSize:11}}>Open to check</span>}
                      </td>
                      <td><span className={`status-pill ${sm.pill}`}>{sm.label}</span></td>
                      <td style={{ textAlign: "right" }}>
                              <RowActions
                                onView={() => setViewAppId(a.Id)}
                                onEdit={() => setEditAppId(a.Id)}
                                onDelete={() => deleteApplication(a.Id)}
                                deleteLabel="application"
                              />
                            </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{filteredApps.length} applications</span></div>
        </div>
      )}

      {/* ── APPLICATION DETAIL ── */}
      {phase==="applications" && selected && (
        <div>
          <button className="secondary" style={{marginBottom:14,fontSize:12}} onClick={()=>setSelected(null)}>← Back to applications</button>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {/* Applicant details */}
            <div className="surface">
              <div className="surface-head"><h3>Applicant details</h3></div>
              <div style={{padding:"0 20px 20px"}}>
                {[
                  ["Full name",        `${selected.FirstName} ${selected.LastName}`],
                  ["Date of birth",    selected.DateOfBirth ?? "—"],
                  ["Gender",           selected.Gender ?? "—"],
                  ["Email",            selected.Email ?? "—"],
                  ["Phone",            selected.Phone ?? "—"],
                  ["Previous marks",   `${selected.PreviousMarks}%`],
                  ["Guardian",         selected.GuardianName],
                  ["Guardian email",   selected.GuardianEmail ?? "—"],
                  ["Guardian phone",   selected.GuardianPhone ?? "—"],
                  ["Submitted",        new Date(selected.SubmittedAt).toLocaleString()],
                ].map(([l,v])=>(
                  <div key={l} style={{display:"flex",padding:"9px 0",borderBottom:"1px solid var(--surface-2)",fontSize:12}}>
                    <span style={{width:130,color:"var(--muted)",flexShrink:0}}>{l}</span>
                    <b>{String(v)}</b>
                  </div>
                ))}
              </div>
            </div>

            {/* Status + decision panel */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Current status */}
              <div className="surface">
                <div style={{padding:"16px 20px"}}>
                  {(()=>{
                    const sm = STATUS_META[selected.Status] ?? STATUS_META.SUBMITTED_APPLICATION;
                    return (
                      <div style={{padding:"14px 16px",borderRadius:12,background:sm.bg,border:`1.5px solid ${sm.color}30`,marginBottom:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:sm.color,marginBottom:4}}>Current Status</div>
                        <div style={{fontSize:18,fontWeight:800,color:sm.color}}>{sm.label}</div>
                        {selected.DecisionNotes && <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>{selected.DecisionNotes}</div>}
                        {selected.StudentId && <div style={{fontSize:11,marginTop:6,padding:"4px 10px",background:"white",borderRadius:6,color:sm.color,fontWeight:700}}>Student account created ✓</div>}
                      </div>
                    );
                  })()}

                  {/* Action buttons — only for submitted */}
                  {selected.Status === "SUBMITTED_APPLICATION" && (
                    <div style={{display:"flex",gap:8,flexDirection:"column"}}>
                      <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>Manual decision:</div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="primary" style={{flex:1,fontSize:11,background:"#059669"}} onClick={()=>changeStatus(selected.Id,"ADMISSION_ACCEPTED","Manually approved by administrator")} disabled={processing}>
                          {processing?"Processing…":"✓ Accept admission"}
                        </button>
                        <button className="secondary" style={{flex:1,fontSize:11,color:"#D97706"}} onClick={()=>changeStatus(selected.Id,"WAITING_LIST","Added to waitlist by administrator")} disabled={processing}>
                          ⏱ Waitlist
                        </button>
                      </div>
                      <button style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid #EF4444",background:"#FFF0F1",color:"#EF4444",fontSize:11,fontWeight:700,cursor:"pointer"}}
                        onClick={()=>changeStatus(selected.Id,"ADMISSION_REJECTED","Rejected by administrator")} disabled={processing}>
                        ✗ Reject
                      </button>
                    </div>
                  )}
                  {selected.Status === "ADMISSION_ACCEPTED" && (
                    <div style={{padding:"10px 12px",background:"#ECFDF5",border:"1px solid #a7f3d0",borderRadius:10,fontSize:12,color:"#065f46"}}>
                      ✅ Student + parent accounts provisioned automatically. Student is now in the Students module.
                    </div>
                  )}
                  {selected.Status === "WAITING_LIST" && (
                    <button className="primary" style={{width:"100%",fontSize:11}} onClick={()=>changeStatus(selected.Id,"ADMISSION_ACCEPTED","Promoted from waitlist")} disabled={processing}>
                      Promote from waitlist → Accept
                    </button>
                  )}
                </div>
              </div>

              {/* Criteria check */}
              <div className="surface">
                <div style={{padding:"14px 16px"}}>
                  <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>⚖️ Criteria check</div>
                  <p>Acceptance checks the saved criteria, age, branch gender policy, class capacity and uploaded documents on the server.</p>
                  <p>Previous marks: {selected.PreviousMarks ?? "Not provided"}%</p>
                  <p>Required documents: {selected.docsComplete ? "Complete" : "See document checklist below"}</p>
                  {selected.Status !== "ADMISSION_ACCEPTED" && <>
                    <label className="human-field"><span>Entrance test marks (%)</span><input type="number" min="0" max="100" value={entranceMarks} onChange={e => setEntranceMarks(e.target.value)}/></label>
                    <label><input type="checkbox" checked={interviewPassed} onChange={e => setInterviewPassed(e.target.checked)}/> Interview passed</label>
                  </>}

                </div>
              </div>
            </div>
          </div>

          {/* Documents section */}
          <div className="surface">
            <div style={{padding:"16px 20px"}}>
              <DocumentUploader
                actorType={selected.StudentId ? "STUDENT" : "ADMISSION"}
                entityId={selected.StudentId || selected.Id}
                tenantId={tid}
                title="Registration Documents"
                onComplianceChange={ok => {
                  setApps(p => p.map(a => a.Id===selected.Id?{...a,docsComplete:ok}:a));
                  setSelected((p:any)=>p ? {...p,docsComplete:ok} : p);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "criteria" && <AdmissionCriteriaPage />}

      {phase === "workflow" && <section className="surface" style={{ padding: 24 }}>
        <h3>Admission review process</h3>
        <ol><li>Record an inquiry and create an application with its academic year and class section.</li><li>Upload the required documents and record entrance test or interview outcomes when required.</li><li>An authorized administrator reviews the application and chooses accept, reject or waitlist.</li><li>Acceptance validates eligibility and capacity, provisions student and guardian accounts and saves enrollment.</li></ol>
        <p>Configure admission criteria in the Criteria tab. Decisions and notes are saved with each application.</p>
      </section>}

      {/* ── NEW APPLICATION MODAL ── */}
      {newAppModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setNewApp(false)}}>
          <div className="modal-card" style={{width:"min(760px,96vw)",maxHeight:"92vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,background:"var(--surface)",zIndex:1}}>
              <h2>New admission application</h2>
              <button className="icon-button" onClick={()=>setNewApp(false)}><X size={18}/></button>
            </div>

            {criteria && <p style={{ padding: "12px 20px" }}>Minimum marks: {criteria.minimumMarks}%. Admission requires an authorized decision after the application is saved.</p>}

            <div className="human-form">
              <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Applicant info</div>
              <div className="human-form-grid">
                <label className="human-field"><span>First name *</span><input value={appForm.firstName} onChange={afsf("firstName")}/></label>
                <label className="human-field"><span>Last name</span><input value={appForm.lastName} onChange={afsf("lastName")}/></label>
                <label className="human-field"><span>Date of birth</span><input type="date" value={appForm.dateOfBirth} onChange={afsf("dateOfBirth")}/></label>
                <label className="human-field"><span>Gender *</span>
                  <select value={appForm.gender} onChange={afsf("gender")}>
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </label>
                <label className="human-field"><span>Student email</span><input type="email" value={appForm.email} onChange={afsf("email")} placeholder="student@email.com"/></label>
                <PkPhoneInput label="Phone" value={appForm.phone} onChange={v => afsf("phone")({target:{value:v}} as any)}/>
              </div>

              <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4,marginTop:8}}>Enrollment target</div>
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>School *</span>
                  <select value={appForm.schoolId} onChange={afsf("schoolId")}>
                    <option value="">— Select school —</option>
                    {schools.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="human-field field-wide"><span>Campus / Branch *</span>
                  <select value={appForm.branchId} onChange={afsf("branchId")}>
                    <option value="">— Select campus —</option>
                    {filteredCampuses.map((c:any)=>(
                      <option key={c.id} value={c.id}>{c.name} ({c.branchType==="MALE"?"Boys Only":c.branchType==="FEMALE"?"Girls Only":"Co-Ed"})</option>
                    ))}
                  </select>
                </label>
                <label className="human-field"><span>Academic year</span>
                  <select value={appForm.academicYearId} onChange={afsf("academicYearId")}>
                    <option value="">— Select —</option>
                    {filteredYears.map((y:any)=><option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Class section *</span>
                  <select value={appForm.classSectionId} onChange={event => {
                    const section = sections.find((item: any) => item.id === event.target.value);
                    setAppForm(form => ({ ...form, classSectionId: event.target.value, classId: section?.gradeLevelId ?? "" }));
                  }}>
                    <option value="">Select class section</option>
                    {filteredSections.map((section: any) => <option key={section.id} value={section.id}>{section.gradeLevelName} {section.name}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Previous marks (%)</span><input type="number" min="0" max="100" value={appForm.previousMarks} onChange={afsf("previousMarks")} placeholder="e.g. 75"/></label>
              </div>

              <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4,marginTop:8}}>Guardian info</div>
              <div className="human-form-grid">
                <label className="human-field"><span>Guardian name *</span><input value={appForm.guardianName} onChange={afsf("guardianName")}/></label>
                <label className="human-field"><span>Relationship</span>
                  <select value={appForm.relationship} onChange={afsf("relationship")}>
                    {["Father","Mother","Guardian","Grandfather","Grandmother","Other"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </label>
                <PkCnicInput label="Guardian CNIC" value={appForm.guardianCnic} onChange={(v) => setAppForm(p=>({...p,guardianCnic:v}))} />
                <label className="human-field"><span>Guardian email *</span><input type="email" value={appForm.guardianEmail} onChange={afsf("guardianEmail")} placeholder="student@email.com"/></label>
                <PkPhoneInput label="Guardian phone" value={appForm.guardianPhone} onChange={v => afsf("guardianPhone")({target:{value:v}} as any)}/>
              </div>

              <p>Save the application first, then upload its required documents from the application details.</p>
            </div>

            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setNewApp(false)}>Cancel</button>
              <button className="primary" onClick={submitApplication} disabled={processing || !appForm.firstName || !appForm.schoolId || !appForm.branchId || !appForm.guardianName || !appForm.gender || !appForm.classSectionId}>
                Submit application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW INQUIRY MODAL ── */}
      {newInqModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setNewInq(false)}}>
          <div className="modal-card" style={{width:"min(500px,96vw)"}}>
            <div className="modal-head"><h2>New admission inquiry</h2><button className="icon-button" onClick={()=>setNewInq(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field"><span>Applicant first name *</span><input value={inqForm.firstName} onChange={ifsf("firstName")}/></label>
              <label className="human-field"><span>Last name</span><input value={inqForm.lastName} onChange={ifsf("lastName")}/></label>
              <label className="human-field field-wide"><span>Grade applied for</span><input value={inqForm.gradeApplied} onChange={ifsf("gradeApplied")} placeholder="e.g. Grade 9 (Matric), O-Level"/></label>
              <label className="human-field"><span>Source</span>
                <select value={inqForm.source} onChange={ifsf("source")}>
                  {["Walk-In","Website","Referral","AI Chatbot","Phone","Social Media"].map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Guardian name *</span><input value={inqForm.guardianName} onChange={ifsf("guardianName")}/></label>
              <PkPhoneInput label="Guardian phone" required value={inqForm.guardianPhone} onChange={v => ifsf("guardianPhone")({target:{value:v}} as any)}/>
            </div></div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setNewInq(false)}>Cancel</button>
              <button className="primary" onClick={submitInquiry} disabled={processing || !inqForm.firstName || !inqForm.guardianName || !inqForm.guardianPhone}>Submit inquiry</button>
            </div>
          </div>
        </div>
      )}

      {viewAppId && viewAppItem && (
        <ViewDrawer
          title="Application"
          item={viewAppItem}
          onClose={() => setViewAppId(null)}
          onEdit={() => { setEditAppId(viewAppId!); setViewAppId(null); }}
          fields={[
            { key: "FirstName", label: "First name" },
            { key: "LastName", label: "Last name" },
            { key: "DateOfBirth", label: "Date of birth" },
            { key: "Gender", label: "Gender" },
            { key: "ApplyingForClass", label: "Applying for" },
            { key: "GuardianName", label: "Guardian" },
            { key: "GuardianPhone", label: "Guardian phone" },
            { key: "Status", label: "Status" },
            { key: "PreviousSchool", label: "Previous school", wide: true },
          ]}
        />
      )}
      {editAppId && viewAppItem && (
        <EditModal
          title="Application"
          item={viewAppItem}
          onClose={() => setEditAppId(null)}
          onSave={async data => {
            await api.put(`/api/admissions/workflow/applications/${editAppId}`, {
              tenantId: tid, firstName: data.FirstName, lastName: data.LastName,
              guardianName: data.GuardianName, guardianPhone: data.GuardianPhone,
            });
            setEditAppId(null);
            await loadAdmissions();
          }}
          fields={[
            { key: "FirstName", label: "First name", type: "text", required: true },
            { key: "LastName", label: "Last name", type: "text", required: true },
            { key: "GuardianName", label: "Guardian name", type: "text" },
            { key: "GuardianPhone", label: "Guardian phone", type: "pk-phone", wide: true },
          ]}
        />
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={apps.length} onPage={setPage} label="applications"/>
    </>
  );
}
