import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../../auth/auth";
import { AddEmployeeDialog } from "../components/AddEmployeeDialog";
import { EmployeeSummary, hrApi } from "../api/hrApi";

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

      <section className="data-card">
        {isLoading ? (
          <div className="empty-state">Loading employees…</div>
        ) : visibleEmployees.length === 0 ? (
          <div className="empty-state">
            <Users size={30} />
            <h3>No employees found</h3>
            <p>Add the first employee or change your search.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee no.</th>
                  <th>Employment</th>
                  <th>Contact</th>
                  <th>Hire date</th>
                  <th>Status / access</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.firstName} {employee.lastName}</strong>
                    </td>
                    <td>{employee.employeeNumber ?? "Assigned after approval"}</td>
                    <td>{employee.employmentTypeCode}</td>
                    <td>{employee.email || employee.phone || "—"}</td>
                    <td>{employee.hireDate}</td>
                    <td>
                      {employee.status === "PENDING_APPROVAL" ? (
                        <button className="button primary" onClick={() => setEmployeeToApprove(employee)}>
                          <ShieldCheck size={15} />
                          Approve
                        </button>
                      ) : (
                        <span className="status-pill">{employee.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
