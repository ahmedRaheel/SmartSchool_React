import { useEffect, useMemo, useState } from "react";
import { Campus, organizationApi, School } from "../../features/organization/api/organizationApi";

interface Props {
  tenantId: string;
  schoolId: string;
  branchId: string;
  onSchoolChange: (schoolId: string) => void;
  onBranchChange: (branchId: string) => void;
}

/** API-backed school/branch selector. GUID values stay internal; users see business codes and names. */
export function SchoolBranchSelector({ tenantId, schoolId, branchId, onSchoolChange, onBranchChange }: Props) {
  const [schools, setSchools] = useState<School[]>([]);
  const [branches, setBranches] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([organizationApi.getSchools(tenantId), organizationApi.getCampuses(tenantId)])
      .then(([schoolRows, branchRows]) => { if (active) { setSchools(schoolRows); setBranches(branchRows); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tenantId]);

  const availableBranches = useMemo(() => branches.filter(item => item.schoolId === schoolId), [branches, schoolId]);

  return <>
    <label className="field"><span>School *</span><select required value={schoolId} disabled={loading} onChange={event => { onSchoolChange(event.target.value); onBranchChange(""); }}><option value="">{loading ? "Loading schools…" : "Select school"}</option>{schools.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>
    <label className="field"><span>Branch *</span><select required value={branchId} disabled={!schoolId || loading} onChange={event => onBranchChange(event.target.value)}><option value="">Select branch</option>{availableBranches.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>
  </>;
}
