const MAP: Record<string, string> = {
  ACTIVE:"success",APPROVED:"success",COMPLETED:"success",PAID:"success",READY:"success",
  OPEN:"success",PUBLISHED:"success",ACCEPTED:"success",ADMISSION_ACCEPTED:"success",
  COMPLIANT:"success",CURRENT:"success",ENROLLED:"success",
  PENDING:"warning",PROCESSING:"warning",UPCOMING:"warning",INDEXING:"warning",
  SUBMITTED:"warning",IN_REVIEW:"warning",TRIAL:"warning",WAITLIST:"waitlist",
  WAITING_LIST:"waitlist",ON_LEAVE:"info",MAINTENANCE:"info",IN_PROGRESS:"info",
  INACTIVE:"gray",DRAFT:"gray",ARCHIVED:"gray",CLOSED:"gray",CANCELLED:"gray",
  REJECTED:"danger",SUSPENDED:"danger",OVERDUE:"danger",FAILED:"danger",
  BLOCKED:"danger",ERROR:"danger",ADMISSION_REJECTED:"danger",TERMINATED:"danger",
};

interface Props {
  status: string;
  map?:   Record<string,string>;
  label?: string;
}

export function StatusBadge({ status, map, label }: Props) {
  const merged  = map ? { ...MAP, ...map } : MAP;
  const variant = merged[status] ?? "gray";
  const display = label ?? status.replace(/_/g," ");
  return <span className={`status-pill ${variant}`}>{display}</span>;
}
