import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../../auth/auth";
import { AddEmployeeDialog } from "../components/AddEmployeeDialog";
import { EmployeeSummary, hrApi } from "../api/hrApi";
import { DataGrid, DataGridColumn } from "../../../components/ui/DataGrid";

export function HrPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [employeeToApprove, setEmployeeToApprove] = useState<EmployeeSummary | null>(null);
  const [selectedRole, setSelectedRole] = useState("Teacher");

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

  async function approveEmployee() {
    if (!employeeToApprove) return;
    setErrorMessage("");
    try {
      await hrApi.approveEmployee(employeeToApprove.id, tenantId, [selectedRole]);
      setEmployeeToApprove(null);
      await loadEmployees();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Employee approval failed.");
    }
  }

  async function changeRecruitmentStatus(employee: EmployeeSummary, status: string) {
    setErrorMessage("");
    try {
      if (status === "HIRED") {
        const roleByType: Record<string,string> = { TEACHER:"Teacher", DRIVER:"Driver", PRINCIPAL:"Principal", ADMIN_OFFICER:"AdminOffice", ACCOUNTANT:"Accountant", HR:"HRManager", LIBRARIAN:"Librarian", TRANSPORT:"TransportManager", OTHER:"Staff" };
        await hrApi.approveEmployee(employee.id, tenantId, [roleByType[employee.staffType ?? "OTHER"] ?? "Staff"]);
      } else {
        await hrApi.updateRecruitmentStatus(employee.id, tenantId, status as "SUBMITTED" | "REJECTED" | "WAITING_LIST");
      }
      await loadEmployees();
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Employment status could not be updated."); }
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
          { key: "status", header: "Recruitment status", render: employee => employee.status === "HIRED" || employee.status === "TERMINATED" ? <span className="status-pill">{employee.status}</span> : <select value={employee.status} onChange={event => void changeRecruitmentStatus(employee,event.target.value)}><option value="SUBMITTED">Submitted</option><option value="HIRED">Hired</option><option value="REJECTED">Rejected</option><option value="WAITING_LIST">Waiting list</option></select> },
        ] as DataGridColumn<EmployeeSummary>[]}
      />

      {employeeToApprove && (
        <div className="workflow-overlay">
          <section className="workflow-dialog compact-dialog" role="dialog" aria-modal="true">
            <header className="workflow-header">
              <div><small>ACCOUNT APPROVAL</small><h2>Approve {employeeToApprove.firstName}</h2><p>Choose the school role. The Identity account is created only after this approval.</p></div>
            </header>
            <div className="workflow-body">
              <label className="field"><span>Portal role</span><select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}><option>Teacher</option><option>AdminOffice</option><option>Accountant</option><option>HRManager</option><option>Librarian</option><option>TransportManager</option><option>Driver</option></select></label>
              <div className="callout"><b>Login email</b><span>{employeeToApprove.email || "Add an employee email before approval."}</span></div>
            </div>
            <footer className="workflow-footer"><button className="button secondary" onClick={() => setEmployeeToApprove(null)}>Cancel</button><button className="button primary" disabled={!employeeToApprove.email} onClick={() => void approveEmployee()}>Approve & create account</button></footer>
          </section>
        </div>
      )}

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
