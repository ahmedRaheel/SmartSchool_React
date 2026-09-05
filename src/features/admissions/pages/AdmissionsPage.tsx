import { PkPhoneInput, PkMobileInput, PkEmailInput, PkWebsiteInput, PkCnicInput, PkAddressBlock, PkCitySelect, PkProvinceSelect } from "../../../components/ui/PakistanFields";
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
import { useState, useRef, useMemo } from "react";
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

const WORKFLOW_RULES = [
  { id:"wr1", name:"Auto-accept if marks ≥ 80% + docs complete",     trigger:"On application submit", action:"ADMISSION_ACCEPTED",    condition:"marks >= 80 && docs.complete",  active:true  },
  { id:"wr2", name:"Auto-reject if marks < minimum criteria",         trigger:"On application submit", action:"ADMISSION_REJECTED",    condition:"marks < criteria.minimum",       active:true  },
  { id:"wr3", name:"Auto-waitlist if class is full",                  trigger:"On application submit", action:"WAITING_LIST",          condition:"section.enrolled >= section.seats",active:true },
  { id:"wr4", name:"Gender policy enforcement",                       trigger:"On application submit", action:"ADMISSION_REJECTED",    condition:"!genderAllowed(branch, gender)", active:true  },
  { id:"wr5", name:"Notify principal for manual review (50–79%)",     trigger:"On submit",             action:"NOTIFY_PRINCIPAL",      condition:"marks >= 50 && marks < 80",     active:true  },
  { id:"wr6", name:"Auto-enroll student on acceptance",               trigger:"On ADMISSION_ACCEPTED", action:"CREATE_STUDENT_ACCOUNT",condition:"always",                        active:true  },
  { id:"wr7", name:"Create parent portal account on acceptance",      trigger:"On ADMISSION_ACCEPTED", action:"CREATE_PARENT_ACCOUNT", condition:"always",                        active:true  },
  { id:"wr8", name:"Send acceptance email to guardian",               trigger:"On ADMISSION_ACCEPTED", action:"SEND_EMAIL",            condition:"guardian.email exists",         active:true  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function AdmissionsPage() {
  const { user } = useAuth();
  const viewAppItem: any = viewAppData ?? null;
  const updApplication = useUpdateApplication();
  const delApplication = useDeleteApplication();
  const [viewAppId, setViewAppId] = useState<string|null>(null);
  const [editAppId, setEditAppId] = useState<string|null>(null);
  const viewAppOrEdit = viewAppId ?? editAppId;
  const { data: viewAppIdData } = useApplicationById(viewAppOrEdit ?? undefined);
  const tid = effectiveTenantId(user) ?? "";

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [phase, setPhase]        = useState<Phase>("inquiries");
  const [search, setSearch]      = useState("");
  const [selected, setSelected]  = useState<any | null>(null);
  const [newAppModal, setNewApp] = useState(false);
  const [newInqModal, setNewInq] = useState(false);
  const [docCompliant, setDocComp] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [apps, setApps]          = useState(env.useMocks ? MOCK_APPLICATIONS : []);
  const [inqs, setInqs]          = useState(env.useMocks ? MOCK_INQUIRIES : []);

  const { data: schoolsData }  = useSchools();
  const { data: campusesData } = useCampuses();
  const { data: yearsData }    = useAcademicYears();
  const { data: sectionsData } = useClassSections();

  const schools  = (schoolsData  as any)?.items ?? (schoolsData  as any) ?? [];
  const campuses = (campusesData as any)?.items ?? (campusesData as any) ?? [];
  const years    = (yearsData    as any)?.items ?? (yearsData    as any) ?? [];
  const sections = (sectionsData as any)?.items ?? (sectionsData as any) ?? [];

  // New application form
  const [appForm, setAppForm] = useState({
    schoolId:"", branchId:"", academicYearId:"", classId:"",
    firstName:"", lastName:"", dateOfBirth:"", gender:"",
    email:"", phone:"", address:"",
    guardianName:"", guardianCnic:"", guardianEmail:"", guardianPhone:"", relationship:"Father",
    previousSchool:"", previousMarks:"",
  });
  const [newAppId] = useState(() => `app-new-${Date.now()}`);

  // New inquiry form
  const [inqForm, setInqForm] = useState({
    firstName:"", lastName:"", gradeApplied:"", guardianName:"", guardianPhone:"", source:"Walk-In",
  });

  function afsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setAppForm(p=>({...p,[k]:e.target.value})); }
  function ifsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setInqForm(p=>({...p,[k]:e.target.value})); }

  const filteredCampuses = appForm.schoolId ? campuses.filter((c:any)=>c.schoolId===appForm.schoolId) : campuses;
  const filteredYears    = appForm.branchId ? years.filter((y:any)=>{ try{return JSON.parse(y.metadataJson||"{}").campusId===appForm.branchId;}catch{return true;}}) : years;

  // Check criteria against application form
  const criteria = appForm.branchId ? (env.useMocks ? MOCK_CRITERIA : []).find((c:any)=>c.BranchName===campuses.find((c:any)=>c.id===appForm.branchId)?.name) : null;
  const marks = parseFloat(appForm.previousMarks || "0");
  const criteriaCheck = criteria ? {
    marks:    marks >= criteria.MinimumMarks,
    gender:   criteria.GenderPolicy === "CO_EDUCATION" ||
              (criteria.GenderPolicy === "BOYS_ONLY"  && appForm.gender === "Male") ||
              (criteria.GenderPolicy === "GIRLS_ONLY" && appForm.gender === "Female"),
    seats:    criteria.Enrolled < criteria.Seats,
    autoAccept: marks >= 80 && docCompliant,
  } : null;

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
    if (env.useMocks) {
      await new Promise(r => setTimeout(r, 600));
      setApps(p => p.map(a => a.Id === appId ? { ...a, Status:status, DecisionNotes:(notes ?? null) as any, StudentId: status==="ADMISSION_ACCEPTED" ? `stu-${Date.now()}` : a.StudentId } : a));
      setSelected((p:any) => p?.Id === appId ? { ...p, Status:status, DecisionNotes:(notes ?? null) as any } : p);
    } else {
      const s = JSON.parse(localStorage.getItem("smartschool.session")??"{}");
      const headers: Record<string,string> = { "Content-Type":"application/json", "X-Mock-Role":s.role??"SchoolAdmin", "X-Mock-TenantId":tid };
      await fetch(`${env.apiBaseUrl}/api/admissions/workflow/applications/${appId}/status`, {
        method:"PUT", headers, body: JSON.stringify({ tenantId:tid, status, notes:notes??null })
      });
      setApps(p => p.map(a => a.Id === appId ? { ...a, Status:status } : a));
    }
    setProcessing(false);
  }

  async function submitApplication() {
    if (!appForm.firstName||!appForm.schoolId||!appForm.branchId||!appForm.guardianName||!appForm.gender) return;
    const autoStatus: AppStatus = criteriaCheck?.autoAccept ? "ADMISSION_ACCEPTED" :
                                  !criteriaCheck?.marks     ? "ADMISSION_REJECTED" :
                                  !criteriaCheck?.gender    ? "ADMISSION_REJECTED" :
                                  !criteriaCheck?.seats     ? "WAITING_LIST"       : "SUBMITTED_APPLICATION";
    const newApp = {
      Id: newAppId, FirstName:appForm.firstName, LastName:appForm.lastName,
      DateOfBirth:appForm.dateOfBirth, Gender:appForm.gender, Email:appForm.email,
      Phone:appForm.phone, GuardianName:appForm.guardianName, GuardianEmail:appForm.guardianEmail,
      GuardianPhone:appForm.guardianPhone, PreviousMarks:marks,
      Status: autoStatus, SubmittedAt:new Date().toISOString(),
      DecisionNotes: autoStatus==="ADMISSION_REJECTED" && !criteriaCheck?.marks ? `Below minimum marks (${criteria?.MinimumMarks}%)` :
                     autoStatus==="ADMISSION_REJECTED" && !criteriaCheck?.gender ? "Gender not eligible for this branch" :
                     autoStatus==="WAITING_LIST" ? "Class section is full" :
                     autoStatus==="ADMISSION_ACCEPTED" ? "Auto-accepted: marks ≥ 80% + documents complete" : null,
      StudentId: autoStatus==="ADMISSION_ACCEPTED" ? `stu-auto-${Date.now()}` : null,
      BranchId:appForm.branchId, SchoolId:appForm.schoolId, ClassId:appForm.classId, docsComplete:docCompliant,
    };
    setApps(p => [newApp as any, ...p]);
    setNewApp(false);
    setPhase("applications");
    setSelected(newApp);
  }

  async function submitInquiry() {
    if (!inqForm.firstName || !inqForm.guardianName || !inqForm.guardianPhone) return;
    const newInq = { id:`inq-${Date.now()}`, applicantFirstName:inqForm.firstName, applicantLastName:inqForm.lastName, gradeApplied:inqForm.gradeApplied, guardianName:inqForm.guardianName, guardianPhone:inqForm.guardianPhone, source:inqForm.source, status:"NEW", submittedAt:new Date().toISOString() };
    setInqs(p => [newInq, ...p]);
    setNewInq(false);
    setInqForm({ firstName:"", lastName:"", gradeApplied:"", guardianName:"", guardianPhone:"", source:"Walk-In" });
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
        <button className={phase==="workflow"?"active":""} onClick={()=>{setPhase("workflow");setSelected(null);}}>⚡ Automation Rules ({WORKFLOW_RULES.filter(r=>r.active).length} active)</button>
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
                          {i.status==="NEW" && <button className="table-action" style={{fontSize:10}} onClick={()=>setInqs(p=>p.map(x=>x.id===i.id?{...x,status:"UNDER_REVIEW"}:x))}>Review</button>}
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
                    <tr key={a.Id} style={{cursor:"pointer"}} onClick={()=>setSelected(a)}>
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
                          : <span style={{color:"#EF4444",fontSize:11,fontWeight:700}}>✗ Missing</span>}
                      </td>
                      <td><span className={`status-pill ${sm.pill}`}>{sm.label}</span></td>
                      <td style={{ textAlign: "right" }}>
                              <RowActions
                                onView={() => setViewAppId(a.Id)}
                                onEdit={() => setEditAppId(a.Id)}
                                onDelete={() => delApplication.mutate(a.Id)}
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
                  {[
                    { label:"Previous marks",    ok: selected.PreviousMarks >= 50,  note:`${selected.PreviousMarks}% (min 50%)` },
                    { label:"Gender eligibility",ok: selected.Gender !== "Female" || campuses.find((c:any)=>c.id===selected.BranchId)?.branchType !== "MALE",  note: selected.Gender },
                    { label:"Documents",         ok: selected.docsComplete,          note: selected.docsComplete ? "All required docs" : "Missing documents" },
                    { label:"Email provided",    ok: !!selected.Email && !!selected.GuardianEmail, note: selected.Email ? "Both present" : "Missing" },
                  ].map(r=>(
                    <div key={r.label} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--surface-2)",fontSize:12}}>
                      {r.ok ? <CheckCircle2 size={14} style={{color:"#10B981",flexShrink:0}}/> : <AlertTriangle size={14} style={{color:"#EF4444",flexShrink:0}}/>}
                      <span style={{flex:1}}>{r.label}</span>
                      <span style={{fontSize:11,color:r.ok?"#10B981":"#EF4444",fontWeight:600}}>{r.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Documents section */}
          <div className="surface">
            <div style={{padding:"16px 20px"}}>
              <DocumentUploader
                actorType="STUDENT"
                entityId={selected.Id}
                tenantId={tid}
                title="Registration Documents"
                onComplianceChange={ok => {
                  if (ok && selected.Status === "SUBMITTED_APPLICATION") {
                    setApps(p => p.map(a => a.Id===selected.Id?{...a,docsComplete:true}:a));
                    setSelected((p:any)=>({...p,docsComplete:true}));
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ADMISSION CRITERIA ── */}
      {phase==="criteria" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Admission criteria</h3><p>Per-branch, per-class eligibility rules enforced automatically on every application</p></div>
            <button className="primary" style={{fontSize:11}}>+ Add criteria</button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Branch</th><th>Class</th><th>Min marks</th><th>Entrance test</th><th>Age range</th><th>Gender policy</th><th>Interview</th><th>Seats</th><th>Fill %</th></tr>
              </thead>
              <tbody>
                {(env.useMocks ? MOCK_CRITERIA : []).map(c => (
                  <tr key={c.Id}>
                    <td><b style={{fontSize:12}}>{c.BranchName}</b></td>
                    <td>{c.ClassName}</td>
                    <td><b style={{color:c.MinimumMarks>=70?"#7C3AED":"var(--text)"}}>{c.MinimumMarks}%</b></td>
                    <td>{c.EntranceTestMinimum ? `${c.EntranceTestMinimum}%` : "—"}</td>
                    <td>{c.MinimumAge ? `${c.MinimumAge}–${c.MaximumAge} yrs` : "—"}</td>
                    <td>
                      <span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,
                                     background:c.GenderPolicy==="CO_EDUCATION"?"#EEF2FF":c.GenderPolicy==="BOYS_ONLY"?"#EFF6FF":"#FDF2F8",
                                     color:c.GenderPolicy==="CO_EDUCATION"?"#6366F1":c.GenderPolicy==="BOYS_ONLY"?"#2563EB":"#DB2777"}}>
                        {c.GenderPolicy==="CO_EDUCATION"?"Co-Ed":c.GenderPolicy==="BOYS_ONLY"?"Boys Only":"Girls Only"}
                      </span>
                    </td>
                    <td>{c.InterviewRequired?"✓ Required":"—"}</td>
                    <td>{c.Seats}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:50,height:6,borderRadius:999,background:"var(--surface-2)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.round((c.Enrolled/c.Seats)*100)}%`,borderRadius:999,background:c.Enrolled/c.Seats>=0.9?"#EF4444":"#10B981"}}/>
                        </div>
                        <span style={{fontSize:11}}>{Math.round((c.Enrolled/c.Seats)*100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── WORKFLOW AUTOMATION ── */}
      {phase==="workflow" && (
        <div>
          <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1px solid #C7D2FE",borderRadius:12,marginBottom:14,display:"flex",gap:12,alignItems:"flex-start"}}>
            <Zap size={20} style={{color:"#6366F1",flexShrink:0,marginTop:2}}/>
            <div>
              <b style={{fontSize:13,color:"#6366F1",display:"block",marginBottom:4}}>AI-powered admission automation</b>
              <p style={{fontSize:12,color:"#475569",margin:0,lineHeight:1.6}}>
                Every application is evaluated automatically against criteria when submitted. The backend
                (<code>/api/admissions/workflow/applications</code>) runs these checks in sequence and
                sets the status without manual intervention. Manual override is always available for borderline cases.
              </p>
            </div>
          </div>
          <div className="surface">
            <div className="surface-head"><h3>Automation rules</h3><p>Runs on every application submission — in order</p></div>
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
              {WORKFLOW_RULES.map((r,i)=>(
                <div key={r.id} style={{padding:"14px 16px",borderRadius:12,border:"1px solid var(--line)",background:"var(--surface)",display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{width:28,height:28,borderRadius:8,background:r.active?"#EEF2FF":"var(--surface-2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:800,color:r.active?"#6366F1":"var(--muted)"}}>{i+1}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:4}}>{r.name}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#FFFBEB",color:"#D97706"}}>Trigger: {r.trigger}</code>
                      <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#EEF2FF",color:"#6366F1"}}>→ {r.action}</code>
                      <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"var(--surface-2)",color:"var(--muted)"}}>if {r.condition}</code>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:r.active?"#ECFDF5":"var(--surface-2)",color:r.active?"#059669":"var(--muted)"}}>
                      {r.active?"Active":"Disabled"}
                    </span>
                    <button style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px solid var(--line)",background:"var(--surface)",cursor:"pointer"}}
                      onClick={()=>{}}>Toggle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW APPLICATION MODAL ── */}
      {newAppModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setNewApp(false)}}>
          <div className="modal-card" style={{width:"min(760px,96vw)",maxHeight:"92vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,background:"var(--surface)",zIndex:1}}>
              <h2>New admission application</h2>
              <button className="icon-button" onClick={()=>setNewApp(false)}><X size={18}/></button>
            </div>

            {/* Real-time criteria feedback */}
            {criteriaCheck && (
              <div style={{margin:"10px 20px 0",padding:"12px 14px",borderRadius:10,
                            background:criteriaCheck.autoAccept?"#ECFDF5":!criteriaCheck.marks||!criteriaCheck.gender?"#FFF0F1":"#FFFBEB",
                            border:`1px solid ${criteriaCheck.autoAccept?"#a7f3d0":!criteriaCheck.marks||!criteriaCheck.gender?"#fecdd3":"#fde68a"}`,
                            fontSize:12}}>
                {criteriaCheck.autoAccept ? (
                  <><CheckCircle2 size={14} style={{display:"inline",marginRight:6,color:"#059669"}}/>
                  <b style={{color:"#065f46"}}>Will be auto-accepted</b> — marks ≥ 80% + documents complete</>
                ) : !criteriaCheck.marks ? (
                  <><AlertTriangle size={14} style={{display:"inline",marginRight:6,color:"#EF4444"}}/>
                  <b style={{color:"#B91C1C"}}>Will be auto-rejected</b> — marks ({marks}%) below minimum ({criteria?.MinimumMarks}%)</>
                ) : !criteriaCheck.gender ? (
                  <><AlertTriangle size={14} style={{display:"inline",marginRight:6,color:"#EF4444"}}/>
                  <b style={{color:"#B91C1C"}}>Will be auto-rejected</b> — gender not eligible for {campuses.find((c:any)=>c.id===appForm.branchId)?.name}</>
                ) : !criteriaCheck.seats ? (
                  <><Clock size={14} style={{display:"inline",marginRight:6,color:"#D97706"}}/>
                  <b style={{color:"#92400E"}}>Will be waitlisted</b> — class section is full</>
                ) : (
                  <><Clock size={14} style={{display:"inline",marginRight:6,color:"#D97706"}}/>
                  <b style={{color:"#92400E"}}>Will go for review</b> — marks in range, pending principal approval</>
                )}
              </div>
            )}

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
                <label className="human-field"><span>Phone</span><input value={appForm.phone} onChange={afsf("phone")} placeholder="0300-1234567"/></label>
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
                <label className="human-field"><span>Guardian phone</span><input value={appForm.guardianPhone} onChange={afsf("guardianPhone")}/></label>
              </div>

              {/* Document upload */}
              <div style={{marginTop:16,padding:"16px",background:"var(--surface-2)",borderRadius:12}}>
                <DocumentUploader
                  actorType="STUDENT"
                  entityId={newAppId}
                  tenantId={tid}
                  title="Upload required documents"
                  onComplianceChange={setDocComp}
                />
              </div>
            </div>

            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setNewApp(false)}>Cancel</button>
              <button className="primary" onClick={submitApplication} disabled={!appForm.firstName||!appForm.schoolId||!appForm.branchId||!appForm.guardianName||!appForm.gender}>
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
              <label className="human-field"><span>Guardian phone *</span><input value={inqForm.guardianPhone} onChange={ifsf("guardianPhone")} placeholder="+92 300 0000000"/></label>
            </div></div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setNewInq(false)}>Cancel</button>
              <button className="primary" onClick={submitInquiry} disabled={!inqForm.firstName||!inqForm.guardianName||!inqForm.guardianPhone}>Submit inquiry</button>
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
          onSave={async data => { await updApplication.mutateAsync({id: editAppId!, body: data}); setEditAppId(null); }}
          fields={[
            { key: "FirstName", label: "First name", type: "text", required: true },
            { key: "LastName", label: "Last name", type: "text", required: true },
            { key: "GuardianName", label: "Guardian name", type: "text" },
            { key: "GuardianPhone", label: "Guardian phone", type: "pk-phone", wide: true },
          ]}
        />
      )}
    </>
  );
}
