import { RealModulePage } from "../../../components/ui/RealModulePage";

export function StudentsPage() {
  return (
    <RealModulePage
      module="students"
      initialResource="student"
      title="Students"
      subtitle="Manage student profiles, guardians, enrolments and student records from the live Students API."
    />
  );
}
