import { createContext, type ReactNode, useContext, useEffect, useMemo, useState, } from "react";
export type UserRole = "Administrator" | "Teacher" | "Parent" | "Student";
export interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    school: string;
    initials: string;
}
interface AuthContextValue {
    user: SessionUser | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}
const storageKey = "smartschool.mock.session";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const demoUser: SessionUser = {
    id: "usr-admin-001",
    name: "Ayesha Rahman",
    email: "admin@smartschool.demo",
    role: "Administrator",
    school: "SmartSchool Academy",
    initials: "AR",
};
export function AuthProvider({ children }: {
    children: ReactNode;
}) {
    const [user, setUser] = useState<SessionUser | null>(() => {
        const value = localStorage.getItem(storageKey);
        return value ? (JSON.parse(value) as SessionUser) : null;
    });
    useEffect(() => {
        if (user) {
            localStorage.setItem(storageKey, JSON.stringify(user));
        }
        else {
            localStorage.removeItem(storageKey);
        }
    }, [user]);
    async function login(email: string, password: string) {
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        if (!email.trim() || !password.trim())
            return false;
        setUser({ ...demoUser, email: email.trim() });
        return true;
    }
    const value = useMemo(() => ({ user, login, logout: () => setUser(null) }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error("useAuth must be used inside AuthProvider.");
    return context;
}

