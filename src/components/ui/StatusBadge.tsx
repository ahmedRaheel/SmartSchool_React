/**
 * StatusBadge — maps a status string to a coloured pill.
 * Replaces the repeated className={`status-pill ${status === "ACTIVE" ? "success" : ...}`} everywhere.
 *
 * Usage:
 *   <StatusBadge status={row.status} />
 *   <StatusBadge status="ACTIVE" map={{ ACTIVE:"success", INACTIVE:"gray" }} />
 */
const DEFAULT_MAP: Record<string, string> = {
  ACTIVE:      "success",
  APPROVED:    "success",
  COMPLETED:   "success",
  PAID:        "success",
  READY:       "success",
  OPEN:        "success",
  PUBLISHED:   "success",
  ACCEPTED:    "success",

  PENDING:     "warning",
  PROCESSING:  "warning",
  UPCOMING:    "warning",
  INDEXING:    "warning",
  SUBMITTED:   "warning",
  IN_REVIEW:   "warning",
  TRIAL:       "warning",

  INACTIVE:    "gray",
  DRAFT:       "gray",
  ARCHIVED:    "gray",
  CLOSED:      "gray",
  CANCELLED:   "gray",
  REJECTED:    "gray",
  SUSPENDED:   "danger",
  OVERDUE:     "danger",
  FAILED:      "danger",
  BLOCKED:     "danger",
  ERROR:       "danger",

  ON_LEAVE:    "info",
  WAITLIST:    "info",
  MAINTENANCE: "info",
  ONGOING:     "info",
};

interface Props {
  status:   string;
  /** Override specific statuses */
  map?:     Record<string, string>;
  /** Show the raw status string or a label */
  label?:   string;
}

export function StatusBadge({ status, map, label }: Props) {
  const merged = { ...DEFAULT_MAP, ...map };
  const variant = merged[status] ?? "gray";
  return (
    <span className={`status-pill ${variant}`}>
      {label ?? status}
    </span>
  );
}
