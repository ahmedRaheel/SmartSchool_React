/**
 * useSearch — search + pagination state in one hook.
 *
 * Usage:
 *   const { search, setSearch, page, setPage, paged, total } = useSearch(items, ['firstName','lastName']);
 */
import { useState, useMemo } from "react";

export function useSearch<T extends Record<string, any>>(
  items: T[],
  searchKeys: (keyof T)[],
  pageSize = 25,
) {
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      searchKeys.some(key => String(item[key] ?? "").toLowerCase().includes(q))
    );
  }, [items, search, searchKeys]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  // Reset to page 1 when search changes
  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  return {
    search,
    setSearch: handleSearch,
    page,
    setPage,
    pageSize,
    paged,
    total:    filtered.length,
    filtered,
  };
}
