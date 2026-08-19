"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Image as ImageIcon, LogOut, Circle, ChevronLeft, Menu } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useState, useEffect } from "react";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { href: ROUTES.adminDashboard, label: "Dashboard", Icon: LayoutDashboard },
  { href: ROUTES.adminFrames, label: "Frame", Icon: ImageIcon },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push(ROUTES.adminLogin);
  };

  const content = (
    <>
      {/* 🎨 BRAND HEADER — MAROON & CREAM THEME */}
      <div className="relative z-10 mb-8 flex items-center gap-3 px-1 pt-2">
        <Logo
          size={40}
          className="rounded-full"
          fallback={
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6B2D2C] shadow-md">
              <Circle size={18} className="fill-[#F5EBE0] text-[#F5EBE0]" strokeWidth={0} />
            </div>
          }
        />
        <div className="min-w-0">
          <h2 className="truncate font-serif text-xl font-bold leading-tight text-[#4A1A1A] tracking-wide">
            {APP_NAME}
          </h2>
          <p className="font-serif text-sm italic text-[#8B5A4B] tracking-wider">
            panel admin
          </p>
        </div>
      </div>

      {/* ✨ DECORATIVE LINE */}
      <div className="relative z-10 mb-6 h-px w-full bg-gradient-to-r from-[#6B2D2C]/20 via-[#8B5A4B]/40 to-[#6B2D2C]/20" />

      {/* 🧭 NAVIGATION */}
      <nav className="relative z-10 flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={clsx(
                "group flex items-center gap-4 rounded-xl px-4 py-3.5 font-serif font-medium transition-all duration-200 ease-in-out",
                active
                  ? "bg-[#6B2D2C] text-[#F5EBE0] shadow-lg shadow-[#6B2D2C]/20"
                  : "text-[#4A1A1A]/70 hover:bg-[#F5EBE0] hover:text-[#4A1A1A] hover:shadow-md hover:shadow-[#6B2D2C]/10"
              )}
            >
              <Icon 
                size={20} 
                strokeWidth={2} 
                className={clsx(
                  "transition-transform duration-200 group-hover:scale-105",
                  active ? "text-[#F5EBE0]" : "text-[#6B2D2C]"
                )} 
              />
              <span className="text-[15px] tracking-wide">{label}</span>
              {active && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto h-2 w-2 rounded-full bg-[#F5EBE0]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 🚪 LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="relative z-10 mt-auto flex items-center gap-4 rounded-xl px-4 py-3.5 text-left font-serif font-medium text-[#6B2D2C] transition-all duration-200 hover:bg-[#6B2D2C]/10 hover:shadow-md"
      >
        <LogOut size={20} strokeWidth={2} className="text-[#6B2D2C]" />
        <span className="text-[15px] tracking-wide">Keluar</span>
      </button>

      {/* 🎯 BOTTOM DECORATION */}
      <div className="relative z-10 mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#8B5A4B]/20 to-transparent" />
      <p className="relative z-10 mt-3 text-center font-serif text-[10px] italic text-[#8B5A4B]/50 tracking-wider">
        © {new Date().getFullYear()} — all rights reserved
      </p>
    </>
  );

  return (
    <>
      {/* 🖥️ DESKTOP SIDEBAR */}
      <aside className="relative hidden h-screen w-64 shrink-0 flex-col bg-[#FBF7F2] px-5 py-6 shadow-2xl shadow-[#6B2D2C]/10 lg:flex">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        {content}
      </aside>

      {/* 📱 MOBILE DRAWER */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-[#4A1A1A]/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-[#FBF7F2] px-6 py-6 shadow-2xl shadow-[#4A1A1A]/30 lg:hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full p-2 text-[#6B2D2C] transition-colors hover:bg-[#6B2D2C]/10"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}