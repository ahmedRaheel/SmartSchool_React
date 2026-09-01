import { useState, useMemo } from "react";
import { BookOpen, Plus, Search, X, RotateCcw, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useBooks, useCreateBook, useLoans, useCreateLoan, useStudents } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const CATS = ["Textbook","Literature","History","Science","Technology","Reference","Fiction","Islamic Studies","Urdu","Mathematics"];

export function LibraryPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"books"|"loans"|"issue">("books");
  const [search, setSearch] = useState("");
  const [bookModal, setBookModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState<any|null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useBooks();
  const { data: loansData } = useLoans();
  const { data: studData  } = useStudents();
  const createBook = useCreateBook();
  const createLoan = useCreateLoan();

  const books    = (data as any)?.items      ?? (data as any) ?? [];
  const loans    = (loansData as any)?.items ?? (loansData as any) ?? [];
  const students = (studData as any)?.items  ?? (studData as any) ?? [];

  const [bForm, setBForm] = useState({ title:"", author:"", isbn:"", publisher:"", category:"Textbook", totalCopies:"1", publicationYear:"" });
  const [iForm, setIForm] = useState({ bookId:"", studentId:"", dueDate:"" });
  const bf = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setBForm(p=>({...p,[k]:e.target.value}));
  const iif= (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setIForm(p=>({...p,[k]:e.target.value}));

  const filtered = useMemo(() => books.filter((b:any) => {
    const m = parseMeta(b.metadataJson);
    return `${b.name} ${m.author??""} ${m.isbn??""} ${m.category??""}`.toLowerCase().includes(search.toLowerCase());
  }), [books, search]);

  const activeLoans   = loans.filter((l:any) => parseMeta(l.metadataJson).status === "ACTIVE").length;
  const overdueLoans  = loans.filter((l:any) => parseMeta(l.metadataJson).status === "OVERDUE").length;
  const totalCopies   = books.reduce((a:number,b:any) => a + (parseMeta(b.metadataJson).totalCopies ?? 1), 0);
  const availableCopies = totalCopies - activeLoans - overdueLoans;

  async function saveBook() {
    if (!bForm.title) { setError("Title required"); return; }
    try {
      await createBook.mutateAsync({ tenantId:tid, name:bForm.title, metadataJson:JSON.stringify({
        author:bForm.author, isbn:bForm.isbn, publisher:bForm.publisher,
        category:bForm.category, totalCopies:Number(bForm.totalCopies),
        availableCopies:Number(bForm.totalCopies), publicationYear:bForm.publicationYear
      })});
      setBookModal(false); setBForm({ title:"", author:"", isbn:"", publisher:"", category:"Textbook", totalCopies:"1", publicationYear:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function issueBook() {
    if (!iForm.bookId || !iForm.studentId || !iForm.dueDate) { setError("All fields required"); return; }
    const book = books.find((b:any) => b.id === iForm.bookId);
    const stu  = students.find((s:any) => s.id === iForm.studentId);
    try {
      await createLoan.mutateAsync({ tenantId:tid, name:`Loan — ${book?.name ?? "Book"} → ${stu?.firstName ?? "Student"}`, metadataJson:JSON.stringify({
        bookId:iForm.bookId, bookTitle:book?.name, studentId:iForm.studentId,
        studentName:`${stu?.firstName??""} ${stu?.lastName??""}`.trim(),
        issuedDate:new Date().toISOString().slice(0,10), dueDate:iForm.dueDate, status:"ACTIVE"
      })});
      setIssueModal(false); setIForm({ bookId:"", studentId:"", dueDate:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Library" subtitle="Book catalogue, loan management and reservations"
        action={<div className="page-actions">
          {tab==="books" && <button className="primary" onClick={()=>{setBookModal(true);setError("");}}><Plus size={14}/> Add book</button>}
          {tab==="loans" && <button className="primary" onClick={()=>{setIssueModal(true);setError("");}}><BookOpen size={14}/> Issue book</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total titles"     value={String(books.length)}        note=""              color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Total copies"     value={String(totalCopies)}         note=""              color="#0F2241" bg="#EEF2FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Available"        value={String(Math.max(0,availableCopies))} note=""    color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Overdue returns"  value={String(overdueLoans)}        note="need follow-up" color={overdueLoans>0?"#EF4444":"#10B981"} bg={overdueLoans>0?"#FFF0F1":"#ECFDF5"}><Clock size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="books"?"active":""} onClick={()=>setTab("books")}>📚 Catalogue ({books.length})</button>
        <button className={tab==="loans"?"active":""} onClick={()=>setTab("loans")}>📋 Active loans ({activeLoans})</button>
      </div>

      {tab==="books" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, author, ISBN…"/>
            </label>
          </div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Copies</th><th>Available</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No books found.</td></tr>
                  : filtered.map((b:any) => {
                    const m = parseMeta(b.metadataJson);
                    return (
                      <tr key={b.id}>
                        <td><b style={{fontSize:12}}>{b.name}</b>{m.publisher&&<div style={{fontSize:10,color:"var(--muted)"}}>{m.publisher}{m.publicationYear?` · ${m.publicationYear}`:""}</div>}</td>
                        <td style={{fontSize:11}}>{m.author??"—"}</td>
                        <td><code style={{fontSize:10}}>{m.isbn??"—"}</code></td>
                        <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{m.category??"—"}</span></td>
                        <td style={{textAlign:"center"}}><b>{m.totalCopies??1}</b></td>
                        <td style={{textAlign:"center"}}>
                          <span style={{fontWeight:700,color:(m.availableCopies??m.totalCopies??1)>0?"#059669":"#EF4444"}}>
                            {m.availableCopies??m.totalCopies??1}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer"><span>{filtered.length} titles</span></div>
        </div>
      )}

      {tab==="loans" && (
        <div className="surface">
          <div className="surface-head"><h3>Active loans</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Book</th><th>Student</th><th>Issued</th><th>Due date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {loans.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No active loans.</td></tr>
                : loans.map((l:any) => {
                  const m = parseMeta(l.metadataJson);
                  const isOverdue = m.status==="OVERDUE" || (m.dueDate && new Date(m.dueDate)<new Date() && m.status==="ACTIVE");
                  return (
                    <tr key={l.id}>
                      <td><b style={{fontSize:12}}>{m.bookTitle??l.name}</b></td>
                      <td style={{fontSize:11}}>{m.studentName??"—"}</td>
                      <td style={{fontSize:11}}>{m.issuedDate??"—"}</td>
                      <td style={{fontSize:11,color:isOverdue?"#EF4444":"var(--text)",fontWeight:isOverdue?700:400}}>
                        {m.dueDate??"—"}{isOverdue?" ⚠️":""}
                      </td>
                      <td><span className={`status-pill ${isOverdue?"danger":m.status==="RETURNED"?"success":"info"}`}>{isOverdue?"OVERDUE":m.status??"ACTIVE"}</span></td>
                      <td>
                        {m.status!=="RETURNED" && (
                          <button className="table-action" style={{fontSize:10,display:"flex",alignItems:"center",gap:4}} onClick={()=>setReturnModal(l)}>
                            <RotateCcw size={11}/> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add book modal */}
      {bookModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setBookModal(false)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Add book</h2><button className="icon-button" onClick={()=>setBookModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={bForm.title} onChange={bf("title")} placeholder="Book title"/></label>
              <label className="human-field"><span>Author</span><input value={bForm.author} onChange={bf("author")} placeholder="Author name"/></label>
              <label className="human-field"><span>ISBN</span><input value={bForm.isbn} onChange={bf("isbn")} placeholder="978-…"/></label>
              <label className="human-field"><span>Publisher</span><input value={bForm.publisher} onChange={bf("publisher")}/></label>
              <label className="human-field"><span>Publication year</span><input value={bForm.publicationYear} onChange={bf("publicationYear")} placeholder="2023"/></label>
              <label className="human-field"><span>Category</span>
                <select value={bForm.category} onChange={bf("category")}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
              </label>
              <label className="human-field"><span>Total copies</span><input type="number" min="1" value={bForm.totalCopies} onChange={bf("totalCopies")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setBookModal(false)}>Cancel</button>
              <button className="primary" onClick={saveBook} disabled={createBook.isPending}>{createBook.isPending?"Saving…":"Add book"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Issue book modal */}
      {issueModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setIssueModal(false)}}>
          <div className="modal-card" style={{width:"min(460px,96vw)"}}>
            <div className="modal-head"><h2>Issue book</h2><button className="icon-button" onClick={()=>setIssueModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Book *</span>
                <select value={iForm.bookId} onChange={iif("bookId")}>
                  <option value="">— Select book —</option>
                  {books.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Student *</span>
                <select value={iForm.studentId} onChange={iif("studentId")}>
                  <option value="">— Select student —</option>
                  {students.map((s:any)=><option key={s.id} value={s.id}>{s.firstName} {s.lastName??""} ({s.studentNumber??s.id.slice(-5)})</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Due date *</span><input type="date" value={iForm.dueDate} onChange={iif("dueDate")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setIssueModal(false)}>Cancel</button>
              <button className="primary" onClick={issueBook} disabled={createLoan.isPending}>{createLoan.isPending?"Issuing…":"Issue book"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Return confirmation */}
      {returnModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setReturnModal(null)}}>
          <div className="modal-card" style={{width:"min(380px,96vw)"}}>
            <div className="modal-head"><h2>Return book</h2><button className="icon-button" onClick={()=>setReturnModal(null)}><X size={18}/></button></div>
            <div style={{padding:"20px"}}>
              <p style={{fontSize:13,margin:"0 0 16px"}}>Confirm return of <b>{parseMeta(returnModal.metadataJson).bookTitle}</b> from <b>{parseMeta(returnModal.metadataJson).studentName}</b>?</p>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setReturnModal(null)}>Cancel</button>
              <button className="primary" style={{background:"#059669"}} onClick={()=>setReturnModal(null)}>✓ Confirm return</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
