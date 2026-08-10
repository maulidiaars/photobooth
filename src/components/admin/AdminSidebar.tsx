"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Image as ImageIcon, LogOut, Circle } from "lucide-react";
import { ROUTES } from "@/lib/constants";

// "Foto" was its own menu before — now every photo action (lihat,
// kirim WA, tandai dicetak, hapus) lives directly in the Dashboard's
// photo grid, so there's one less place to look.
const NAV_ITEMS = [
  { href: ROUTES.adminDashboard, label: "Dashboard", Icon: LayoutDashboard },
  { href: ROUTES.adminFrames, label: "Frame", Icon: ImageIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push(ROUTES.adminLogin);
  };

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col gap-1.5 bg-clay-gradient p-5 shadow-clay">
      <div className="mb-6 flex items-center gap-2.5 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-clay-sm bg-garnet-gradient shadow-clay-sm">
          <Circle size={16} className="fill-paper-light text-paper-light" strokeWidth={0} />
        </div>
        <h2 className="font-heading text-lg font-semibold text-ink leading-tight">
          Admin Panel
        </h2>
      </div>

      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-clay-sm px-4 py-3 font-body font-medium transition-shadow",
              active
                ? "bg-pink-gradient shadow-clay-inset text-ink"
                : "text-ink/70 hover:shadow-clay-sm"
            )}
          >
            <Icon size={18} strokeWidth={2.2} />
            {label}
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 rounded-clay-sm px-4 py-3 font-body font-medium text-clay-pinkDark hover:shadow-clay-sm text-left"
      >
        <LogOut size={18} strokeWidth={2.2} />
        Keluar
      </button>
    </aside>
  );
}
