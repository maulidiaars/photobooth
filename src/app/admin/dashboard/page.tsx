"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Images,
  Camera,
  Clock3,
  CheckCircle2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { PhotoLightbox } from "@/components/admin/PhotoLightbox";
import {
  getDashboardStats,
  getPhotos,
  updatePhotoStatus,
  deletePhoto,
  markPhotoNotified,
} from "@/services/photoService";
import { useToast } from "@/components/ui/Toast";
import type { DashboardStats, Photo, PhotoStatus } from "@/types/photo";

const POLL_MS = 6000;
const PAGE_SIZE = 12;

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

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const photoIdParam = searchParams.get("photo");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PhotoStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const knownIds = useRef<Set<string>>(new Set());
  const toast = useToast();

  const refresh = (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) {
      setLoading(true);
    }

    Promise.all([getDashboardStats(), getPhotos()])
      .then(([s, p]) => {
        const sorted = p.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        if (opts.silent && knownIds.current.size > 0) {
          const freshIds = new Set(sorted.map((x) => x.id));

          const newOnes = sorted.filter(
            (x) => !knownIds.current.has(x.id)
          );

          if (newOnes.length > 0) {
            toast.push(
              newOnes.length === 1
                ? "Sesi foto baru masuk"
                : `${newOnes.length} sesi foto baru masuk`,
              "info"
            );
          }

          knownIds.current = freshIds;
        } else {
          knownIds.current = new Set(sorted.map((x) => x.id));
        }

        setStats(s);
        setPhotos(sorted);
      })
      .catch(() => {
        if (!opts.silent) {
          toast.push("Gagal memuat data dashboard", "error");
        }
      })
      .finally(() => {
        if (!opts.silent) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    refresh();

    const interval = setInterval(
      () => refresh({ silent: true }),
      POLL_MS
    );

    const onFocus = () => refresh({ silent: true });

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  // Handle query param untuk buka lightbox dari notifikasi
  useEffect(() => {
    if (photoIdParam && photos.length > 0) {
      const idx = photos.findIndex((p) => p.id === photoIdParam);

      if (idx !== -1) {
        const photo = photos[idx];

        if (photo) {
          setActivePhoto(photo);
          setActiveIndex(idx);

          // Mark as notified ketika dibuka dari notif
          markPhotoNotified(photoIdParam).catch(() => {});
        }
      }
    }
  }, [photoIdParam, photos]);

  const filteredPhotos = useMemo(
    () =>
      filter === "all"
        ? photos
        : photos.filter((p) => p.status === filter),
    [photos, filter]
  );

  const totalPages = Math.ceil(filteredPhotos.length / PAGE_SIZE);

  const paginatedPhotos = filteredPhotos.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / max) * 100),
      }));
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

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.image_result);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `foto_${photo.id.slice(0, 8)}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.push("Foto berhasil diunduh", "success");
    } catch {
      toast.push("Gagal mengunduh foto", "error");
    }
  };

  const openPhoto = (photo: Photo, index: number) => {
    setActivePhoto(photo);
    setActiveIndex(index);

    // Mark as notified when opened
    markPhotoNotified(photo.id).catch(() => {});
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      const photo = filteredPhotos[newIndex];

      if (photo) {
        setActivePhoto(photo);
        setActiveIndex(newIndex);
      }
    }
  };

  const goToNext = () => {
    if (activeIndex < filteredPhotos.length - 1) {
      const newIndex = activeIndex + 1;
      const photo = filteredPhotos[newIndex];

      if (photo) {
        setActivePhoto(photo);
        setActiveIndex(newIndex);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#4A1A1A] tracking-wide">
            Dashboard
          </h1>

          <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
            Ringkasan aktivitas photobooth — otomatis update setiap{" "}
            {POLL_MS / 1000} detik
          </p>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-1.5 font-serif text-xs text-[#6B2D2C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5B7F5C] animate-pulse" />
            Live
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {loading && (
        <p className="font-serif text-sm text-[#4A1A1A]/60">
          Memuat statistik...
        </p>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total Frame"
            value={stats.totalFrames}
            icon={Images}
            bg="cream"
          />

          <StatsCard
            label="Total Foto"
            value={stats.totalPhotos}
            icon={Camera}
            bg="gold"
          />

          <StatsCard
            label="Pending Print"
            value={stats.pendingPrint}
            icon={Clock3}
            bg="creamDark"
          />

          <StatsCard
            label="Sudah Dicetak"
            value={stats.printed}
            icon={CheckCircle2}
            bg="maroon"
          />
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] items-start">
          {/* Left Column — Photos with Pagination */}
          <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-4 sm:p-5 shadow-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
                Semua Foto
              </h2>

              <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setCurrentPage(1);
                    }}
                    className={`rounded-xl px-3.5 py-1.5 font-serif text-xs font-semibold transition-all ${
                      filter === f.value
                        ? "bg-[#6B2D2C] text-[#F5EBE0] shadow-md"
                        : "bg-[#F5EBE0] text-[#4A1A1A]/70 hover:bg-[#E8DDD0]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-serif text-lg text-[#4A1A1A]/40">
                  Belum ada foto
                </p>

                <p className="font-serif text-sm text-[#4A1A1A]/30">
                  Foto akan muncul di sini setelah sesi selesai
                </p>
              </div>
            ) : (
              <>
                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                  {paginatedPhotos.map((photo, idx) => {
                    const globalIndex =
                      (currentPage - 1) * PAGE_SIZE + idx;

                    return (
                      <motion.button
                        key={photo.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{
                          y: -4,
                          transition: { duration: 0.15 },
                        }}
                        onClick={() =>
                          openPhoto(photo, globalIndex)
                        }
                        className="group relative"
                      >
                        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md transition-shadow group-hover:shadow-lg">
                          <Image
                            src={photo.image_result}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-contain"
                            style={{ background: "transparent" }}
                          />

                          {/* Nomor urut */}
                          <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1A0A08]/70 backdrop-blur-sm font-serif text-[9px] font-bold text-[#F5EBE0]">
                            {globalIndex + 1}
                          </div>

                          {/* Status badge */}
                          <span
                            className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 font-serif text-[9px] font-semibold shadow-sm ${
                              photo.status === "printed"
                                ? "bg-[#5B7F5C] text-[#FBF7F2]"
                                : "bg-[#C9A87C] text-[#4A1A1A]"
                            }`}
                          >
                            {photo.status === "printed"
                              ? "PRINTED"
                              : "PENDING"}
                          </span>
                        </div>

                        <p className="mt-1.5 truncate text-center font-serif text-[10px] text-[#4A1A1A]/50">
                          {formatTime(photo.created_at)}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EBE0] text-[#4A1A1A] shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} strokeWidth={2.3} />
                    </button>

                    <div className="flex gap-1">
                      {Array.from(
                        {
                          length: Math.min(5, totalPages),
                        },
                        (_, i) => {
                          let pageNum;

                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (
                            currentPage >= totalPages - 2
                          ) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() =>
                                setCurrentPage(pageNum)
                              }
                              className={`h-8 w-8 rounded-lg font-serif text-xs font-medium transition-all ${
                                currentPage === pageNum
                                  ? "bg-[#6B2D2C] text-[#F5EBE0] shadow-md"
                                  : "bg-[#F5EBE0] text-[#4A1A1A] hover:bg-[#E8DDD0]"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EBE0] text-[#4A1A1A] shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} strokeWidth={2.3} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column — Analytics */}
          <div className="flex flex-col gap-6">
            {/* Popular Frames */}
            <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#F5EBE0] p-4 sm:p-5 shadow-md">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3
                  size={18}
                  className="text-[#6B2D2C]"
                  strokeWidth={2.2}
                />

                <h2 className="font-serif text-base font-semibold text-[#4A1A1A]">
                  Frame Terpopuler
                </h2>
              </div>

              {frameBreakdown.length === 0 ? (
                <p className="font-serif text-xs text-[#4A1A1A]/50">
                  Belum ada data.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {frameBreakdown.map((f) => (
                    <div key={f.name}>
                      <div className="mb-1 flex items-center justify-between font-serif text-xs text-[#4A1A1A]/80">
                        <span className="truncate">{f.name}</span>

                        <span className="shrink-0 font-semibold text-[#6B2D2C]">
                          {f.count}
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-[#FBF7F2] shadow-inner">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6B2D2C] to-[#C9A87C]"
                          style={{ width: `${f.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Needed */}
            <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-4 sm:p-5 shadow-md">
              <h2 className="mb-2 font-serif text-base font-semibold text-[#4A1A1A]">
                Perlu Tindakan
              </h2>

              {(stats?.pendingPrint ?? 0) === 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-[#5B7F5C]"
                    strokeWidth={2.2}
                  />

                  <p className="font-serif text-sm text-[#4A1A1A]/70">
                    Semua sudah beres!
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 font-serif text-sm text-[#4A1A1A]/80">
                  <li className="flex items-center gap-2 rounded-lg bg-[#C9A87C]/20 px-3 py-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A87C]" />

                    <strong className="text-[#6B2D2C]">
                      {stats?.pendingPrint}
                    </strong>

                    foto menunggu cetak
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <PhotoLightbox
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
        onMarkPrinted={handleMarkPrinted}
        onDelete={handleDelete}
        onPrint={handlePrint}
        onDownload={handleDownload}
        currentIndex={activeIndex}
        totalPhotos={filteredPhotos.length}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <p className="font-serif text-sm text-[#4A1A1A]/60">
            Memuat dashboard...
          </p>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}