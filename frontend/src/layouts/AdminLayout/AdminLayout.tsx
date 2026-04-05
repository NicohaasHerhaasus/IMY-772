import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";
import "./AdminLayout.css";

// Hardcoded mock user — replace with your auth context later
const MOCK_USER = {
  username: "Username",
  role: "Authorisation",
  contributedSince: "03/02/2026",
};

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar user={MOCK_USER} />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}