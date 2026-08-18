import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { modules, type ModuleRecord } from "./moduleData";
type Store = Record<string, ModuleRecord[]>;
type Context = {
    getRecords: (key: string) => ModuleRecord[];
    createRecord: (key: string, r: ModuleRecord) => void;
    updateRecord: (key: string, r: ModuleRecord) => void;
    deleteRecord: (key: string, id: string) => void;
};
const C = createContext<Context | undefined>(undefined);
export function MockDataProvider({ children }: {
    children: ReactNode;
}) {
    const [store, setStore] = useState<Store>(() => Object.fromEntries(Object.entries(modules).map(([k, m]) => [k, m.records.map(r => ({ ...r }))])));
    const value = useMemo<Context>(() => ({
        getRecords: key => store[key] ?? [],
        createRecord: (key, r) => setStore(s => ({ ...s, [key]: [r, ...(s[key] ?? [])] })),
        updateRecord: (key, r) => setStore(s => ({ ...s, [key]: (s[key] ?? []).map(x => x.id === r.id ? r : x) })),
        deleteRecord: (key, id) => setStore(s => ({ ...s, [key]: (s[key] ?? []).filter(x => x.id !== id) }))
    }), [store]);
    return <C.Provider value={value}>{children}</C.Provider>;
}
export function useMockData() { const c = useContext(C); if (!c)
    throw new Error("MockDataProvider required"); return c; }

