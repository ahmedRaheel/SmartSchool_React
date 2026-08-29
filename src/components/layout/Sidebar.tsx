import { Bot, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/auth";
import { navigationForRoles } from "./navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Role-adaptive sidebar with 9-actor navigation support. */
export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const userRoles = user?.roles?.length ? user.roles : [user?.role ?? ""];
  const sections  = navigationForRoles(userRoles);

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
        {/* Brand */}
        <header className="sidebar-head">
          <div className="brand">
            <span className="brand-mark"><Bot size={18} /></span>
            <span>Smart<b>School</b></span>
          </div>
          <button
            className="sidebar-close icon-button"
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            style={{ border: 0, background: "transparent", color: "rgba(255,255,255,.55)" }}
          >
            <X size={18} />
          </button>
        </header>

        {/* School / user chip */}
        <div className="school-chip">
          <span>{user?.initials ?? "SS"}</span>
          <div>
            <b>{user?.name ?? "SmartSchool"}</b>
            <small>{user?.role ?? "User"} workspace</small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav" aria-label="Main navigation">
          {sections.map(section => (
            <div className="nav-section" key={section.title}>
              <div className="nav-label">{section.title}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    end={item.end ?? false}
                    onClick={onClose}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                    {item.badge && <i className="nav-count">{item.badge}</i>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <footer className="sb-footer">
          <div className="sb-status"><i />System online · SmartSchool v10</div>
        </footer>
      </aside>
    </>
  );
}
