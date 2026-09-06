# Feature Page Template

Copy `students/pages/StudentsPage.tsx` as the canonical starting point for any new data page.

## Standard Pattern

Every data page follows this exact structure:

```tsx
// 1. Field definitions at module level (single source of truth)
const VIEW_FIELDS = [...] as const;
const EDIT_FIELDS = [...];
const INITIAL_FORM = { field: "" };

export function MyPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  // 2. Data hooks
  const { data, isLoading } = useMyEntities();
  const createMy = useCreateMyEntity();
  const updMy    = useUpdateMyEntity();
  const delMy    = useDeleteMyEntity();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { setItems(toItems(data)); }, [data]);

  // 3. View/Edit (useCrud — replaces 8 lines of repeated state)
  const crud = useCrud(useMyEntityById);

  // 4. Search + pagination (useSearch — replaces 6+ lines)
  const { search, setSearch, page, setPage, paged, total } =
    useSearch(items, ["name", "code"]);

  // 5. Form (useFormState — replaces useState + error + reset)
  const { form, setField, reset, error, setError } = useFormState(INITIAL_FORM);

  return (
    <>
      <PageHeader title="My Entities" action={...} />

      <div className="surface">
        <div className="surface-head">
          <SearchBar value={search} onChange={setSearch} />
          <button className="primary" onClick={() => setOpen(true)}>+ Add</button>
        </div>

        <DataTable
          loading={isLoading}
          rows={paged}
          rowKey={r => r.id}
          columns={[{ key:"name", label:"Name" }, ...]}
          renderCell={(col, row) => col.key === "status"
            ? <StatusBadge status={row.status} />
            : row[col.key] ?? "—"}
          actions={row => (
            <RowActions
              onView={() => crud.openView(row.id)}
              onEdit={() => crud.openEdit(row.id)}
              onDelete={() => delMy.mutate(row.id)}
              deleteLabel="entity name"
            />
          )}
        />

        <Pagination page={page} pageSize={25} total={total} onPage={setPage} label="items" />
      </div>

      {/* Create modal */}
      {open && (
        <Modal open={open} title="Add entity" onClose={() => setOpen(false)}>
          {/* form fields */}
        </Modal>
      )}

      {/* View */}
      {crud.viewId && crud.item && (
        <ViewDrawer title="Entity" item={crud.item} fields={VIEW_FIELDS as any}
          onClose={crud.closeView} onEdit={crud.viewToEdit} />
      )}

      {/* Edit */}
      {crud.editId && crud.item && (
        <EditModal title="Entity" item={crud.item} fields={EDIT_FIELDS}
          onClose={crud.closeEdit}
          onSave={async data => {
            await updMy.mutateAsync({ id: crud.editId!, body: data });
            crud.closeEdit();
          }}
        />
      )}
    </>
  );
}
```

## Import convention

```tsx
// UI components — single import from barrel
import { DataTable, RowActions, ViewDrawer, EditModal, Pagination,
         SearchBar, StatusBadge, PageHeader, StatCard } from "../../../components/ui";

// Core hooks — single import from barrel
import { useCrud, useSearch, useFormState } from "../../../core/hooks";

// Utilities
import { toItems, fmtDate } from "../../../core/utils";
```

## Naming conventions

| What              | Convention           | Example                      |
|-------------------|----------------------|------------------------------|
| Page component    | `PascalCasePage`     | `StudentsPage`               |
| View fields const | `VIEW_FIELDS`        | top of file, `as const`      |
| Edit fields const | `EDIT_FIELDS`        | top of file                  |
| Form initial      | `INITIAL_FORM`       | top of file                  |
| Query key strings | kebab-case           | `"students"`, `"hr-leaves"`  |
| Delete mutation   | `del{Entity}.mutate` | `delStudent.mutate(id)`      |
| Update mutation   | `upd{Entity}.mutateAsync` | `updStudent.mutateAsync(...)` |
