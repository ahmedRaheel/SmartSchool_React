/**
 * UI component barrel — import all reusable components from here.
 * Keeps feature pages free of long relative paths.
 *
 * Usage: import { DataTable, RowActions, Pagination, ... } from "@/components/ui";
 * (or with relative path: from "../../../components/ui")
 */
export { DataTable }       from "./DataTable";
export type { Column }     from "./DataTable";
export { EditModal }       from "./EditModal";
export type { EditField }  from "./EditModal";
export { ViewDrawer }      from "./ViewDrawer";
export type { DrawerField} from "./ViewDrawer";
export { RowActions }      from "./RowActions";
export { Pagination }      from "./Pagination";
export { PageHeader }      from "./PageHeader";
export { StatCard }        from "./StatCard";
export { SearchBar }       from "./SearchBar";
export { StatusBadge }     from "./StatusBadge";
export { Modal }           from "./Modal";
export { DocumentUploader} from "./DocumentUploader";
