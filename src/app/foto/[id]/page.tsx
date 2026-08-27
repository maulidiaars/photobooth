"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, ImageOff, Loader2, CheckCircle2, Share2, Image as ImageIcon } from "lucide-react";
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
      const blob = new Blob(chunks, { 
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
    <main className="flex min-h-svh flex-col items-center bg-gradient-to-b from-[#140806] to-[#1A0A08] px-4 py-6 sm:px-6 sm:py-10 md:px-8 lg:px-12">
      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-white/40" size={30} strokeWidth={2} />
        </div>
      )}

      {(status === "not-found" || status === "error") && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
        >
          <div className="rounded-full bg-white/5 p-6">
            <ImageOff size={40} className="text-white/30" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-medium text-white/60 sm:text-base">
            {status === "not-found" ? "Foto tidak ditemukan." : "Gagal memuat foto."}
          </p>
          <p className="text-xs text-white/30">
            {status === "not-found" ? "Mungkin foto sudah dihapus atau link salah." : "Coba periksa koneksi internet kamu."}
          </p>
        </motion.div>
      )}

      {status === "ready" && photo && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 py-4 sm:gap-10">
          {/* ============================================
              BAGIAN 1 — Hasil foto beserta frame
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="relative w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg"
          >
            {/* Card wrapper dengan shadow */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 bg-black/20 backdrop-blur-sm p-1.5 sm:p-2">

              {/* Image - Full width, maintain aspect ratio */}
              <img
                src={photo.image_result}
                alt={`Hasil photobooth ${photo.frame_nama || ''}`}
                className="w-full h-auto rounded-xl object-contain bg-[#0D0503]"
                loading="lazy"
                style={{ aspectRatio: '2/3' }}
              />

              {/* Download Button - Responsive size & position */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                aria-label="Download foto"
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#140806] shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-60 sm:bottom-4 sm:right-4 sm:h-11 sm:w-11 md:h-12 md:w-12"
              >
                {downloading ? (
                  downloadProgress > 0 && downloadProgress < 100 ? (
                    <div className="relative flex items-center justify-center">
                      <svg className="h-5 w-5 -rotate-90 sm:h-5 sm:w-5 md:h-6 md:w-6" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="#140806"
                          strokeWidth="3"
                          className="opacity-20"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke="#140806"
                          strokeWidth="3"
                          strokeDasharray="62.8"
                          strokeDashoffset={`${62.8 - (62.8 * downloadProgress) / 100}`}
                          className="transition-all duration-200"
                        />
                      </svg>
                      <span className="absolute text-[7px] font-bold text-[#140806] sm:text-[8px]">
                        {downloadProgress}%
                      </span>
                    </div>
                  ) : downloadProgress === 100 ? (
                    <CheckCircle2 size={18} className="text-green-600 sm:size-[18px] md:size-[20px]" strokeWidth={2.5} />
                  ) : (
                    <Loader2 size={16} className="animate-spin sm:size-[17px] md:size-[19px]" strokeWidth={2.4} />
                  )
                ) : (
                  <Download size={16} className="sm:size-[17px] md:size-[19px]" strokeWidth={2.4} />
                )}
              </button>

              {/* Share Button - Opsional, responsive */}
              <button
                onClick={handleShare}
                aria-label="Bagikan foto"
                className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white/70 shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105 active:scale-95 sm:bottom-4 sm:left-4 sm:h-11 sm:w-11 md:h-12 md:w-12"
              >
                <Share2 size={16} className="sm:size-[17px] md:size-[19px]" strokeWidth={2} />
              </button>
            </div>

            {/* Caption / Info di bawah foto - Responsive */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-center space-y-1.5 sm:mt-5 sm:space-y-2"
            >
              <p className="text-[10px] text-white/40 sm:text-xs">
                Klik tombol download di pojok kanan bawah untuk menyimpan foto
              </p>
              <p className="text-[8px] text-white/20 sm:text-[10px]">
                ID: {photo.id.slice(0, 12)}
              </p>
            </motion.div>
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
        </div>
      )}
    </main>
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
      transition={{ delay: 0.15 }}
      className="w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg"
    >
      <div className="mb-3 flex items-center justify-center gap-1.5 text-white/50">
        <ImageIcon size={13} strokeWidth={2} />
        <p className="text-[10px] font-medium uppercase tracking-wide sm:text-xs">
          Foto asli &middot; tanpa frame &middot; {photos.length} foto
        </p>
      </div>

      {/* Slider: satu foto penuh per slide, geser (swipe/drag) ke
          samping. snap-x biar selalu "nempel" pas di satu foto,
          gak berhenti di tengah-tengah. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-black/20 shadow-2xl shadow-black/40 backdrop-blur-sm"
      >
        {photos.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative w-full shrink-0 snap-center p-1.5 sm:p-2"
          >
            <img
              src={url}
              alt={`Foto asli #${index + 1}`}
              className="w-full h-auto rounded-xl object-contain bg-[#0D0503]"
              loading="lazy"
              style={{ aspectRatio: "3/4" }}
              draggable={false}
            />

            {/* Ikon download di dalam foto, pojok kanan bawah —
                sama letaknya kayak tombol download di hasil frame
                di atas, biar pengguna langsung ngeh cara pakainya. */}
            <button
              onClick={() => handleDownloadRaw(url, index)}
              disabled={downloadingIndex === index}
              aria-label={`Download foto asli ${index + 1}`}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#140806] shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-white active:scale-95 disabled:opacity-60 sm:bottom-4 sm:right-4 sm:h-11 sm:w-11"
            >
              {downloadingIndex === index ? (
                <Loader2 size={16} className="animate-spin sm:size-[17px]" strokeWidth={2.4} />
              ) : (
                <Download size={16} className="sm:size-[17px]" strokeWidth={2.4} />
              )}
            </button>

            {/* Nomor urut foto, pojok kiri atas */}
            <span className="absolute left-3.5 top-3.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/50 px-1.5 font-medium text-[11px] text-white/80 backdrop-blur-sm sm:left-4 sm:top-4">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Bulatan indikator — nunjukin ada berapa foto & lagi di foto
          keberapa. Diklik juga bisa buat lompat langsung ke foto itu. */}
      {photos.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ke foto asli #${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? "w-5 bg-white/90" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[10px] text-white/40 sm:text-xs">
        Geser untuk lihat foto lain, lalu tekan ikon download di tiap foto untuk menyimpannya
      </p>
    </motion.div>
  );
}