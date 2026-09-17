import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock, Plus, RotateCcw, Search, UserRound, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useCampuses, useEmployees, useStudents } from "../../../core/api/queries";
import { operationalApi } from "../../../core/api/operationalApi";
import { toItems } from "../../../core/utils/dataHelpers";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { usePermissions } from "../../../core/rbac/usePermissions";

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export function LibraryPage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const canManageCatalogue = permissions.can("library.catalogue.manage");
  const canManageLoans = permissions.can("library.loans.manage");
  const canManageLibrary = canManageCatalogue || canManageLoans;

  const [tab, setTab] = useState<"catalogue" | "loans" | "returns">("catalogue");
  const [search, setSearch] = useState("");
  const [bookModal, setBookModal] = useState(false);
  const [loanModal, setLoanModal] = useState(false);
  const [campusId, setCampusId] = useState(user?.branchId ?? "");
  const [borrowerType, setBorrowerType] = useState<"STUDENT" | "EMPLOYEE">("STUDENT");
  const [bookForm, setBookForm] = useState({ title: "", isbn: "", author: "", publisher: "", copyCount: "1" });
  const [loanForm, setLoanForm] = useState({ bookId: "", borrowerId: "", dueAt: "" });

  const dashboard = useQuery({
    queryKey: ["library-operations", tenantId],
    queryFn: () => operationalApi.library.dashboard(tenantId),
    enabled: canManageLibrary && Boolean(tenantId),
  });
  const { data: campusData } = useCampuses();
  const { data: studentData } = useStudents(1, loanModal && borrowerType === "STUDENT");
  const { data: employeeData } = useEmployees(1, loanModal && borrowerType === "EMPLOYEE");
  const campuses = toItems(campusData);
  const students = toItems(studentData);
  const employees = toItems(employeeData);

  const createBook = useMutation({
    mutationFn: () => operationalApi.library.createBook({
      tenantId,
      campusId,
      title: bookForm.title.trim(),
      isbn: bookForm.isbn.trim() || undefined,
      author: bookForm.author.trim() || undefined,
      publisher: bookForm.publisher.trim() || undefined,
      copyCount: Number(bookForm.copyCount),
    }),
    onSuccess: async () => {
      setBookModal(false);
      setBookForm({ title: "", isbn: "", author: "", publisher: "", copyCount: "1" });
      await queryClient.invalidateQueries({ queryKey: ["library-operations", tenantId] });
    },
  });

  const issueLoan = useMutation({
    mutationFn: () => operationalApi.library.issue({
      tenantId,
      bookId: loanForm.bookId,
      studentId: borrowerType === "STUDENT" ? loanForm.borrowerId : null,
      employeeId: borrowerType === "EMPLOYEE" ? loanForm.borrowerId : null,
      dueAt: new Date(loanForm.dueAt).toISOString(),
    }),
    onSuccess: async () => {
      setLoanModal(false);
      setLoanForm({ bookId: "", borrowerId: "", dueAt: "" });
      await queryClient.invalidateQueries({ queryKey: ["library-operations", tenantId] });
    },
  });

  const returnLoan = useMutation({
    mutationFn: (loanId: string) => operationalApi.library.returnLoan(tenantId, loanId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library-operations", tenantId] }),
  });

  if (!canManageLibrary) {
    return (
      <>
        <PageHeader title="Library" subtitle="Browse your library services from the self-service workspace." />
        <div className="surface">
          <div className="empty-state">
            <BookOpen size={34} />
            <b>Library circulation is managed by authorized staff</b>
            <p>Your role does not have catalogue or loan-management permission. Your personal borrowing information remains available through the self-service portal.</p>
          </div>
        </div>
      </>
    );
  }

  const catalogue = dashboard.data?.catalogue ?? [];
  const currentLoans = dashboard.data?.currentLoans ?? [];
  const recentReturns = dashboard.data?.recentReturns ?? [];
  const totalCopies = catalogue.reduce((sum, item) => sum + Number(item.totalCopies), 0);
  const availableCopies = catalogue.reduce((sum, item) => sum + Number(item.availableCopies), 0);
  const overdueCount = currentLoans.filter(item => item.isOverdue).length;
  const term = search.trim().toLowerCase();
  const filteredCatalogue = catalogue.filter(item => `${item.title} ${item.author ?? ""} ${item.isbn ?? ""}`.toLowerCase().includes(term));
  const filteredLoans = currentLoans.filter(item => `${item.title} ${item.borrowerName} ${item.barcode}`.toLowerCase().includes(term));
  const filteredReturns = recentReturns.filter(item => `${item.title} ${item.borrowerName} ${item.barcode}`.toLowerCase().includes(term));

  const borrowers = borrowerType === "STUDENT"
    ? students.map((item: any) => ({ id: item.id, name: `${item.firstName} ${item.lastName ?? ""}`.trim(), number: item.studentNumber }))
    : employees.map((item: any) => ({ id: item.id, name: `${item.firstName} ${item.lastName ?? ""}`.trim(), number: item.employeeNumber }));

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Catalogue, physical copies and circulation"
        action={(canManageCatalogue || canManageLoans) ? (
          <div className="page-actions">
            {canManageCatalogue && <button className="secondary" onClick={() => setBookModal(true)}><Plus size={14} /> Add book</button>}
            {canManageLoans && <button className="primary" onClick={() => setLoanModal(true)}><BookOpen size={14} /> Issue book</button>}
          </div>
        ) : undefined}
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Titles" value={String(catalogue.length)} note="catalogue" color="#2563EB" bg="#EFF6FF"><BookOpen size={20} /></StatCard>
        <StatCard label="Physical copies" value={String(totalCopies)} note="all campuses" color="#4F46E5" bg="#EEF2FF"><BookOpen size={20} /></StatCard>
        <StatCard label="Available" value={String(availableCopies)} note="ready to issue" color="#059669" bg="#ECFDF5"><CheckCircle2 size={20} /></StatCard>
        <StatCard label="Overdue" value={String(overdueCount)} note={overdueCount ? "follow-up required" : "all on track"} color={overdueCount ? "#DC2626" : "#059669"} bg={overdueCount ? "#FEF2F2" : "#ECFDF5"}><Clock size={20} /></StatCard>
      </section>

      <div className="section-tabs">
        <button className={tab === "catalogue" ? "active" : ""} onClick={() => setTab("catalogue")}>📚 Catalogue ({catalogue.length})</button>
        <button className={tab === "loans" ? "active" : ""} onClick={() => setTab("loans")}>📋 Current loans ({currentLoans.length})</button>
        <button className={tab === "returns" ? "active" : ""} onClick={() => setTab("returns")}>↩ Recent returns ({recentReturns.length})</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left">
            <h3>{tab === "catalogue" ? "Book catalogue" : tab === "loans" ? "Current circulation" : "Recently returned"}</h3>
            <p>{tab === "catalogue" ? "Availability is calculated from physical copies." : "Loan status is read from persisted circulation records."}</p>
          </div>
          <label className="search-box" style={{ maxWidth: 310 }}><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, borrower, ISBN or barcode…" /></label>
        </div>

        {dashboard.isLoading ? (
          <div className="empty-state"><b>Loading library…</b><p>Reading catalogue and circulation records.</p></div>
        ) : tab === "catalogue" ? (
          filteredCatalogue.length === 0 ? <div className="empty-state"><BookOpen size={34} /><b>No books found</b><p>Add the first title and its physical copies.</p></div> : (
            <div className="table-wrap"><table className="premium-table">
              <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Publisher</th><th>Copies</th><th>Available</th></tr></thead>
              <tbody>{filteredCatalogue.map(book => <tr key={book.bookId}>
                <td><b>{book.title}</b></td><td>{book.author || "—"}</td><td><code style={{ fontSize: 11 }}>{book.isbn || "—"}</code></td><td>{book.publisher || "—"}</td>
                <td><b>{book.totalCopies}</b></td><td><span className={`status-pill ${book.availableCopies > 0 ? "success" : "danger"}`}>{book.availableCopies}</span></td>
              </tr>)}</tbody>
            </table></div>
          )
        ) : tab === "loans" ? (
          filteredLoans.length === 0 ? <div className="empty-state"><CheckCircle2 size={34} /><b>No books are currently on loan</b><p>Issued books will appear here until returned.</p></div> : (
            <div className="table-wrap"><table className="premium-table">
              <thead><tr><th>Book</th><th>Borrower</th><th>Barcode</th><th>Issued</th><th>Due</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>{filteredLoans.map(loan => <tr key={loan.loanId}>
                <td><b>{loan.title}</b></td><td><div className="person-cell"><span className="row-avatar"><UserRound size={13} /></span><b>{loan.borrowerName}</b></div></td>
                <td><code style={{ fontSize: 11 }}>{loan.barcode}</code></td><td>{dateTime(loan.issuedAt)}</td><td>{dateTime(loan.dueAt)}</td>
                <td><span className={`status-pill ${loan.isOverdue ? "danger" : "info"}`}>{loan.isOverdue ? "Overdue" : "On loan"}</span></td>
                <td style={{ textAlign: "right" }}>{canManageLoans && <button className="soft-button" disabled={returnLoan.isPending} onClick={() => returnLoan.mutate(loan.loanId)}><RotateCcw size={13} /> Return</button>}</td>
              </tr>)}</tbody>
            </table></div>
          )
        ) : (
          filteredReturns.length === 0 ? <div className="empty-state"><RotateCcw size={34} /><b>No recent returns</b><p>Completed loans will be retained here for circulation history.</p></div> : (
            <div className="table-wrap"><table className="premium-table">
              <thead><tr><th>Book</th><th>Borrower</th><th>Barcode</th><th>Issued</th><th>Returned</th><th>Status</th></tr></thead>
              <tbody>{filteredReturns.map(loan => <tr key={loan.loanId}>
                <td><b>{loan.title}</b></td><td>{loan.borrowerName}</td><td><code style={{ fontSize: 11 }}>{loan.barcode}</code></td><td>{dateTime(loan.issuedAt)}</td><td>{loan.returnedAt ? dateTime(loan.returnedAt) : "—"}</td><td><span className="status-pill success">Returned</span></td>
              </tr>)}</tbody>
            </table></div>
          )
        )}
      </div>

      {bookModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setBookModal(false)}>
          <div className="modal-card" style={{ width: "min(620px,96vw)" }}>
            <div className="modal-head"><div><h2>Add library book</h2><p>Create a title and physical copy barcodes.</p></div><button className="icon-button" onClick={() => setBookModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={bookForm.title} onChange={event => setBookForm(current => ({ ...current, title: event.target.value }))} /></label>
              <label className="human-field"><span>Author</span><input value={bookForm.author} onChange={event => setBookForm(current => ({ ...current, author: event.target.value }))} /></label>
              <label className="human-field"><span>ISBN</span><input value={bookForm.isbn} onChange={event => setBookForm(current => ({ ...current, isbn: event.target.value }))} /></label>
              <label className="human-field"><span>Publisher</span><input value={bookForm.publisher} onChange={event => setBookForm(current => ({ ...current, publisher: event.target.value }))} /></label>
              <label className="human-field"><span>Physical copies *</span><input type="number" min="1" max="500" value={bookForm.copyCount} onChange={event => setBookForm(current => ({ ...current, copyCount: event.target.value }))} /></label>
              {!user?.branchId && <label className="human-field field-wide"><span>Campus *</span><select value={campusId} onChange={event => setCampusId(event.target.value)}><option value="">Select campus</option>{campuses.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setBookModal(false)}>Cancel</button><button className="primary" disabled={!bookForm.title.trim() || !campusId || createBook.isPending} onClick={() => createBook.mutate()}>{createBook.isPending ? "Saving…" : "Add book"}</button></div>
          </div>
        </div>
      )}

      {loanModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setLoanModal(false)}>
          <div className="modal-card" style={{ width: "min(620px,96vw)" }}>
            <div className="modal-head"><div><h2>Issue book</h2><p>An available physical copy is reserved automatically.</p></div><button className="icon-button" onClick={() => setLoanModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Book *</span><select value={loanForm.bookId} onChange={event => setLoanForm(current => ({ ...current, bookId: event.target.value }))}><option value="">Select available title</option>{catalogue.filter(item => item.availableCopies > 0).map(item => <option key={item.bookId} value={item.bookId}>{item.title} · {item.availableCopies} available</option>)}</select></label>
              <label className="human-field"><span>Borrower type</span><select value={borrowerType} onChange={event => { setBorrowerType(event.target.value as "STUDENT" | "EMPLOYEE"); setLoanForm(current => ({ ...current, borrowerId: "" })); }}><option value="STUDENT">Student</option><option value="EMPLOYEE">Employee</option></select></label>
              <label className="human-field"><span>Borrower *</span><select value={loanForm.borrowerId} onChange={event => setLoanForm(current => ({ ...current, borrowerId: event.target.value }))}><option value="">Select borrower</option>{borrowers.map(item => <option key={item.id} value={item.id}>{item.name}{item.number ? ` (${item.number})` : ""}</option>)}</select></label>
              <label className="human-field field-wide"><span>Due date & time *</span><input type="datetime-local" value={loanForm.dueAt} onChange={event => setLoanForm(current => ({ ...current, dueAt: event.target.value }))} /></label>
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setLoanModal(false)}>Cancel</button><button className="primary" disabled={!loanForm.bookId || !loanForm.borrowerId || !loanForm.dueAt || issueLoan.isPending} onClick={() => issueLoan.mutate()}>{issueLoan.isPending ? "Issuing…" : "Issue book"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
