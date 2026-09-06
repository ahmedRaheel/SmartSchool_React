/**
 * Shared data helpers — import from here instead of redeclaring in every file.
 */

/** Safely parse a JSON metadata string — returns {} on failure */
export const parseMeta = (j?: string | null): Record<string, any> => {
  try { return JSON.parse(j ?? "{}"); } catch { return {}; }
};

/** Extract items array from a paged API response or a plain array */
export const toItems = <T = any>(data: unknown): T[] => {
  if (!data) return [];
  const d = data as any;
  return (d?.items ?? (Array.isArray(d) ? d : [])) as T[];
};

/** Format a date string for display */
export const fmtDate = (d?: string | null): string => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-PK", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

/** Truncate a string with ellipsis */
export const truncate = (s: string, max = 60): string =>
  s.length <= max ? s : s.slice(0, max - 1) + "…";
