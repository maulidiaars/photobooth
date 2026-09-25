"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";

interface SessionTimerProps {
  /** Dipanggil TEPAT SEKALI ketika hitungan mundur mencapai 0.
   *  Dipakai tiap halaman untuk memutuskan aksi otomatisnya sendiri
   *  (mis. di halaman kamera: simpan foto yang ada & pindah ke hasil). */
  onExpire?: () => void;
  /** "fixed" (default) — nempel di pojok viewport, dipakai di halaman
   *  kamera. "inline" — dirender sebagai elemen biasa di alur halaman
   *  supaya bisa ditaruh di mana saja (mis. di sebelah judul) dan ikut
   *  scroll bareng konten — dipakai di halaman pilih frame. */
  variant?: "fixed" | "inline";
}

/**
 * Kotak hitung-mundur sesi foto — sengaja ditaruh sebagai kotak yang
 * jelas dan rapi di pojok kiri atas layar (bukan pil melayang di
 * tengah), dengan sedikit jarak dari tepi supaya kebaca sebagai kotak
 * tersendiri. Efek "timbul"-nya didapat lewat garis bevel tajam
 * (highlight terang di atas, garis gelap di bawah) — bukan box-shadow
 * blur — jadi tetap terlihat tegas & bersih, tanpa bayangan yang
 * mengambang. Dipasang di halaman pilih frame & kamera saja — bacanya
 * dari `sessionDeadline` di sessionStore supaya waktunya tetap
 * konsisten walau pengguna berpindah halaman. Kalau belum ada sesi
 * aktif (`sessionDeadline` null), tidak render apa-apa.
 */
export function SessionTimer({ onExpire, variant = "fixed" }: SessionTimerProps) {
  const deadline = useSessionStore((s) => s.sessionDeadline);
  const [remainingMs, setRemainingMs] = useState<number | null>(
    deadline !== null ? deadline - Date.now() : null
  );
  // Supaya onExpire cuma terpanggil sekali per deadline, biarpun
  // interval-nya masih terus tick tiap detik setelah waktu habis.
  const firedRef = useRef(false);

  useEffect(() => {
    if (deadline === null) {
      setRemainingMs(null);
      return;
    }

    firedRef.current = false;

    const tick = () => {
      const left = deadline - Date.now();
      setRemainingMs(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  if (deadline === null || remainingMs === null) return null;

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 30;

  const chip = (
    <div
      className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 sm:gap-2.5 sm:px-5 sm:py-3 ${
        isLow
          ? "border-garnet-dark bg-garnet-gradient text-paper-light animate-pulse"
          : "border-maroon-dark bg-maroon-gradient text-paper-light"
      }`}
      style={{
        // Bevel tegas (bukan blur) untuk kesan "timbul" yang bersih —
        // garis terang tipis di tepi atas, garis gelap tipis di tepi
        // bawah, tanpa penyebaran/soft shadow sama sekali.
        boxShadow:
          "inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.3)",
      }}
    >
      <Timer size={16} strokeWidth={2.6} className="shrink-0" />
      <span className="font-display text-sm font-bold tabular-nums tracking-wide sm:text-base">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
      <span className="font-body hidden text-xs text-paper-light/70 sm:inline">
        sisa waktu sesi
      </span>
    </div>
  );

  if (variant === "inline") {
    return <div className="shrink-0">{chip}</div>;
  }

  return <div className="fixed left-4 top-4 z-50 sm:left-6 sm:top-6">{chip}</div>;
}
