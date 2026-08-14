"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer automatically whenever the route changes
  // (e.g. after tapping a nav link) so it never lingers open.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-paper">
      {/* Same fine paper-grain + linen weave used on the landing/login
          pages, layered under the whole admin shell so it reads as
          the same product rather than a bare dashboard template. */}
      <div className="cream-texture" />

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white/40 px-4 py-3.5 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clay-sm bg-white/70 text-ink shadow-clay-sm hover:shadow-clay lg:hidden"
            >
              <Menu size={19} strokeWidth={2.2} />
            </button>
            <p className="truncate font-body text-sm text-muted">
              {TITLES[pathname] ?? "Admin"}
            </p>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}