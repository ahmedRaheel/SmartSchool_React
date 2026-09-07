/**
 * useCrud — eliminates the repeated view/edit state + getById pattern
 * from every page. One call replaces ~8 lines in each page.
 *
 * Usage:
 *   const crud = useCrud(useStudentById);
 *   onView={() => crud.openView(s.id)}
 *   onEdit={() => crud.openEdit(s.id)}
 *   {crud.viewId && crud.item && <ViewDrawer item={crud.item} onClose={crud.closeView} />}
 *   {crud.editId && crud.item && <EditModal  item={crud.item} onClose={crud.closeEdit} />}
 */
import { useState } from "react";
import { useQuery }  from "@tanstack/react-query";

type ByIdHook = (id?: string) => { data: any; isLoading: boolean };

export function useCrud(useById: ByIdHook) {
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const activeId = viewId ?? editId ?? undefined;
  const { data, isLoading } = useById(activeId);
  const item: any = data ?? null;

  return {
    viewId,
    editId,
    item,
    isLoading,
    openView:  (id: string) => { setViewId(id); setEditId(null); },
    openEdit:  (id: string) => { setEditId(id); setViewId(null); },
    closeView: () => setViewId(null),
    closeEdit: () => setEditId(null),
    /** Switch from view to edit (called from ViewDrawer onEdit) */
    viewToEdit: () => { if (viewId) { setEditId(viewId); setViewId(null); } },
  };
}
