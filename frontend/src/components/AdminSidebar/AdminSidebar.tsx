import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  user: {
    username: string;
    role: string;
    contributedSince: string;
    avatarUrl?: string;
  };
}

const NAV_ITEMS = [
  { label: "Upload Datafiles", path: "/admin/upload" },
  { label: "Export Datafiles", path: "/admin/export" },
  { label: "Manage Datafiles", path: "/admin/manage" },
  { label: "AMR Assistant", path: "/admin/chatbot" },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      {/* User Info */}
      <div className="admin-sidebar__section-label">USER INFO</div>
      <div className="admin-sidebar__user-card">
        <div className="admin-sidebar__avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} />
          ) : (
            <div className="admin-sidebar__avatar-placeholder" />
          )}
        </div>
        <div className="admin-sidebar__username">{user.username}</div>
        <div className="admin-sidebar__role">{user.role}</div>
        <div className="admin-sidebar__contributed">
          <span>Contributed since:</span>
          <span>{user.contributedSince}</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="admin-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `admin-sidebar__nav-link ${isActive ? "admin-sidebar__nav-link--active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
