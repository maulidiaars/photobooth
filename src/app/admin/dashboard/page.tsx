"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Images,
  Camera,
  Clock3,
  CheckCircle2,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { PhotoLightbox } from "@/components/admin/PhotoLightbox";
import { ClayCard } from "@/components/ui/ClayCard";
import { getDashboardStats, getPhotos, updatePhotoStatus, deletePhoto } from "@/services/photoService";
import { useToast } from "@/components/ui/Toast";
import type { DashboardStats, Photo, PhotoStatus } from "@/types/photo";

const POLL_MS = 6000;
const PAGE_SIZE = 16;

const FILTERS: { label: string; value: PhotoStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Printed", value: "printed" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PhotoStatus | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [active, setActive] = useState<Photo | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const toast = useToast();

  // Silent background refresh (no spinner, no full-page flicker) so
  // new sessions / status changes show up on their own — this is the
  // "otomatis, gausah refresh" behaviour. True push/websocket would
  // need a backend message broker we don't have here, so this polls
  // frequently instead, which reads as real-time in practice.
  const refresh = (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    Promise.all([getDashboardStats(), getPhotos()])
      .then(([s, p]) => {
        if (opts.silent && knownIds.current.size > 0) {
          const freshIds = new Set(p.map((x) => x.id));
          const newOnes = p.filter((x) => !knownIds.current.has(x.id));
          if (newOnes.length > 0) {
            toast.push(
              newOnes.length === 1 ? "Sesi foto baru masuk" : `${newOnes.length} sesi foto baru masuk`,
              "info"
            );
          }
          knownIds.current = freshIds;
        } else {
          knownIds.current = new Set(p.map((x) => x.id));
        }
        setStats(s);
        setPhotos(p);
      })
      .catch(() => {
        if (!opts.silent) toast.push("Gagal memuat data dashboard", "error");
      })
      .finally(() => {
        if (!opts.silent) setLoading(false);
      });
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh({ silent: true }), POLL_MS);
    const onFocus = () => refresh({ silent: true });
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPhotos = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.status === filter)),
    [photos, filter]
  );
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);

  const frameBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    photos.forEach((p) => {
      const key = p.frame_nama ?? "Tanpa nama";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const max = Math.max(1, ...counts.values());
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
  }, [photos]);

  const handleMarkPrinted = async (photo: Photo) => {
    try {
      await updatePhotoStatus(photo.id, "printed");
      toast.push("Foto ditandai sudah dicetak", "success");
      refresh({ silent: true });
    } catch {
      toast.push("Gagal memperbarui status", "error");
    }
  };

  const handleDelete = async (photo: Photo) => {
    try {
      await deletePhoto(photo.id);
      toast.push("Foto berhasil dihapus", "success");
      refresh({ silent: true });
    } catch {
      toast.push("Gagal menghapus foto", "error");
    }
  };

  const handlePrint = (photo: Photo) => {
    const win = window.open(photo.image_result, "_blank");
    win?.addEventListener("load", () => win.print());
  };

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="font-body text-sm text-muted mt-0.5">
          Ringkasan aktivitas photobooth, sinkron otomatis tanpa perlu refresh.
        </p>
      </motion.div>

      {loading && <p className="text-muted font-body">Memuat statistik...</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatsCard label="Total Frame" value={stats.totalFrames} icon={Images} bg="purple" />
          <StatsCard label="Total Foto" value={stats.totalPhotos} icon={Camera} bg="pink" />
          <StatsCard label="Pending Print" value={stats.pendingPrint} icon={Clock3} bg="yellow" />
          <StatsCard label="Sudah Dicetak" value={stats.printed} icon={CheckCircle2} bg="forest" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px] items-start">
          {/* Kolom kiri — semua foto, dengan filter + klik untuk lihat &
              kelola. Ini menggantikan halaman "Kelola Foto" terpisah. */}
          <ClayCard bg="cream" className="!p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold text-ink">Semua Foto</h2>
              <div className="flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`rounded-clay-sm px-3.5 py-1.5 font-body text-xs font-semibold shadow-clay-sm transition-shadow ${
                      filter === f.value ? "bg-garnet-gradient text-paper-light" : "bg-white/70 text-ink/70 hover:shadow-clay"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredPhotos.length === 0 ? (
              <p className="py-10 text-center font-body text-sm text-muted">Belum ada foto di kategori ini.</p>
            ) : (
              <>
                {/* A real grid built to stay smooth with thousands of
                    rows: only `visibleCount` items are ever mounted,
                    "Muat lebih banyak" pages in more client-side. */}
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                  {visiblePhotos.map((photo) => (
                    <motion.button
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setActive(photo)}
                      className="group relative"
                    >
                      {/* Pure frame artwork — no white card behind it, the
                          transparent PNG is the whole thumbnail — sized
                          up so the grid doesn't read as a wall of tiny
                          tiles. */}
                      <div className="relative aspect-[3/4] w-full drop-shadow-[0_8px_18px_rgba(58,40,31,0.2)] transition-transform group-hover:scale-[1.04]">
                        <Image
                          src={photo.image_result}
                          alt=""
                          fill
                          sizes="220px"
                          className="object-contain"
                        />
                      </div>
                      <span
                        className={`absolute right-0 top-0 rounded-full px-2 py-0.5 font-body text-[9px] font-semibold shadow-clay-sm ${
                          photo.status === "printed" ? "bg-forest text-paper-light" : "bg-clay-yellowDark/90 text-ink"
                        }`}
                      >
                        {photo.status === "printed" ? "Printed" : "Pending"}
                      </span>
                      <span className="mt-1 block truncate text-center font-body text-[10px] text-muted">
                        {formatTime(photo.created_at)}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {visibleCount < filteredPhotos.length && (
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="mx-auto mt-5 flex items-center gap-1.5 rounded-clay-sm bg-white/70 px-5 py-2.5 font-body text-sm font-medium text-ink shadow-clay-sm hover:shadow-clay"
                  >
                    Muat lebih banyak ({filteredPhotos.length - visibleCount} lagi)
                    <ChevronDown size={15} strokeWidth={2.3} />
                  </button>
                )}
              </>
            )}
          </ClayCard>

          {/* Kolom kanan — breakdown ringkas, biar tidak jadi ruang kosong */}
          <div className="flex flex-col gap-6">
            <ClayCard bg="purple" className="!p-5">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 size={18} className="text-ink" strokeWidth={2.2} />
                <h2 className="font-heading text-base font-semibold text-ink">Frame Terpopuler</h2>
              </div>
              {frameBreakdown.length === 0 ? (
                <p className="font-body text-xs text-ink/60">Belum ada data.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {frameBreakdown.map((f) => (
                    <div key={f.name}>
                      <div className="mb-1 flex items-center justify-between font-body text-xs text-ink/80">
                        <span className="truncate">{f.name}</span>
                        <span className="shrink-0 font-semibold">{f.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/50 shadow-clay-inset">
                        <div className="h-full rounded-full bg-garnet-gradient" style={{ width: `${f.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ClayCard>

            <ClayCard bg="yellow" className="!p-5">
              <h2 className="mb-2 font-heading text-base font-semibold text-ink">Perlu Ditindaklanjuti</h2>
              {(stats?.pendingPrint ?? 0) === 0 && (stats?.newEntries ?? 0) === 0 ? (
                <p className="font-body text-sm text-ink/75">Semua sudah beres — tidak ada yang menunggu.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 font-body text-sm text-ink/80">
                  {(stats?.pendingPrint ?? 0) > 0 && (
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-clay-yellowDark" />
                      <strong>{stats?.pendingPrint}</strong>&nbsp;foto masih menunggu dicetak
                    </li>
                  )}
                  {(stats?.newEntries ?? 0) > 0 && (
                    <li className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-garnet" />
                      <strong>{stats?.newEntries}</strong>&nbsp;sesi belum kamu lihat di notifikasi
                    </li>
                  )}
                </ul>
              )}
            </ClayCard>
          </div>
        </div>
      )}

      <PhotoLightbox
        photo={active}
        onClose={() => setActive(null)}
        onMarkPrinted={handleMarkPrinted}
        onDelete={handleDelete}
        onPrint={handlePrint}
      />
    </div>
  );
}
