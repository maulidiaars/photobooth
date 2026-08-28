"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  ImageOff,
  Loader2,
  CheckCircle2,
  Share2,
  Images,
  Frame as FrameIcon,
  CalendarDays,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { formatDateID } from "@/lib/dateUtils";

interface PublicPhoto {
  id: string;
  image_result: string;
  /** Foto original satu-satu (tanpa frame), urut sesuai slot. */
  raw_photos?: string[];
  frame_nama?: string;
  created_at?: string;
}

type Status = "loading" | "ready" | "not-found" | "error";

export default function PublicFotoPage() {
  const params = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<PublicPhoto | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  // Aspect ratio ASLI si frame (dari gambar hasilnya sendiri), bukan
  // ditebak/hardcode — biar frame apapun bentuknya (potret, strip
  // panjang, dst) selalu tampil proporsional, gak gepeng/kepotong.
  const [resultAspect, setResultAspect] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/photos/public/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("not-found");
          return;
        }
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        setPhoto(json.data as PublicPhoto);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // ============================================
  // 🔥 FUNGSI DOWNLOAD DENGAN NAMA FILE KEREN
  // ============================================
  const handleDownload = async () => {
    if (!photo) return;
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(photo.image_result);
      
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          setDownloadProgress(progress);
        }
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const blob = new Blob(chunks as BlobPart[], { 
        type: contentType 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const frameName = photo.frame_nama 
        ? photo.frame_nama.toLowerCase().replace(/\s+/g, '-') 
        : "foto";
      const shortId = photo.id.slice(0, 8);
      // Ekstensi ngikutin content-type asli file-nya (bisa .webp buat
      // hasil foto baru, atau .png buat data lama), bukan di-hardcode
      // .png biar filenya selalu kebuka bener pas didownload.
      const ext = contentType.includes('webp')
        ? 'webp'
        : contentType.includes('jpeg') || contentType.includes('jpg')
        ? 'jpg'
        : 'png';
      
      a.download = `photobooth-${frameName}-${shortId}.${ext}`;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setTimeout(() => setDownloadProgress(0), 1000);

    } catch (error) {
      console.error("Download gagal:", error);
      window.open(photo.image_result, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  // ============================================
  // 🔥 FUNGSI SHARE (opsional)
  // ============================================
  const handleShare = async () => {
    if (!photo) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Hasil Photobooth',
          text: `Hasil foto photobooth saya!`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy link
        await navigator.clipboard.writeText(window.location.href);
        alert('Link berhasil disalin!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return formatDateID(iso);
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center overflow-hidden bg-[#140806] px-4 py-8 sm:px-6 sm:py-12 md:px-8">
      {/* Warm ambient glow di belakang, senada sama nuansa dashboard
          admin — biar halaman ini kerasa "satu brand" sama produknya,
          bukan sekadar halaman generik hitam-putih. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(201,168,124,0.14) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(107,45,44,0.18) 0%, transparent 50%)",
        }}
      />

      {status === "loading" && (
        <div className="relative flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-[#C9A87C]/50" size={30} strokeWidth={2} />
        </div>
      )}

      {(status === "not-found" || status === "error") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center"
        >
          <div className="rounded-full bg-white/5 p-6">
            <ImageOff size={40} className="text-[#C9A87C]/40" strokeWidth={1.8} />
          </div>
          <p className="font-serif text-sm font-medium text-[#F5EBE0]/80 sm:text-base">
            {status === "not-found" ? "Foto tidak ditemukan." : "Gagal memuat foto."}
          </p>
          <p className="text-xs text-[#C9A87C]/40">
            {status === "not-found"
              ? "Mungkin foto sudah dihapus atau link salah."
              : "Coba periksa koneksi internet kamu."}
          </p>
        </motion.div>
      )}

      {status === "ready" && photo && (
        <div className="relative flex w-full flex-1 flex-col items-center gap-10 py-2 sm:gap-14">
          {/* ============================================
              HEADER — identitas brand + info singkat foto,
              biar jelas ini foto siapa/dari mana/kapan.
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-md flex-col items-center gap-3 text-center"
          >
            <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A87C]/70">
              {APP_NAME}
            </p>
            <h1 className="font-serif text-2xl font-bold text-[#F5EBE0] sm:text-3xl">
              Hasil Foto Kamu
            </h1>

            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              {photo.frame_nama && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A87C]/25 bg-[#C9A87C]/10 px-3 py-1 font-serif text-xs font-medium text-[#C9A87C]">
                  <FrameIcon size={12} strokeWidth={2.2} />
                  {photo.frame_nama}
                </span>
              )}
              {photo.created_at && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-serif text-xs font-medium text-[#F5EBE0]/70">
                  <CalendarDays size={12} strokeWidth={2.2} />
                  {formatDate(photo.created_at)}
                </span>
              )}
            </div>
          </motion.div>

          {/* ============================================
              BAGIAN 1 — Hasil foto beserta frame
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
            className="flex w-full max-w-[300px] flex-col items-center gap-3 sm:max-w-sm md:max-w-md"
          >
            <SectionLabel step={1} title="Hasil dengan Frame" />

            {/* Card wrapper dengan shadow + border tipis emas, biar
                fotonya terasa "dipajang", bukan cuma nempel polos. */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-[#C9A87C]/15 bg-black/20 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-2">
              <img
                src={photo.image_result}
                alt={`Hasil photobooth ${photo.frame_nama || ""}`}
                onLoad={(e) =>
                  setResultAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
                }
                className="h-auto w-full rounded-xl bg-[#0D0503] object-contain"
                loading="lazy"
                style={{ aspectRatio: resultAspect ? `${resultAspect}` : "2 / 3" }}
              />

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                aria-label="Download foto"
                className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F5EBE0] text-[#1A0A08] shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-60 sm:bottom-4 sm:right-4 sm:h-12 sm:w-12"
              >
                {downloading ? (
                  downloadProgress > 0 && downloadProgress < 100 ? (
                    <div className="relative flex items-center justify-center">
                      <svg className="h-5 w-5 -rotate-90 sm:h-6 sm:w-6" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="#1A0A08"
                          strokeWidth="3"
                          className="opacity-20"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="#1A0A08"
                          strokeWidth="3"
                          strokeDasharray="62.8"
                          strokeDashoffset={`${62.8 - (62.8 * downloadProgress) / 100}`}
                          className="transition-all duration-200"
                        />
                      </svg>
                      <span className="absolute text-[8px] font-bold text-[#1A0A08]">
                        {downloadProgress}%
                      </span>
                    </div>
                  ) : downloadProgress === 100 ? (
                    <CheckCircle2 size={20} className="text-green-700" strokeWidth={2.5} />
                  ) : (
                    <Loader2 size={18} className="animate-spin" strokeWidth={2.4} />
                  )
                ) : (
                  <Download size={18} strokeWidth={2.4} />
                )}
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                aria-label="Bagikan foto"
                className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-[#F5EBE0] shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/25 active:scale-95 sm:bottom-4 sm:left-4 sm:h-12 sm:w-12"
              >
                <Share2 size={17} strokeWidth={2.1} />
              </button>
            </div>

            <p className="text-center font-serif text-xs text-[#C9A87C]/50">
              Tekan tombol putih untuk menyimpan foto ke galeri kamu
            </p>
          </motion.div>

          {/* ============================================
              BAGIAN 2 — Foto asli satuan (tanpa frame),
              digeser satu-satu, tiap foto ada ikon
              download-nya sendiri + bulatan slider di bawah.
              ============================================ */}
          {photo.raw_photos && photo.raw_photos.length > 0 && (
            <RawPhotoSlider
              photos={photo.raw_photos}
              photoId={photo.id}
              frameNama={photo.frame_nama}
            />
          )}

          {/* Footer kecil */}
          <p className="pb-2 pt-2 text-center font-serif text-[10px] uppercase tracking-[0.2em] text-[#C9A87C]/25">
            {APP_NAME}
          </p>
        </div>
      )}
    </main>
  );
}

/** Label bernomor di atas tiap section ("1 — Hasil dengan Frame", dst),
 *  biar dua bagian foto (dengan frame vs. asli) jelas kebedain dan
 *  urutannya gampang diikuti, gak keliatan dua blok foto ambigu. */
function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A87C] font-serif text-[11px] font-bold text-[#1A0A08]">
        {step}
      </span>
      <p className="font-serif text-sm font-semibold text-[#F5EBE0]">{title}</p>
    </div>
  );
}

/**
 * Strip foto original tanpa frame: satu foto penuh per "slide", bisa
 * digeser (swipe / drag) ke kiri-kanan, dengan ikon download di dalam
 * tiap foto dan bulatan indikator di bawah yang menandakan ada berapa
 * foto & lagi di foto keberapa. Sengaja terpisah total dari hasil
 * frame di atas — di sini murni foto polos apa adanya.
 */
function RawPhotoSlider({
  photos,
  photoId,
  frameNama,
}: {
  photos: string[];
  photoId: string;
  frameNama?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(photos.length - 1, Math.max(0, index)));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
    setActiveIndex(index);
  };

  const handleDownloadRaw = async (url: string, index: number) => {
    setDownloadingIndex(index);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const contentType = blob.type || "image/jpeg";
      const ext = contentType.includes("webp")
        ? "webp"
        : contentType.includes("png")
        ? "png"
        : "jpg";

      const frameName = frameNama ? frameNama.toLowerCase().replace(/\s+/g, "-") : "foto";
      const shortId = photoId.slice(0, 8);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `photobooth-${frameName}-${shortId}-asli-${index + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download foto asli gagal:", error);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex w-full max-w-[300px] flex-col items-center gap-3 sm:max-w-sm md:max-w-md"
    >
      <div className="flex w-full items-center justify-between">
        <SectionLabel step={2} title="Foto Asli (Tanpa Frame)" />
        <span className="flex items-center gap-1 font-serif text-[11px] font-medium text-[#C9A87C]/50">
          <Images size={12} strokeWidth={2.2} />
          {photos.length} foto
        </span>
      </div>

      {/* Slider: satu foto penuh per slide, geser (swipe/drag) ke
          samping. snap-x biar selalu "nempel" pas di satu foto,
          gak berhenti di tengah-tengah. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl border border-[#C9A87C]/15 bg-black/20 shadow-2xl shadow-black/50 backdrop-blur-sm"
      >
        {photos.map((url, index) => (
          <div key={`${url}-${index}`} className="relative w-full shrink-0 snap-center p-1.5 sm:p-2">
            <img
              src={url}
              alt={`Foto asli #${index + 1}`}
              className="h-auto w-full rounded-xl bg-[#0D0503] object-contain"
              loading="lazy"
              style={{ aspectRatio: "3/4" }}
              draggable={false}
            />

            {/* Ikon download di dalam foto, pojok kanan bawah — sama
                letaknya kayak tombol download di hasil frame di atas,
                biar pengguna langsung ngeh cara pakainya. */}
            <button
              onClick={() => handleDownloadRaw(url, index)}
              disabled={downloadingIndex === index}
              aria-label={`Download foto asli ${index + 1}`}
              className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F5EBE0] text-[#1A0A08] shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-60 sm:bottom-4 sm:right-4 sm:h-12 sm:w-12"
            >
              {downloadingIndex === index ? (
                <Loader2 size={17} className="animate-spin" strokeWidth={2.4} />
              ) : (
                <Download size={17} strokeWidth={2.4} />
              )}
            </button>

            {/* Nomor urut foto, pojok kiri atas */}
            <span className="absolute left-3.5 top-3.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/50 px-1.5 font-serif text-[11px] font-medium text-[#F5EBE0]/85 backdrop-blur-sm sm:left-4 sm:top-4">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Bulatan indikator — nunjukin ada berapa foto & lagi di foto
          keberapa. Diklik juga bisa buat lompat langsung ke foto itu. */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ke foto asli #${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-[#C9A87C]" : "w-1.5 bg-[#C9A87C]/25"
              }`}
            />
          ))}
        </div>
      )}

      <p className="text-center font-serif text-xs text-[#C9A87C]/50">
        Geser untuk lihat foto lain, lalu tekan ikon unduh di tiap foto
      </p>
    </motion.div>
  );
}