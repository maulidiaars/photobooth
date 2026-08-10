"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Printer, CheckCircle2, Trash2, Clock3 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import { shareResultToWhatsapp } from "@/lib/whatsapp";
import { useToast } from "@/components/ui/Toast";
import type { Photo } from "@/types/photo";

interface PhotoLightboxProps {
  photo: Photo | null;
  onClose: () => void;
  onMarkPrinted: (photo: Photo) => void;
  onDelete: (photo: Photo) => void;
  onPrint: (photo: Photo) => void;
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

export function PhotoLightbox({ photo, onClose, onMarkPrinted, onDelete, onPrint }: PhotoLightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);
  const toast = useToast();

  const handleWhatsapp = async () => {
    if (!photo?.whatsapp_number) return;
    setSending(true);
    try {
      const result = await shareResultToWhatsapp(photo.image_result, photo.whatsapp_number);
      toast.push(
        result === "shared"
          ? "File foto dibagikan, tinggal kirim di WhatsApp"
          : "WhatsApp dibuka — lampirkan file fotonya ya",
        "success"
      );
    } catch {
      toast.push("Gagal membuka WhatsApp", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-3xl flex-col gap-6 rounded-clay-lg bg-paper p-5 shadow-clay-lg sm:flex-row sm:p-6"
            >
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink shadow-clay-sm hover:shadow-clay"
              >
                <X size={17} strokeWidth={2.4} />
              </button>

              <div className="flex flex-1 items-center justify-center sm:max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo?.image_result}
                  alt="Hasil foto"
                  className="max-h-[56vh] w-auto object-contain drop-shadow-[0_18px_30px_rgba(58,40,31,0.3)]"
                />
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold italic text-ink">
                    {photo?.frame_nama ?? "Frame"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted">
                    <Clock3 size={14} strokeWidth={2.2} />
                    {photo && formatTime(photo.created_at)}
                  </p>
                  {photo?.whatsapp_number && (
                    <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted">
                      <MessageCircle size={14} strokeWidth={2.2} />
                      {photo.whatsapp_number}
                    </p>
                  )}
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 font-body text-xs font-semibold ${
                      photo?.status === "printed" ? "bg-forest text-paper-light" : "bg-clay-yellowDark/50 text-ink"
                    }`}
                  >
                    {photo?.status === "printed" ? "Sudah dicetak" : "Menunggu cetak"}
                  </span>
                </div>

                <div className="mt-auto flex flex-col gap-2.5">
                  {photo?.whatsapp_number && (
                    <button
                      onClick={handleWhatsapp}
                      disabled={sending}
                      className="flex items-center justify-center gap-2 rounded-clay-sm bg-forest-gradient py-3 font-body font-semibold text-paper-light shadow-clay-sm hover:shadow-clay disabled:opacity-60"
                    >
                      <MessageCircle size={17} strokeWidth={2.3} />
                      {sending ? "Menyiapkan..." : "Kirim ke WhatsApp"}
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => photo && onPrint(photo)}
                      className="flex items-center justify-center gap-1.5 rounded-clay-sm bg-white/80 py-2.5 font-body text-sm font-medium text-ink shadow-clay-sm hover:shadow-clay"
                    >
                      <Printer size={15} strokeWidth={2.3} />
                      Print
                    </button>
                    {photo?.status !== "printed" && (
                      <button
                        onClick={() => photo && onMarkPrinted(photo)}
                        className="flex items-center justify-center gap-1.5 rounded-clay-sm bg-white/80 py-2.5 font-body text-sm font-medium text-ink shadow-clay-sm hover:shadow-clay"
                      >
                        <CheckCircle2 size={15} strokeWidth={2.3} />
                        Sudah Dicetak
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className={`flex items-center justify-center gap-1.5 rounded-clay-sm bg-white/80 py-2.5 font-body text-sm font-medium text-rose-600 shadow-clay-sm hover:shadow-clay ${
                        photo?.status === "printed" ? "col-span-2" : ""
                      }`}
                    >
                      <Trash2 size={15} strokeWidth={2.3} />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
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
