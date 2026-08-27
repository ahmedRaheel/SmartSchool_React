import { useEffect, useState } from "react";
import { Eye, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/auth";
import { AddEmployeeDialog } from "../components/AddEmployeeDialog";
import { EmployeeSummary, hrApi } from "../api/hrApi";
import { DataGrid, DataGridColumn } from "../../../components/ui/DataGrid";
import { Modal } from "../../../components/ui/Modal";

export function HrPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [employeeToReview, setEmployeeToReview] = useState<EmployeeSummary | null>(null);
  const [employeeToView, setEmployeeToView] = useState<EmployeeSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("SUBMITTED");

  const loadEmployees = async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const page = await hrApi.getEmployees(tenantId);
      setEmployees(page.items ?? []);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Employees could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, [tenantId]);

  const visibleEmployees = employees.filter((employee) => {
    const text = `${employee.employeeNumber} ${employee.firstName} ${employee.lastName ?? ""} ${employee.email ?? ""}`.toLowerCase();
    return text.includes(searchText.toLowerCase());
  });

  async function updateRecruitmentDecision() {
    if (!employeeToReview) {
      return;
    }

    setErrorMessage("");

    try {
      if (selectedStatus === "HIRED") {
        const roleByType: Record<string, string> = {
          TEACHER: "Teacher",
          DRIVER: "Driver",
          PRINCIPAL: "Principal",
          ADMIN_OFFICER: "AdminOffice",
          ACCOUNTANT: "Accountant",
          HR: "HRManager",
          LIBRARIAN: "Librarian",
          TRANSPORT: "TransportManager",
          OTHER: "Staff",
        };

        const portalRole = roleByType[employeeToReview.staffType ?? "OTHER"] ?? "Staff";
        await hrApi.approveEmployee(employeeToReview.id, tenantId, [portalRole]);
      } else {
        await hrApi.updateRecruitmentStatus(
          employeeToReview.id,
          tenantId,
          selectedStatus as "SUBMITTED" | "REJECTED" | "WAITING_LIST",
        );
      }

      setEmployeeToReview(null);
      await loadEmployees();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Employment status could not be updated.",
      );
    }
  }

  function openReview(employee: EmployeeSummary) {
    setEmployeeToReview(employee);
    setSelectedStatus(employee.status);
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">People & HR</span>
          <h1>Employees</h1>
          <p>Manage school employees, employment status and contact information.</p>
        </div>
        <button className="button primary" onClick={() => setShowAddEmployee(true)}>
          <Plus size={17} />
          Add employee
        </button>
      </header>

      <section className="module-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            value={searchText}
            placeholder="Search employees"
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
        <button className="button secondary" onClick={() => void loadEmployees()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {errorMessage && <div className="form-error">{errorMessage}</div>}

      <DataGrid<EmployeeSummary>
        rows={visibleEmployees}
        rowKey={(employee) => employee.id}
        loading={isLoading}
        emptyTitle="No employees found"
        emptyMessage="Add the first employee or change your search."
        columns={[
          { key: "employee", header: "Employee", render: employee => <div className="grid-primary"><span className="grid-avatar">{`${employee.firstName[0] ?? ""}${employee.lastName?.[0] ?? ""}`}</span><div><b>{employee.firstName} {employee.lastName}</b><small>{employee.email || "No email"}</small></div></div> },
          { key: "number", header: "Employee no.", render: employee => <span className="business-code">{employee.employeeNumber ?? "Assigned after approval"}</span> },
          { key: "employment", header: "Employment", render: employee => employee.employmentTypeCode },
          { key: "contact", header: "Contact", render: employee => employee.phone || employee.email || "—" },
          { key: "hireDate", header: "Hire date", render: employee => employee.hireDate },
          {
            key: "status",
            header: "Recruitment status",
            render: (employee) => (
              <span className={`status-pill status-${employee.status.toLowerCase()}`}>
                {employee.status.replaceAll("_", " ")}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            width: "210px",
            render: (employee) => (
              <div className="grid-row-actions">
                <button className="button secondary compact" onClick={() => setEmployeeToView(employee)}>
                  <Eye size={15} />
                  View
                </button>
                {employee.status !== "TERMINATED" && (
                  <button className="button primary compact" onClick={() => openReview(employee)}>
                    <ShieldCheck size={15} />
                    Review
                  </button>
                )}
              </div>
            ),
          },
        ] as DataGridColumn<EmployeeSummary>[]}
      />

      <Modal
        open={Boolean(employeeToView)}
        title="Employee details"
        onClose={() => setEmployeeToView(null)}
      >
        {employeeToView && (
          <div className="detail-grid">
            <article><span>Name</span><b>{employeeToView.firstName} {employeeToView.lastName}</b></article>
            <article><span>Employee no.</span><b>{employeeToView.employeeNumber ?? "Assigned after approval"}</b></article>
            <article><span>Staff type</span><b>{employeeToView.staffType ?? "Staff"}</b></article>
            <article><span>Employment</span><b>{employeeToView.employmentTypeCode}</b></article>
            <article><span>Email</span><b>{employeeToView.email ?? "—"}</b></article>
            <article><span>Phone</span><b>{employeeToView.phone ?? "—"}</b></article>
            <article><span>Hire date</span><b>{employeeToView.hireDate}</b></article>
            <article><span>Status</span><b>{employeeToView.status.replaceAll("_", " ")}</b></article>
          </div>
        )}
        <div className="modal-actions">
          <button className="button secondary" onClick={() => setEmployeeToView(null)}>Close</button>
        </div>
      </Modal>

      <Modal
        open={Boolean(employeeToReview)}
        title="Review recruitment status"
        onClose={() => setEmployeeToReview(null)}
      >
        {employeeToReview && (
          <div className="decision-dialog">
            <div className="decision-summary">
              <b>{employeeToReview.firstName} {employeeToReview.lastName}</b>
              <span>{employeeToReview.staffType ?? "Staff"} · Current status: {employeeToReview.status.replaceAll("_", " ")}</span>
            </div>
            <label className="human-field">
              <span>Decision *</span>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                <option value="SUBMITTED">Submitted</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
                <option value="WAITING_LIST">Waiting list</option>
              </select>
            </label>
            {selectedStatus === "HIRED" && (
              <div className="success-callout">
                Hiring creates the employee portal account using the approved staff type and login email.
              </div>
            )}
          </div>
        )}
        <div className="modal-actions">
          <button className="button secondary" onClick={() => setEmployeeToReview(null)}>Cancel</button>
          <button
            className="button primary"
            disabled={selectedStatus === "HIRED" && !employeeToReview?.email}
            onClick={() => void updateRecruitmentDecision()}
          >
            Update status
          </button>
        </div>
      </Modal>

      {showAddEmployee && (
        <AddEmployeeDialog
          tenantId={tenantId}
          onClose={() => setShowAddEmployee(false)}
          onCreated={() => {
            setShowAddEmployee(false);
            void loadEmployees();
          }}
        />
      )}
    </div>
  );
}
