"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Printer, Trash2, Clock3, Download, ChevronLeft, ChevronRight, Hash, Send, Images } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { formatDateTimeFullID } from "@/lib/dateUtils";
import type { Photo } from "@/types/photo";

// ============================================
// 🔥 KONFIGURASI WHATSAPP — ganti nomor di bawah ini
// dengan nomor WhatsApp admin/pengirim yang kamu mau
// (pakai format 08xxx atau +62xxx).
// ============================================
const ADMIN_PHONE = "085800619612";

/** "085800619612" -> "0858-0061-9612", cuma buat tampilan biar rapi. */
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

// NOTE: created_at dari DB itu UTC tanpa "Z" (lihat lib/db.ts +
// lib/dateUtils.ts). Pakai util terpusat biar jamnya bener (WIB),
// termasuk yang kepakai di teks share WhatsApp di bawah.
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
  onNext
}: PhotoLightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);
  // Foto asli mana yang lagi dibuka penuh (null = gak ada yang kebuka).
  const [openRawIndex, setOpenRawIndex] = useState<number | null>(null);
  // Aspect ratio kanvas frame ini (didapat dari gambar hasil yang udah
  // dimuat), dipakai biar kolase kotak-kotaknya proporsinya sama persis
  // kayak frame aslinya — bukan diasumsikan potret/persegi begitu saja.
  const [frameAspect, setFrameAspect] = useState<number | null>(null);
  const toast = useToast();

  // Foto yang dibuka berganti (navigasi prev/next) -> reset aspect ratio
  // & modal foto asli yang lagi kebuka, biar gak ke-carry dari frame
  // sebelumnya yang proporsinya beda.
  useEffect(() => {
    setFrameAspect(null);
    setOpenRawIndex(null);
  }, [photo?.id]);

  // ============================================
  // 🔥 FUNGSI KIRIM WHATSAPP (wa.me)
  // ============================================
  const handleSendWhatsApp = () => {
    if (!photo?.whatsapp_number) {
      toast.push("Nomor WhatsApp tidak tersedia", "error");
      return;
    }

    setSending(true);

    try {
      // Bersihkan nomor telepon
      const cleanNumber = photo.whatsapp_number.replace(/[^0-9]/g, "");
      
      // Format nomor untuk WhatsApp (62xxx)
      let formattedNumber = cleanNumber;
      if (formattedNumber.startsWith("0")) {
        formattedNumber = `62${formattedNumber.slice(1)}`;
      } else if (!formattedNumber.startsWith("62")) {
        formattedNumber = `62${formattedNumber}`;
      }

      const origin =
        APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
      const photoLink = `${origin}/foto/${photo.id}`;

      // ============================================
      // 🔥 PESAN WHATSAPP — 100% KOMPATIBEL
      // 
      // RULES WhatsApp:
      // - Bold: *teks*
      // - Italic: _teks_
      // - Strikethrough: ~teks~
      // - GAK SUPPORT: ---, ===, ###, dsb
      // - GAK SUPPORT: emoji multi-codepoint
      // ============================================
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

  // ============================================
  // 🔥 DOWNLOAD FOTO ORIGINAL (RAW, TANPA FRAME) — SATU PERSATU
  // ============================================
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

  if (!photo) return null;

  const hasRaw = photo.raw_photos && photo.raw_photos.length > 0;
  const hasSlotLayout = photo.frame_slot_layout && photo.frame_slot_layout.length > 0;

  return (
    <>
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A0A08]/85 backdrop-blur-md p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-6xl max-h-[90vh] flex-col bg-[#1A0A08] rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[#2A1510] px-6 py-3.5 border-b border-[#4A2A20] shrink-0">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-sm font-medium text-[#C9A87C]">
                    #{currentIndex + 1} / {totalPhotos}
                  </span>
                  <span className="h-4 w-px bg-[#4A2A20]" />
                  <span className={`font-serif text-xs font-semibold px-3 py-0.5 rounded-full ${
                    photo.status === "printed" 
                      ? "bg-[#5B7F5C] text-[#F5EBE0]" 
                      : "bg-[#C9A87C] text-[#2A1510]"
                  }`}>
                    {photo.status === "printed" ? "DICETAK" : "PENDING"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onDownload ? () => onDownload(photo) : undefined}
                    className="flex items-center gap-2 rounded-lg bg-[#4A2A20] px-3.5 py-1.5 font-serif text-xs font-medium text-[#C9A87C] hover:bg-[#5A3A30] transition-colors"
                  >
                    <Download size={14} strokeWidth={2.2} />
                    Download
                  </button>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A2A20] text-[#C9A87C] hover:bg-[#5A3A30] transition-colors"
                  >
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              {/* Body: Frame | Kolase Foto Asli | Keterangan — scrollable
                  kalau layar pendek, biar 3 kolomnya tetap muat. */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto">
                {/* Kiri: Frame — PURE HD, NO BACKGROUND */}
                <div className="flex-1 flex items-center justify-center bg-[#0D0503] p-8 min-h-[320px] md:min-h-[450px]">
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    onLoad={(e) =>
                      setFrameAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
                    }
                    className="max-h-[60vh] md:max-h-[70vh] w-auto max-w-full object-contain shadow-2xl"
                    style={{ 
                      background: 'transparent',
                    }}
                  />
                </div>

                {/* Tengah: Kolase Foto Asli — kotak-kotak bertingkat
                    ngikutin persis posisi/struktur slot frame-nya, tapi
                    TANPA gambar frame itu sendiri. Klik satu foto buat
                    lihat versi penuhnya. */}
                {hasRaw && (
                  <div className="w-full md:w-64 lg:w-72 shrink-0 bg-[#140806] border-t md:border-t-0 md:border-x border-[#4A2A20] p-5 flex flex-col">
                    <div className="mb-3 flex items-center gap-2 text-[#C9A87C]/70">
                      <Images size={14} strokeWidth={2.2} />
                      <p className="font-serif text-xs font-semibold uppercase tracking-wide">
                        Foto Asli (Raw)
                      </p>
                    </div>

                    {hasSlotLayout ? (
                      // Kolase mengikuti slot_layout frame persis (fraksi
                      // 0-1 dari kanvas), diposisikan absolute — jadi
                      // strukturnya identik dengan susunan frame aslinya,
                      // cuma tanpa gambar frame di atasnya.
                      <div
                        className="relative w-full overflow-hidden rounded-lg bg-[#0D0503]"
                        style={{ aspectRatio: frameAspect ? `${frameAspect}` : "3 / 4" }}
                      >
                        {photo.raw_photos.map((url, i) => {
                          const rect = photo.frame_slot_layout?.[i];
                          if (!rect) return null;
                          return (
                            <button
                              key={`${url}-${i}`}
                              onClick={() => setOpenRawIndex(i)}
                              title={`Lihat foto asli #${i + 1}`}
                              className="group/raw absolute overflow-hidden border border-[#1A0A08] transition-all hover:z-10 hover:brightness-110"
                              style={{
                                left: `${rect.x * 100}%`,
                                top: `${rect.y * 100}%`,
                                width: `${rect.w * 100}%`,
                                height: `${rect.h * 100}%`,
                              }}
                            >
                              <img
                                src={url}
                                alt={`Foto asli #${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute inset-0 bg-black/0 transition-all group-hover/raw:bg-black/20" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Fallback kalau frame lama gak punya slot_layout
                      // tersimpan — tetap tampil sebagai grid rapi biasa
                      // biar gak kosong.
                      <div className="grid grid-cols-2 gap-1.5">
                        {photo.raw_photos.map((url, i) => (
                          <button
                            key={`${url}-${i}`}
                            onClick={() => setOpenRawIndex(i)}
                            title={`Lihat foto asli #${i + 1}`}
                            className="aspect-square overflow-hidden rounded-lg border border-[#4A2A20] transition-transform hover:scale-[1.03]"
                          >
                            <img
                              src={url}
                              alt={`Foto asli #${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 text-center font-serif text-[10px] text-[#C9A87C]/40">
                      Klik salah satu foto untuk melihat ukuran penuh
                    </p>
                  </div>
                )}

                {/* Kanan: Keterangan */}
                <div className="w-full md:w-80 lg:w-96 bg-[#1A0A08] border-t md:border-t-0 md:border-l border-[#4A2A20] p-6 flex flex-col gap-5">
                  {/* Nama Frame */}
                  <div>
                    <p className="font-serif text-xl font-bold text-[#F5EBE0]">
                      {photo.frame_nama ?? "Frame"}
                    </p>
                  </div>

                  {/* Detail Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock3 size={16} className="text-[#C9A87C]/60 shrink-0" strokeWidth={2} />
                      <span className="font-serif text-sm text-[#C9A87C]/80">
                        {formatTime(photo.created_at)}
                      </span>
                    </div>
                    
                    {photo.whatsapp_number && (
                      <div className="flex items-center gap-3">
                        <MessageCircle size={16} className="text-[#C9A87C]/60 shrink-0" strokeWidth={2} />
                        <span className="font-serif text-sm text-[#C9A87C]/80">
                          {photo.whatsapp_number}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Hash size={16} className="text-[#C9A87C]/60 shrink-0" strokeWidth={2} />
                      <span className="font-mono text-xs text-[#C9A87C]/50">
                        {photo.id.slice(0, 12)}
                      </span>
                    </div>

                    {/* Admin info */}
                    <div className="flex items-center gap-3 pt-1 border-t border-[#4A2A20]/50">
                      <Send size={14} className="text-[#C9A87C]/40 shrink-0" strokeWidth={2} />
                      <span className="font-serif text-xs text-[#C9A87C]/40">
                        Admin: {ADMIN_PHONE}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-[#4A2A20]" />

                  {/* Actions */}
                  <div className="mt-auto space-y-2.5">
                    {/* WhatsApp Send Button */}
                    {photo.whatsapp_number && (
                      <button
                        onClick={handleSendWhatsApp}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#6B2D2C] py-3.5 font-serif font-semibold text-[#F5EBE0] shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                      >
                        {sending ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F5EBE0] border-t-transparent" />
                            Membuka...
                          </>
                        ) : (
                          <>
                            <MessageCircle size={18} strokeWidth={2.3} />
                            Kirim WhatsApp
                          </>
                        )}
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          // Klik Print = foto dianggap sudah dicetak,
                          // jadi status ikut ke-update sekalian, gak
                          // perlu tombol/aksi terpisah lagi buat itu.
                          onPrint(photo);
                          if (photo.status !== "printed") {
                            onMarkPrinted(photo);
                          }
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#2A1510] py-3 font-serif text-sm font-medium text-[#C9A87C] border border-[#4A2A20] hover:border-[#6B2D2C] transition-all"
                      >
                        <Printer size={16} strokeWidth={2.3} />
                        Print
                      </button>
                      
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#2A1510] py-3 font-serif text-sm font-medium text-[#A0524A] border border-[#4A2A20] hover:border-[#A0524A] transition-all"
                      >
                        <Trash2 size={16} strokeWidth={2.3} />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation arrows */}
              {totalPhotos > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-[#2A1510]/80 text-[#C9A87C] hover:bg-[#4A2A20] transition-all backdrop-blur-sm"
                  >
                    <ChevronRight size={22} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal foto asli — PURE, cuma foto itu sendiri + tombol close.
          Sengaja gak dibungkus card/container apapun biar admin lihat
          foto raw-nya persis apa adanya, gak ada distraksi. */}
      <AnimatePresence>
        {photo && openRawIndex !== null && photo.raw_photos[openRawIndex] && (() => {
          const activeRawUrl = photo.raw_photos[openRawIndex];
          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setOpenRawIndex(null)}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              src={activeRawUrl}
              alt={`Foto asli #${openRawIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] max-w-[92vw] object-contain select-none"
              draggable={false}
            />

            <button
              onClick={() => setOpenRawIndex(null)}
              aria-label="Tutup"
              className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X size={20} strokeWidth={2.4} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadRaw(activeRawUrl, openRawIndex);
              }}
              aria-label="Download foto ini"
              className="fixed left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <Download size={18} strokeWidth={2.3} />
            </button>

            {photo.raw_photos.length > 1 && (
              <span className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 font-serif text-xs text-white/70 backdrop-blur-sm">
                {openRawIndex + 1} / {photo.raw_photos.length}
              </span>
            )}
          </motion.div>
          );
        })()}
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