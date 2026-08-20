"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Images,
  Camera,
  Clock3,
  CheckCircle2,
  BarChart3,
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
import { openPrintWindow } from "@/lib/print";

import type {
  DashboardStats,
  Photo,
  PhotoStatus,
} from "@/types/photo";

const POLL_MS = 6000;

const FILTERS: {
  label: string;
  value: PhotoStatus | "all";
}[] = [
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const photoIdParam = searchParams.get("photo");

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] =
    useState<PhotoStatus | "all">("all");

  const [activePhoto, setActivePhoto] =
    useState<Photo | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const knownIds = useRef<Set<string>>(new Set());

  // Nyimpen id foto yang query param `?photo=`-nya udah pernah dipakai buat
  // auto-buka lightbox, biar gak kebuka ulang terus-terusan tiap polling
  // (setiap 6 detik) narik data baru & bikin state `photos` berubah
  // reference-nya — sebelumnya bikin modal yang udah ditutup admin nongol
  // lagi sendiri.
  const openedFromParam = useRef<string | null>(null);

  const toast = useToast();

  const refresh = (
    opts: { silent?: boolean } = {}
  ) => {
    if (!opts.silent) {
      setLoading(true);
    }

    Promise.all([
      getDashboardStats(),
      getPhotos(),
    ])
      .then(([s, p]) => {
        const sorted = p.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        if (
          opts.silent &&
          knownIds.current.size > 0
        ) {
          const freshIds = new Set(
            sorted.map((x) => x.id)
          );

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
          knownIds.current = new Set(
            sorted.map((x) => x.id)
          );
        }

        setStats(s);
        setPhotos(sorted);
      })
      .catch(() => {
        if (!opts.silent) {
          toast.push(
            "Gagal memuat data dashboard",
            "error"
          );
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

    const onFocus = () => {
      refresh({ silent: true });
    };

    window.addEventListener("focus", onFocus);

    document.addEventListener(
      "visibilitychange",
      onFocus
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onFocus
      );
    };
  }, []);

  // Handle query param untuk buka lightbox dari notifikasi — cuma jalan
  // SEKALI per id (lewat openedFromParam ref) supaya polling berikutnya
  // gak balikin lightbox yang udah ditutup admin.
  useEffect(() => {
    if (
      photoIdParam &&
      photos.length > 0 &&
      openedFromParam.current !== photoIdParam
    ) {
      const idx = photos.findIndex(
        (p) => p.id === photoIdParam
      );

      if (idx !== -1) {
        const photo = photos[idx];

        if (photo) {
          openedFromParam.current = photoIdParam;
          setActivePhoto(photo);
          setActiveIndex(idx);

          markPhotoNotified(
            photoIdParam
          ).catch(() => {});
        }
      }
    }
  }, [photoIdParam, photos]);

  // Tutup lightbox + bersihin query param `?photo=` dari URL, biar gak
  // ada jejak yang bisa numicu useEffect di atas buka ulang lightbox-nya.
  const closeLightbox = () => {
    setActivePhoto(null);

    if (photoIdParam) {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      params.delete("photo");

      const query = params.toString();

      router.replace(
        query ? `${pathname}?${query}` : pathname,
        { scroll: false }
      );
    }
  };

  const filteredPhotos = useMemo(
    () =>
      filter === "all"
        ? photos
        : photos.filter(
            (p) => p.status === filter
          ),
    [photos, filter]
  );

  const frameBreakdown = useMemo(() => {
    const counts = new Map<
      string,
      number
    >();

    photos.forEach((p) => {
      const key =
        p.frame_nama ?? "Tanpa nama";

      counts.set(
        key,
        (counts.get(key) ?? 0) + 1
      );
    });

    const max = Math.max(
      1,
      ...counts.values()
    );

    return Array.from(counts.entries())
      .sort(
        (a, b) => b[1] - a[1]
      )
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round(
          (count / max) * 100
        ),
      }));
  }, [photos]);

  const handleMarkPrinted = async (
    photo: Photo
  ) => {
    try {
      await updatePhotoStatus(
        photo.id,
        "printed"
      );

      toast.push(
        "Foto ditandai sudah dicetak",
        "success"
      );

      refresh({ silent: true });
    } catch {
      toast.push(
        "Gagal memperbarui status",
        "error"
      );
    }
  };

  const handleDelete = async (
    photo: Photo
  ) => {
    try {
      await deletePhoto(photo.id);

      toast.push(
        "Foto berhasil dihapus",
        "success"
      );

      refresh({ silent: true });
    } catch {
      toast.push(
        "Gagal menghapus foto",
        "error"
      );
    }
  };

  const handlePrint = (photo: Photo) => {
    openPrintWindow(photo.image_result, {
      onBlocked: () => {
        toast.push(
          "Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.",
          "error"
        );
      },
    });
  };

  const handleDownload = async (
    photo: Photo
  ) => {
    try {
      const response = await fetch(
        photo.image_result
      );

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      // Ekstensi ngikutin tipe file aslinya (.webp buat hasil foto baru
      // yang udah dikompres, .png buat data lama) biar gak salah nama.
      const ext = blob.type.includes("webp")
        ? "webp"
        : blob.type.includes("jpeg") ||
          blob.type.includes("jpg")
        ? "jpg"
        : "png";

      link.download = `foto_${photo.id.slice(
        0,
        8
      )}.${ext}`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.push(
        "Foto berhasil diunduh",
        "success"
      );
    } catch {
      toast.push(
        "Gagal mengunduh foto",
        "error"
      );
    }
  };

  const openPhoto = (
    photo: Photo,
    index: number
  ) => {
    setActivePhoto(photo);
    setActiveIndex(index);

    markPhotoNotified(
      photo.id
    ).catch(() => {});
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      const newIndex =
        activeIndex - 1;

      const photo =
        filteredPhotos[newIndex];

      if (photo) {
        setActivePhoto(photo);
        setActiveIndex(newIndex);
      }
    }
  };

  const goToNext = () => {
    if (
      activeIndex < filteredPhotos.length - 1
    ) {
      const newIndex =
        activeIndex + 1;

      const photo =
        filteredPhotos[newIndex];

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
        initial={{
          opacity: 0,
          y: -8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#4A1A1A] tracking-wide">
            Dashboard
          </h1>

          <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
            Ringkasan aktivitas photobooth —
            otomatis update setiap{" "}
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

      {/* Stats */}
      {loading && (
        <p className="font-serif text-sm text-[#4A1A1A]/60">
          Memuat statistik...
        </p>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
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

      {/* Main */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] items-start">
          {/* Photos */}
          <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-4 sm:p-5 shadow-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
                Semua Foto
              </h2>

              <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
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

            {filteredPhotos.length ===
            0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="font-serif text-lg text-[#4A1A1A]/40">
                  Belum ada foto
                </p>

                <p className="font-serif text-sm text-[#4A1A1A]/30">
                  Foto akan muncul di
                  sini setelah sesi
                  selesai
                </p>
              </div>
            ) : (
              // Satu baris, scroll ke samping — sengaja TANPA
              // card/container di belakang tiap foto (no rounded box,
              // no shadow, no bg) biar frame-nya "telanjang" full,
              // cuma nomor & badge status yang nempel di atasnya.
              // 2 foto kelihatan per layar di HP, 3 dari sm ke atas,
              // sisanya tinggal discroll admin ke kanan.
              <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 sm:gap-5">
                {filteredPhotos.map(
                  (photo, globalIndex) => (
                    <motion.button
                      key={photo.id}
                      layout
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      whileHover={{
                        y: -4,
                        transition: {
                          duration: 0.15,
                        },
                      }}
                      onClick={() =>
                        openPhoto(
                          photo,
                          globalIndex
                        )
                      }
                      className="group relative shrink-0 basis-[calc(50%-0.5rem)] sm:basis-[calc(33.333%-0.9rem)]"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform group-hover:scale-[1.015]">
                        <Image
                          src={photo.image_result}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-contain"
                          style={{
                            background: "transparent",
                          }}
                        />

                        {/* Nomor & badge status di-skalain sesuai lebar card
                            (bukan ukuran tetap) — sebelumnya h-7 w-7 +
                            padding px-2.5 fixed itu kegedean buat card yang
                            sempit di layar HP, jadi kelihatan "meleber"
                            saling nabrak. Sekarang lebih kecil & mepet di
                            layar sempit, membesar lagi begitu ada ruang. */}
                        <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1A0A08]/70 backdrop-blur-sm font-serif text-[10px] font-bold leading-none text-[#F5EBE0] sm:left-2 sm:top-2 sm:h-7 sm:w-7 sm:text-xs">
                          {globalIndex + 1}
                        </div>

                        <span
                          className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 font-serif text-[8px] font-semibold leading-none shadow-sm sm:right-2 sm:top-2 sm:px-2.5 sm:py-1 sm:text-[10px] ${
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
                  )
                )}
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="flex flex-col gap-6">
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

              {frameBreakdown.length ===
              0 ? (
                <p className="font-serif text-xs text-[#4A1A1A]/50">
                  Belum ada data.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {frameBreakdown.map(
                    (f) => (
                      <div
                        key={f.name}
                      >
                        <div className="mb-1 flex items-center justify-between font-serif text-xs text-[#4A1A1A]/80">
                          <span className="truncate">
                            {f.name}
                          </span>

                          <span className="shrink-0 font-semibold text-[#6B2D2C]">
                            {f.count}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-[#FBF7F2] shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#6B2D2C] to-[#C9A87C]"
                            style={{
                              width: `${f.pct}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-4 sm:p-5 shadow-md">
              <h2 className="mb-2 font-serif text-base font-semibold text-[#4A1A1A]">
                Perlu Tindakan
              </h2>

              {(stats?.pendingPrint ??
                0) === 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-[#5B7F5C]"
                    strokeWidth={
                      2.2
                    }
                  />

                  <p className="font-serif text-sm text-[#4A1A1A]/70">
                    Semua sudah
                    beres!
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 font-serif text-sm text-[#4A1A1A]/80">
                  <li className="flex items-center gap-2 rounded-lg bg-[#C9A87C]/20 px-3 py-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A87C]" />

                    <strong className="text-[#6B2D2C]">
                      {
                        stats?.pendingPrint
                      }
                    </strong>{" "}
                    foto menunggu
                    cetak
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <PhotoLightbox
        photo={activePhoto}
        onClose={closeLightbox}
        onMarkPrinted={
          handleMarkPrinted
        }
        onDelete={handleDelete}
        onPrint={handlePrint}
        onDownload={
          handleDownload
        }
        currentIndex={activeIndex}
        totalPhotos={
          filteredPhotos.length
        }
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}