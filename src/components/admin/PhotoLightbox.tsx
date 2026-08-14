"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Printer, Trash2, Clock3, Download, ChevronLeft, ChevronRight, Hash, Send } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Photo } from "@/types/photo";

// ============================================
// 🔥 KONFIGURASI WHATSAPP
// ============================================
const ADMIN_PHONE = "085853164066";

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const toast = useToast();

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

      // ============================================
      // 🔥 PESAN OTOMATIS
      // ============================================
      const message = encodeURIComponent(
        `✨ *Terima kasih sudah menggunakan Photobooth kami!* ✨\n\n` +
        `📸 *Frame:* ${photo.frame_nama ?? "Frame"}\n` +
        `📅 *Tanggal:* ${formatTime(photo.created_at)}\n\n` +
        `Berikut hasil foto Anda dalam kualitas HD:\n` +
        `(Silakan download dan simpan foto di bawah ini)\n\n` +
        `----------------------------------------\n` +
        `📱 *Admin:* ${ADMIN_PHONE}\n` +
        `💬 Jika ada pertanyaan, hubungi admin.\n\n` +
        `*Salam hangat dari tim Photobooth!* 🎉`
      );

      // ============================================
      // 🔥 BUKA WHATSAPP DENGAN PESAN
      // ============================================
      window.open(
        `https://wa.me/${formattedNumber}?text=${message}`,
        "_blank"
      );

      toast.push(
        "WhatsApp dibuka! Lampirkan foto dan kirim.",
        "success"
      );

    } catch (error) {
      console.error("WhatsApp error:", error);
      toast.push("Gagal membuka WhatsApp", "error");
    } finally {
      setSending(false);
    }
  };

  if (!photo) return null;

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
              className="relative flex w-full max-w-5xl max-h-[90vh] flex-col bg-[#1A0A08] rounded-2xl overflow-hidden shadow-2xl"
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

              {/* Body: 2 KOLOM FULL */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0">
                {/* Kiri: Frame — PURE HD, NO BACKGROUND */}
                <div className="flex-1 flex items-center justify-center bg-[#0D0503] p-8 min-h-[350px] md:min-h-[450px]">
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    className="max-h-[60vh] md:max-h-[70vh] w-auto max-w-full object-contain shadow-2xl"
                    style={{ 
                      background: 'transparent',
                    }}
                  />
                </div>

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
                        onClick={() => onPrint(photo)}
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