import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user, userAttributes } = useAuth();

  const sidebarUser = {
    username: userAttributes['email'] ?? user?.username ?? 'Admin',
    role: userAttributes['custom:role'] ?? 'Administrator',
    contributedSince: userAttributes['custom:contributedSince'] ?? '-',
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-cream">
      <AdminSidebar user={sidebarUser} />
      <main className="flex-1 overflow-y-auto admin-main">
        <Outlet />
      </main>
    </div>
  );
}
