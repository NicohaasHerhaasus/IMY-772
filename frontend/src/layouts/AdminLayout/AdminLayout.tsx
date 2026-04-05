import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar/AdminSidebar";

// Hardcoded mock user — replace with your auth context later
const MOCK_USER = {
  username: "Username",
  role: "Authorisation",
  contributedSince: "03/02/2026",
};

export default function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-cream">
      <AdminSidebar user={MOCK_USER} />
      <main className="flex-1 px-14 py-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
