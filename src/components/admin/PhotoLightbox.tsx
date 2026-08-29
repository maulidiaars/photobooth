"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Printer, Trash2, Clock3, Download, ChevronLeft, ChevronRight, Images, Eye } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { formatDateTimeFullID } from "@/lib/dateUtils";
import type { Photo } from "@/types/photo";

// ============================================
// 🔥 KONFIGURASI WHATSAPP
// ============================================
const ADMIN_PHONE = "085800619612";

function formatPhoneDisplay(raw: string) {
  const d = raw.replace(/[^\d]/g, "");
  return d.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

interface PhotoLightboxProps {
  photo: Photo | null;
  onClose: () => void;
  onMarkPrinted: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
  onPrint: (photo: Photo) => void;
  onDownload?: (photo: Photo) => void;
  currentIndex?: number;
  totalPhotos?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

const formatTime = formatDateTimeFullID;

export function PhotoLightbox({
  photo,
  onClose,
  onMarkPrinted,
  onDelete,
  onPrint,
  onDownload,
  currentIndex = 0,
  totalPhotos = 0,
  onPrev,
  onNext,
}: PhotoLightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);
  const [rawActiveIndex, setRawActiveIndex] = useState(0);
  const [lightboxRawOpen, setLightboxRawOpen] = useState(false);
  const [lightboxRawIndex, setLightboxRawIndex] = useState(0);
  const rawScrollerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    setRawActiveIndex(0);
    rawScrollerRef.current?.scrollTo({ left: 0 });
  }, [photo?.id]);

  const handleSendWhatsApp = () => {
    if (!photo?.whatsapp_number) {
      toast.push("Nomor WhatsApp tidak tersedia", "error");
      return;
    }

    setSending(true);

    try {
      const cleanNumber = photo.whatsapp_number.replace(/[^0-9]/g, "");

      let formattedNumber = cleanNumber;
      if (formattedNumber.startsWith("0")) {
        formattedNumber = `62${formattedNumber.slice(1)}`;
      } else if (!formattedNumber.startsWith("62")) {
        formattedNumber = `62${formattedNumber}`;
      }

      const origin =
        APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
      const photoLink = `${origin}/foto/${photo.id}`;

      const message = encodeURIComponent(
        `*${APP_NAME}*\n\n` +
        `Haii, terima kasih banyak ya udah mampir dan berfoto bareng kami hari ini! 🎞️\n\n` +
        `🖼️ Frame: *${photo.frame_nama ?? "Frame"}*\n` +
        `🗓️ Tanggal: ${formatTime(photo.created_at)}\n\n` +
        `Yeay, hasil foto kamu udah jadi! Klik link di bawah ini buat lihat & download-nya ya:\n` +
        `${photoLink}\n\n` +
        `Di halaman itu ada 2 bagian:\n` +
        `1️⃣ Hasil foto lengkap dengan frame — tinggal tekan tombol download-nya\n` +
        `2️⃣ Foto asli satuan (tanpa frame) — geser satu-satu, tiap foto ada tombol download sendiri\n\n` +
        `Ada kendala atau mau cetak ulang? Hubungi admin kami di *${formatPhoneDisplay(ADMIN_PHONE)}*\n\n` +
        `Semoga harimu menyenangkan, sampai jumpa lagi! 👋\n` +
        `_Salam hangat, tim ${APP_NAME}_`
      );

      window.open(
        `https://wa.me/${formattedNumber}?text=${message}`,
        "_blank"
      );

      toast.push(
        "WhatsApp dibuka dengan link foto siap kirim!",
        "success"
      );

    } catch (error) {
      console.error("WhatsApp error:", error);
      toast.push("Gagal membuka WhatsApp", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadRaw = async (url: string, index: number) => {
    if (!photo) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);

      const ext = blob.type.includes("webp")
        ? "webp"
        : blob.type.includes("jpeg") || blob.type.includes("jpg")
        ? "jpg"
        : "png";

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `foto_original_${photo.id.slice(0, 8)}_${index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      toast.push(`Foto original #${index + 1} berhasil diunduh`, "success");
    } catch {
      toast.push("Gagal mengunduh foto original", "error");
    }
  };

  const handleRawScroll = () => {
    const el = rawScrollerRef.current;
    if (!el || !photo) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setRawActiveIndex(Math.min(photo.raw_photos.length - 1, Math.max(0, index)));
  };

  const scrollRawToIndex = (index: number) => {
    const el = rawScrollerRef.current;
    if (!el || !photo) return;
    const clamped = Math.min(photo.raw_photos.length - 1, Math.max(0, index));
    el.scrollTo({ left: el.clientWidth * clamped, behavior: "smooth" });
    setRawActiveIndex(clamped);
  };

  const openRawLightbox = (index: number) => {
    setLightboxRawIndex(index);
    setLightboxRawOpen(true);
  };

  if (!photo) return null;

  const hasRaw = photo.raw_photos && photo.raw_photos.length > 0;

  return (
    <>
      {/* MAIN LIGHTBOX */}
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-3 md:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-7xl max-h-[96vh] sm:max-h-[94vh] md:max-h-[92vh] flex-col bg-[#1A0A08] rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[#2A1510] px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-b border-[#4A2A20] shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-serif text-[10px] sm:text-xs font-medium text-[#C9A87C]">
                    #{currentIndex + 1} / {totalPhotos}
                  </span>
                  <span className="h-4 w-px bg-[#4A2A20]" />
                  <span className={`font-serif text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 rounded-full ${
                    photo.status === "printed"
                      ? "bg-[#5B7F5C] text-[#F5EBE0]"
                      : "bg-[#C9A87C] text-[#2A1510]"
                  }`}>
                    {photo.status === "printed" ? "DICETAK" : "PENDING"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={onDownload ? () => onDownload(photo) : undefined}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-[#4A2A20] px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-serif text-[10px] sm:text-xs font-medium text-[#C9A87C] hover:bg-[#5A3A30] transition-colors"
                  >
                    <Download size={14} strokeWidth={2.2} />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[#4A2A20] text-[#C9A87C] hover:bg-[#5A3A30] transition-colors"
                  >
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* Body: 2 Kolom */}
              <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto">
                {/* KIRI: Frame */}
                <div className="flex-1 flex items-center justify-center bg-[#0D0503] p-2 sm:p-3 md:p-4 lg:p-5 min-h-[250px] sm:min-h-[300px]">
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    className="max-h-[55vh] sm:max-h-[60vh] lg:max-h-[70vh] w-auto max-w-full object-contain shadow-2xl rounded-lg"
                    style={{ background: "transparent" }}
                  />
                </div>

                {/* KANAN: Info + Raw Photos Slider */}
                <div className="w-full lg:w-80 xl:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#4A2A20] bg-[#150907] p-3 sm:p-4 md:p-5 flex flex-col">
                  {/* Frame Name */}
                  <div className="mb-1.5 sm:mb-2">
                    <p className="font-serif text-lg sm:text-xl font-bold text-[#F5EBE0] truncate">
                      {photo.frame_nama ?? "Frame"}
                    </p>
                  </div>

                  {/* Detail Info */}
                  <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock3 size={16} className="text-[#C9A87C]/60 shrink-0" strokeWidth={2} />
                      <span className="font-serif text-xs sm:text-sm text-[#C9A87C]/80 truncate">
                        {formatTime(photo.created_at)}
                      </span>
                    </div>

                    {photo.whatsapp_number && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MessageCircle size={16} className="text-[#C9A87C]/60 shrink-0" strokeWidth={2} />
                        <span className="font-serif text-xs sm:text-sm text-[#C9A87C]/80 truncate">
                          {photo.whatsapp_number}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-[#4A2A20] mb-2 sm:mb-3" />

                  {/* RAW PHOTOS SLIDER */}
                  {hasRaw && (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[#C9A87C]">
                          <Images size={14} strokeWidth={2.2} />
                          <p className="font-serif text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                            Foto Asli
                          </p>
                        </div>
                        {photo.raw_photos.length > 1 && (
                          <span className="font-serif text-[10px] sm:text-[11px] font-semibold text-[#C9A87C]/50">
                            {rawActiveIndex + 1} / {photo.raw_photos.length}
                          </span>
                        )}
                      </div>

                      <div className="relative flex-1 min-h-[150px] sm:min-h-[180px] md:min-h-[200px]">
                        <div
                          ref={rawScrollerRef}
                          onScroll={handleRawScroll}
                          className="no-scrollbar flex w-full h-full snap-x snap-mandatory overflow-x-auto rounded-xl border border-[#C9A87C]/25 bg-[#0D0503]"
                        >
                          {photo.raw_photos.map((url, i) => (
                            <div
                              key={`${url}-${i}`}
                              className="relative w-full h-full shrink-0 snap-center flex items-center justify-center p-2 sm:p-3 cursor-pointer group"
                              onClick={() => openRawLightbox(i)}
                            >
                              <img
                                src={url}
                                alt={`Foto asli #${i + 1}`}
                                className="w-full h-full object-contain rounded-lg"
                                draggable={false}
                              />
                              
                              {/* HOVER OVERLAY - EYE ICON ONLY */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg">
                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                                  <div className="bg-[#2A1510]/80 p-2.5 sm:p-3 rounded-full backdrop-blur-sm ring-1 ring-[#C9A87C]/30">
                                    <Eye size={24} className="text-[#C9A87C]" strokeWidth={1.8} />
                                  </div>
                                </div>
                              </div>

                              <span className="absolute left-2 sm:left-3 top-2 sm:top-3 flex h-5 sm:h-6 min-w-5 sm:min-w-6 items-center justify-center rounded-full bg-black/70 px-1 sm:px-1.5 font-serif text-[8px] sm:text-[10px] font-medium text-white/90">
                                {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Navigation Arrows for Raw Slider */}
                        {photo.raw_photos.length > 1 && (
                          <>
                            <button
                              onClick={() => scrollRawToIndex(rawActiveIndex - 1)}
                              disabled={rawActiveIndex === 0}
                              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#2A1510]/90 text-[#C9A87C] shadow-md backdrop-blur-sm transition-all hover:bg-[#3A2018] disabled:opacity-0 z-10"
                            >
                              <ChevronLeft size={18} strokeWidth={2.4} />
                            </button>
                            <button
                              onClick={() => scrollRawToIndex(rawActiveIndex + 1)}
                              disabled={rawActiveIndex === photo.raw_photos.length - 1}
                              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#2A1510]/90 text-[#C9A87C] shadow-md backdrop-blur-sm transition-all hover:bg-[#3A2018] disabled:opacity-0 z-10"
                            >
                              <ChevronRight size={18} strokeWidth={2.4} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Dots Indicator */}
                      {photo.raw_photos.length > 1 && (
                        <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1 sm:gap-1.5">
                          {photo.raw_photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => scrollRawToIndex(i)}
                              className={`h-1 sm:h-1.5 rounded-full transition-all ${
                                i === rawActiveIndex ? "w-3 sm:w-5 bg-[#C9A87C]" : "w-1 sm:w-1.5 bg-[#C9A87C]/30"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <p className="mt-1.5 sm:mt-2 text-center font-serif text-[8px] sm:text-[10px] text-[#C9A87C]/40">
                        Klik ikon mata untuk lihat detail
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-2 sm:mt-3 space-y-2 pt-2 sm:pt-3 border-t border-[#4A2A20]">
                    {photo.whatsapp_number && (
                      <button
                        onClick={handleSendWhatsApp}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6B2D2C] py-2.5 sm:py-3 font-serif text-sm sm:text-base font-semibold text-[#F5EBE0] shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                      >
                        {sending ? (
                          <>
                            <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-[#F5EBE0] border-t-transparent" />
                            <span className="text-xs sm:text-sm">Membuka...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle size={18} strokeWidth={2.3} />
                            <span className="text-xs sm:text-sm">Kirim WhatsApp</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onPrint(photo);
                          if (photo.status !== "printed") {
                            onMarkPrinted(photo);
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#2A1510] py-2 sm:py-2.5 font-serif text-xs sm:text-sm font-medium text-[#C9A87C] border border-[#4A2A20] hover:border-[#6B2D2C] transition-all"
                      >
                        <Printer size={16} strokeWidth={2.3} />
                        Print
                      </button>

                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#2A1510] py-2 sm:py-2.5 font-serif text-xs sm:text-sm font-medium text-[#A0524A] border border-[#4A2A20] hover:border-[#A0524A] transition-all"
                      >
                        <Trash2 size={16} strokeWidth={2.3} />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows for Main Photos */}
              {totalPhotos > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="absolute left-1 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="absolute right-1 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronRight size={22} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL LIGHTBOX FOTO ASLI */}
      <AnimatePresence>
        {lightboxRawOpen && photo && photo.raw_photos && photo.raw_photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-lg"
            onClick={() => setLightboxRawOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxRawOpen(false)}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
              >
                <X size={22} strokeWidth={2.4} />
              </button>

              {/* Download Button */}
              <button
                onClick={() => {
                  const url = photo.raw_photos?.[lightboxRawIndex];
                  if (url) {
                    handleDownloadRaw(url, lightboxRawIndex);
                  }
                }}
                className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#2A1510]/90 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm border border-[#4A2A20]"
              >
                <Download size={18} strokeWidth={2.3} />
                <span className="font-serif text-xs sm:text-sm font-medium">Download</span>
              </button>

              {/* Counter */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
                <span className="font-serif text-xs sm:text-sm font-medium text-[#C9A87C] bg-[#2A1510]/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm">
                  {lightboxRawIndex + 1} / {photo.raw_photos.length}
                </span>
              </div>

              {/* Image */}
              {photo.raw_photos[lightboxRawIndex] && (
                <img
                  src={photo.raw_photos[lightboxRawIndex]}
                  alt={`Foto asli #${lightboxRawIndex + 1}`}
                  className="max-h-[80vh] sm:max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain rounded-xl shadow-2xl"
                  draggable={false}
                />
              )}

              {/* Navigation Arrows for Modal */}
              {photo.raw_photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxRawIndex((prev) => 
                        prev > 0 ? prev - 1 : photo.raw_photos.length - 1
                      );
                    }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft size={26} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxRawIndex((prev) => 
                        prev < photo.raw_photos.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronRight size={26} strokeWidth={2.5} />
                  </button>
                </>
              )}

              {/* Dots Indicator for Modal */}
              {photo.raw_photos.length > 1 && (
                <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
                  {photo.raw_photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxRawIndex(i);
                      }}
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        i === lightboxRawIndex ? "w-6 sm:w-8 bg-[#C9A87C]" : "w-1.5 sm:w-2 bg-[#C9A87C]/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmDelete}
        title="Hapus foto ini?"
        description="Foto akan dihapus permanen dari server dan tidak bisa dikembalikan."
        confirmLabel="Ya, hapus"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (photo) onDelete(photo);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}