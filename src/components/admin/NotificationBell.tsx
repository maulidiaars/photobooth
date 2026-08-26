"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, MessageCircle, Clock3, Check, X, Eye, Printer, Trash2 } from "lucide-react";
import { getPhotos, markPhotoNotified, updatePhotoStatus } from "@/services/photoService";
import { ROUTES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { openPrintWindow } from "@/lib/print";
import { parseDbDate, formatDateTimeID } from "@/lib/dateUtils";
import type { Photo } from "@/types/photo";

const POLL_MS = 6000;
const NOTIF_EXPIRE_MINUTES = 30;

interface NotificationItem extends Photo {
  expiredAt: Date;
}

// NOTE: created_at dari DB itu UTC tanpa "Z" (lihat lib/db.ts +
// lib/dateUtils.ts). Kalau di-parse langsung pakai `new Date(iso)` biasa,
// browser nganggep string itu jam lokal — jamnya jadi geser/salah, dan
// perhitungan "kapan notif expired" di bawah (yang dulu juga pakai
// `new Date(p.created_at)` langsung) ikutan ngaco. Sekarang semua lewat
// util terpusat biar bener.
const formatTime = formatDateTimeID;

function getTimeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam lalu`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const load = () => {
    getPhotos()
      .then((all) => {
        const unread = all.filter((p) => !p.notified);
        const now = new Date();
        
        // Filter: hanya notif yang belum expired (kurang dari 30 menit)
        const validItems = unread
          .map((p) => ({
            ...p,
            expiredAt: new Date(parseDbDate(p.created_at).getTime() + NOTIF_EXPIRE_MINUTES * 60000),
          }))
          .filter((item) => item.expiredAt > now);
        
        // Auto-mark expired items sebagai notified (biar ga muncul lagi)
        const expiredItems = unread
          .filter((p) => new Date(parseDbDate(p.created_at).getTime() + NOTIF_EXPIRE_MINUTES * 60000) <= now);
        
        if (expiredItems.length > 0) {
          expiredItems.forEach((p) => markPhotoNotified(p.id).catch(() => {}));
        }

        setItems(validItems);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // MARK AS READ
  const handleAcknowledge = async (photo: Photo) => {
    await markPhotoNotified(photo.id);
    setItems((prev) => prev.filter((p) => p.id !== photo.id));
  };

  // MARK ALL AS READ
  const handleAcknowledgeAll = async () => {
    await Promise.all(items.map((p) => markPhotoNotified(p.id)));
    setItems([]);
  };

  // FUNGSI: Klik "Cetak" langsung dari notif -> buka preview print, dan
  // baru setelah proses cetak itu SELESAI (dialog print ditutup / window
  // preview ditutup) statusnya ditandai printed & notifnya hilang.
  const handleMarkPrinted = (photo: Photo) => {
    setProcessing(photo.id);

    const finalizePrinted = async () => {
      try {
        await updatePhotoStatus(photo.id, "printed");
        await markPhotoNotified(photo.id);
        toast.push("Foto ditandai sudah dicetak", "success");
        setItems((prev) => prev.filter((p) => p.id !== photo.id));
        load();
      } catch {
        toast.push("Gagal memperbarui status", "error");
      } finally {
        setProcessing(null);
      }
    };

    openPrintWindow(photo.image_result, {
      onDone: () => {
        void finalizePrinted();
      },
      onBlocked: () => {
        toast.push(
          "Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.",
          "error"
        );
        setProcessing(null);
      },
    });
  };

  // FUNGSI BARU: Open photo in dashboard (bawa ke lightbox)
  const handleViewPhoto = (photo: Photo) => {
    setOpen(false);
    // Arahkan ke dashboard dengan query param untuk buka lightbox
    window.location.href = `${ROUTES.adminDashboard}?photo=${photo.id}`;
  };

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifikasi"
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF7F2] shadow-md hover:shadow-lg transition-shadow"
      >
        <Bell size={19} className="text-[#4A1A1A]" strokeWidth={2.2} />
        {items.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6B2D2C] px-1 font-serif text-[11px] font-semibold text-[#F5EBE0] shadow-md"
          >
            {items.length}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 z-50 mt-3 w-[24rem] max-w-[90vw] overflow-hidden rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E8DDD0]/50 bg-[#F5EBE0] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#6B2D2C]" strokeWidth={2.2} />
                <p className="font-serif font-semibold text-[#4A1A1A]">Sesi Baru</p>
                <span className="ml-1 text-xs text-[#4A1A1A]/50 font-serif">
                  (expire {NOTIF_EXPIRE_MINUTES} menit)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={handleAcknowledgeAll}
                    className="text-xs font-serif text-[#6B2D2C] underline underline-offset-2 hover:text-[#4A1A1A] transition-colors"
                  >
                    Tandai semua
                  </button>
                )}
                <span className="rounded-full bg-[#6B2D2C]/10 px-2.5 py-0.5 font-serif text-xs font-medium text-[#6B2D2C]">
                  {items.length}
                </span>
              </div>
            </div>

            {/* List Notifikasi */}
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5B7F5C]/10">
                    <Check size={20} className="text-[#5B7F5C]" strokeWidth={2.4} />
                  </div>
                  <p className="font-serif text-sm text-[#4A1A1A]/60">Semua sesi sudah dilihat</p>
                  <p className="font-serif text-xs text-[#4A1A1A]/40">Notifikasi otomatis hilang setelah 30 menit</p>
                </div>
              ) : (
                items.map((photo) => {
                  const isExpiring = (photo.expiredAt.getTime() - new Date().getTime()) < 300000; // 5 menit
                  return (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 border-b border-[#E8DDD0]/30 px-4 py-3 last:border-0 hover:bg-[#F5EBE0]/50 transition-colors ${
                        isExpiring ? "bg-[#C9A87C]/10" : ""
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-[#F5EBE0]">
                        <img src={photo.image_result} alt="" className="h-full w-full object-cover" />
                        {isExpiring && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#C9A87C]/30">
                            <Clock3 size={14} className="text-[#6B2D2C]" strokeWidth={2.2} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-serif text-sm font-semibold text-[#4A1A1A]">
                            {photo.frame_nama ?? "Frame"}
                          </p>
                          <span className="shrink-0 font-serif text-[10px] text-[#4A1A1A]/40">
                            {getTimeAgo(parseDbDate(photo.created_at))}
                          </span>
                        </div>

                        <p className="mt-0.5 flex items-center gap-1 font-serif text-xs text-[#4A1A1A]/60">
                          <Clock3 size={11} strokeWidth={2.2} />
                          {formatTime(photo.created_at)}
                        </p>

                        {photo.whatsapp_number && (
                          <p className="mt-0.5 flex items-center gap-1 font-serif text-xs text-[#4A1A1A]/60">
                            <MessageCircle size={11} strokeWidth={2.2} />
                            {photo.whatsapp_number}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleViewPhoto(photo)}
                            className="flex items-center gap-1 rounded-lg bg-[#6B2D2C]/10 px-2.5 py-1 font-serif text-xs font-medium text-[#6B2D2C] hover:bg-[#6B2D2C]/20 transition-colors"
                          >
                            <Eye size={12} strokeWidth={2.2} />
                            Lihat
                          </button>

                          <button
                            onClick={() => handleMarkPrinted(photo)}
                            disabled={processing === photo.id}
                            className="flex items-center gap-1 rounded-lg bg-[#5B7F5C]/10 px-2.5 py-1 font-serif text-xs font-medium text-[#5B7F5C] hover:bg-[#5B7F5C]/20 transition-colors disabled:opacity-50"
                          >
                            <Printer size={12} strokeWidth={2.2} />
                            {processing === photo.id ? "..." : "Cetak"}
                          </button>

                          <button
                            onClick={() => handleAcknowledge(photo)}
                            className="flex items-center gap-1 rounded-lg bg-[#E8DDD0] px-2.5 py-1 font-serif text-xs font-medium text-[#4A1A1A]/60 hover:bg-[#D5C8B8] transition-colors"
                          >
                            <X size={12} strokeWidth={2.2} />
                            Tutup
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E8DDD0]/50 bg-[#F5EBE0] px-4 py-2.5 flex items-center justify-between">
              <Link
                href={ROUTES.adminDashboard}
                onClick={() => setOpen(false)}
                className="font-serif text-xs font-medium text-[#4A1A1A] hover:text-[#6B2D2C] transition-colors"
              >
                Lihat semua di Dashboard →
              </Link>
              {items.length > 0 && (
                <span className="font-serif text-[10px] text-[#4A1A1A]/40">
                  {items.length} notif aktif
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}