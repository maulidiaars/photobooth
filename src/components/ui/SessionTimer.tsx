"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";

interface SessionTimerProps {
  /** Dipanggil TEPAT SEKALI ketika hitungan mundur mencapai 0.
   *  Dipakai tiap halaman untuk memutuskan aksi otomatisnya sendiri
   *  (mis. di halaman kamera: simpan foto yang ada & pindah ke hasil). */
  onExpire?: () => void;
}

/**
 * Badge hitung-mundur sesi foto, nempel di pojok kiri atas. Dipasang di
 * setiap halaman sesi (pilih frame, kamera, hasil) — bacanya dari
 * `sessionDeadline` di sessionStore supaya waktunya tetap konsisten
 * walau pengguna berpindah halaman. Kalau belum ada sesi aktif
 * (`sessionDeadline` null), tidak render apa-apa.
 */
export function SessionTimer({ onExpire }: SessionTimerProps) {
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

  return (
    <div
      className={`fixed left-3 top-3 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-clay backdrop-blur-sm sm:left-5 sm:top-5 ${
        isLow ? "bg-garnet text-paper-light animate-pulse" : "bg-cream-light/90 text-ink"
      }`}
    >
      <Timer size={14} strokeWidth={2.4} className="shrink-0" />
      <span className="font-display text-sm font-bold tabular-nums tracking-wide">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
