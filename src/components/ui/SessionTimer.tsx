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
 * Tab hitung-mundur sesi foto — "menempel" flush di tepi atas layar
 * (bukan pil melayang dengan bayangan) supaya jelas kebaca sebagai
 * bagian dari halaman, bukan elemen ngambang yang terpisah. Dipasang
 * di halaman pilih frame & kamera saja — bacanya dari `sessionDeadline`
 * di sessionStore supaya waktunya tetap konsisten walau pengguna
 * berpindah halaman. Kalau belum ada sesi aktif (`sessionDeadline`
 * null), tidak render apa-apa.
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
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center sm:justify-start sm:left-6">
      {/* Flush dengan tepi atas layar (top: 0, tanpa jarak & tanpa
          shadow) supaya kebaca sebagai tab yang nempel/menyatu dengan
          halaman — bukan kartu yang melayang terpisah. Warna solid +
          border bawah tipis dipakai buat kasih batas yang jelas,
          gantinya bayangan. */}
      <div
        className={`flex items-center gap-2 rounded-b-2xl border-b-2 border-x px-4 py-2 sm:px-5 sm:py-2.5 ${
          isLow
            ? "border-garnet-light/70 bg-garnet-gradient text-paper-light animate-pulse"
            : "border-paper-light/25 bg-maroon-gradient text-paper-light"
        }`}
      >
        <Timer size={16} strokeWidth={2.6} className="shrink-0" />
        <span className="font-display text-sm font-bold tabular-nums tracking-wide sm:text-base">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span className="font-body hidden text-xs text-paper-light/70 sm:inline">
          sisa waktu sesi
        </span>
      </div>
    </div>
  );
}
