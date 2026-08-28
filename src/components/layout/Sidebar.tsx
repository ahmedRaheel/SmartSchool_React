import { GraduationCap, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/auth";
import { hasAnyRole, navigationSections } from "./navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const userRoles = user?.roles?.length ? user.roles : [user?.role ?? ""];
  const isSuperAdmin = userRoles.includes("SuperAdmin");

  const visibleSections = navigationSections
    .filter((section) => hasAnyRole(section.roles, userRoles))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAnyRole(item.roles, userRoles)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <header className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">
              <GraduationCap size={22} />
            </span>
            <span>
              Smart<b>School</b>
            </span>
          </div>

          <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="school-chip">
          <span>{user?.initials ?? "SS"}</span>
          <div>
            <b>{user?.name ?? "SmartSchool"}</b>
            <small>{isSuperAdmin ? "Platform master workspace" : `${user?.role ?? "User"} workspace`}</small>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {visibleSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-label">{section.title}</div>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={onClose}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <i className="nav-count">{item.badge}</i>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <footer className="sb-footer"><div className="sb-status"><i /> System online</div></footer>
      </aside>
    </>
  );
}
