"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, MessageCircle, Clock3, Check } from "lucide-react";
import { getPhotos, markPhotoNotified } from "@/services/photoService";
import { ROUTES } from "@/lib/constants";
import type { Photo } from "@/types/photo";

const POLL_MS = 6000;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Live "new session" notification bell — polls for photos the admin
 *  hasn't acknowledged yet (notified = 0) and lists them with full
 *  detail (frame, jam/tanggal, nomor WA) so admin always knows the
 *  moment someone finishes a session. A clean solid card, opacity/scale
 *  only entrance (no vertical slide) so it never reads as pushing or
 *  disturbing the header/content around it. */
export function NotificationBell() {
  const [items, setItems] = useState<Photo[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = () => {
    getPhotos()
      .then((all) => setItems(all.filter((p) => !p.notified)))
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

  const handleAcknowledge = async (photo: Photo) => {
    await markPhotoNotified(photo.id);
    setItems((prev) => prev.filter((p) => p.id !== photo.id));
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifikasi"
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-clay-sm hover:shadow-clay transition-shadow"
      >
        <Bell size={19} className="text-ink" strokeWidth={2.2} />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-garnet px-1 font-body text-[11px] font-semibold text-paper-light shadow-clay-sm">
            {items.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 z-50 mt-3 w-[22rem] max-w-[90vw] overflow-hidden rounded-clay-lg border border-ink/10 bg-white shadow-clay-lg"
          >
            <div className="flex items-center justify-between border-b border-ink/10 bg-paper-light px-4 py-3">
              <p className="font-display font-semibold text-ink">Sesi baru masuk</p>
              <span className="rounded-full bg-garnet/10 px-2 py-0.5 font-body text-xs font-medium text-garnet">
                {items.length} belum dilihat
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto clay-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10">
                    <Check size={18} className="text-forest" strokeWidth={2.4} />
                  </div>
                  <p className="font-body text-sm text-muted">
                    Belum ada sesi baru. Semua sudah kamu lihat.
                  </p>
                </div>
              ) : (
                items.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex gap-3 border-b border-ink/[0.06] px-4 py-3 last:border-0 hover:bg-paper-light/60"
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-clay-xs bg-paper-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.image_result} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-ink">
                        {photo.frame_nama ?? "Frame"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 font-body text-xs text-muted">
                        <Clock3 size={12} strokeWidth={2.2} />
                        {formatTime(photo.created_at)}
                      </p>
                      {photo.whatsapp_number && (
                        <p className="mt-0.5 flex items-center gap-1 font-body text-xs text-muted">
                          <MessageCircle size={12} strokeWidth={2.2} />
                          {photo.whatsapp_number}
                        </p>
                      )}
                      <button
                        onClick={() => handleAcknowledge(photo)}
                        className="mt-1.5 font-body text-xs font-semibold text-garnet underline underline-offset-2 hover:text-garnet-dark"
                      >
                        Tandai sudah dilihat
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href={ROUTES.adminDashboard}
              onClick={() => setOpen(false)}
              className="block bg-paper-light px-4 py-2.5 text-center font-body text-xs font-medium text-ink hover:bg-paper-dark/60"
            >
              Buka Dashboard
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
