"use client";

import { useState, type ReactNode } from "react";

interface LogoProps {
  size: number;
  /** Ditampilkan selama /logo.png belum ada / gagal dimuat. */
  fallback: ReactNode;
  className?: string;
}

/**
 * ============================================
 * 🔥 CARA PASANG LOGO WEBSITE
 * ============================================
 * Taruh file logo dari temanmu di:
 *
 *     public/logo.png
 *
 * (kotak/persegi lebih aman, PNG background transparan disarankan).
 * Begitu file itu ada, logo langsung otomatis kepakai gantiin ikon
 * placeholder di sidebar admin & halaman login admin — TANPA perlu
 * ubah kode apa pun lagi.
 *
 * Kalau mau logo itu juga muncul gede di landing page (halaman utama
 * tempat tamu foto), itu bagian terpisah di src/app/page.tsx (judul
 * besar "{APP_NAME}") karena sengaja pakai teks bergaya tulisan tangan,
 * bukan gambar — kasih tau aku kalau itu juga mau diganti jadi logo.
 */
export function Logo({ size, fallback, className = "" }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Logo"
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
