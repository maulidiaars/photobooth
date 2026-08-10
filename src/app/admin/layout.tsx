"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ROUTES } from "@/lib/constants";

const TITLES: Record<string, string> = {
  [ROUTES.adminDashboard]: "Dashboard",
  [ROUTES.adminFrames]: "Kelola Frame",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === ROUTES.adminLogin;

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cream">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink/10 bg-white/40 px-6 py-3.5 backdrop-blur-sm">
          <p className="font-body text-sm text-muted">
            {TITLES[pathname] ?? "Admin"}
          </p>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
