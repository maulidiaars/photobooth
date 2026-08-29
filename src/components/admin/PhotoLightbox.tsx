"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageCircle,
  Printer,
  Trash2,
  Clock3,
  Download,
  ChevronLeft,
  ChevronRight,
  Images,
  Eye,
} from "lucide-react";

import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { formatDateTimeFullID } from "@/lib/dateUtils";
import type { Photo } from "@/types/photo";

// ============================================
// KONFIGURASI WHATSAPP ADMIN
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

  // ============================================
  // RESET RAW SLIDER SAAT FOTO BERUBAH
  // ============================================
  useEffect(() => {
    setRawActiveIndex(0);

    rawScrollerRef.current?.scrollTo({
      left: 0,
      behavior: "auto",
    });
  }, [photo?.id]);

  // ============================================
  // CLOSE RAW MODAL DENGAN ESC
  // ============================================
  useEffect(() => {
    if (!lightboxRawOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxRawOpen(false);
      }

      if (photo?.raw_photos?.length && photo.raw_photos.length > 1) {
        if (e.key === "ArrowLeft") {
          setLightboxRawIndex((prev) =>
            prev > 0 ? prev - 1 : photo.raw_photos.length - 1
          );
        }

        if (e.key === "ArrowRight") {
          setLightboxRawIndex((prev) =>
            prev < photo.raw_photos.length - 1 ? prev + 1 : 0
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxRawOpen, photo]);

  // ============================================
  // WHATSAPP
  // ============================================
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
        APP_URL ||
        (typeof window !== "undefined"
          ? window.location.origin
          : "");

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
          `Ada kendala atau mau cetak ulang? Hubungi admin kami di *${formatPhoneDisplay(
            ADMIN_PHONE
          )}*\n\n` +
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
  // DOWNLOAD FOTO ASLI
  // ============================================
  const handleDownloadRaw = async (
    url: string,
    index: number
  ) => {
    if (!photo) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const objectUrl = window.URL.createObjectURL(blob);

      const ext = blob.type.includes("webp")
        ? "webp"
        : blob.type.includes("jpeg") ||
          blob.type.includes("jpg")
        ? "jpg"
        : "png";

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `foto_original_${photo.id.slice(
        0,
        8
      )}_${index + 1}.${ext}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(objectUrl);

      toast.push(
        `Foto original #${index + 1} berhasil diunduh`,
        "success"
      );
    } catch {
      toast.push(
        "Gagal mengunduh foto original",
        "error"
      );
    }
  };

  // ============================================
  // RAW SLIDER
  // ============================================
  const handleRawScroll = () => {
    const el = rawScrollerRef.current;

    if (!el || !photo?.raw_photos?.length) return;

    const index = Math.round(
      el.scrollLeft / el.clientWidth
    );

    setRawActiveIndex(
      Math.min(
        photo.raw_photos.length - 1,
        Math.max(0, index)
      )
    );
  };

  const scrollRawToIndex = (index: number) => {
    const el = rawScrollerRef.current;

    if (!el || !photo?.raw_photos?.length) return;

    const clamped = Math.min(
      photo.raw_photos.length - 1,
      Math.max(0, index)
    );

    el.scrollTo({
      left: el.clientWidth * clamped,
      behavior: "smooth",
    });

    setRawActiveIndex(clamped);
  };

  // ============================================
  // OPEN FOTO ASLI
  // ============================================
  const openRawLightbox = (index: number) => {
    setLightboxRawIndex(index);
    setLightboxRawOpen(true);
  };

  if (!photo) return null;

  const hasRaw =
    photo.raw_photos &&
    photo.raw_photos.length > 0;

  return (
    <>
      {/* ======================================================
          MAIN PHOTO MODAL
      ====================================================== */}
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/75
              backdrop-blur-md
              p-3 sm:p-4
              overflow-hidden
            "
            onClick={onClose}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 8,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                flex flex-col
                w-full
                max-w-6xl
                h-auto
                max-h-[92vh]
                overflow-hidden
                rounded-[22px]
                bg-[#150907]
                border border-[#4A2A20]
                shadow-[0_25px_80px_rgba(0,0,0,0.55)]
              "
            >
              {/* ==================================================
                  HEADER
              ================================================== */}
              <div
                className="
                  shrink-0
                  flex items-center justify-between
                  bg-[#2A1510]
                  border-b border-[#4A2A20]
                  px-4 sm:px-5 md:px-6
                  py-3
                "
              >
                {/* LEFT : STATUS */}
                <div className="flex items-center gap-3">
                  <span
                    className="
                      font-serif
                      text-[11px] sm:text-xs
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-[#C9A87C]
                    "
                  >
                    Foto
                  </span>

                  <span className="h-4 w-px bg-[#5A3327]" />

                  <span
                    className={`
                      rounded-full
                      px-3 py-1
                      font-serif
                      text-[10px] sm:text-xs
                      font-bold
                      tracking-wide
                      ${
                        photo.status === "printed"
                          ? "bg-[#5B7F5C] text-[#F5EBE0]"
                          : "bg-[#C9A87C] text-[#2A1510]"
                      }
                    `}
                  >
                    {photo.status === "printed"
                      ? "DICETAK"
                      : "PENDING"}
                  </span>
                </div>

                {/* RIGHT : ACTIONS */}
                <div className="flex items-center gap-2">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(photo)}
                      className="
                        flex items-center justify-center gap-2
                        rounded-xl
                        bg-[#4A2A20]
                        px-3.5 sm:px-4
                        py-2
                        font-serif
                        text-xs
                        font-medium
                        text-[#C9A87C]
                        transition-all
                        hover:bg-[#5A3A30]
                        hover:-translate-y-0.5
                      "
                    >
                      <Download
                        size={15}
                        strokeWidth={2.2}
                      />

                      <span className="hidden sm:inline">
                        Download
                      </span>
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    aria-label="Tutup"
                    className="
                      flex
                      h-9 w-9
                      items-center justify-center
                      rounded-xl
                      bg-[#4A2A20]
                      text-[#C9A87C]
                      transition-all
                      hover:bg-[#63372B]
                      hover:rotate-90
                    "
                  >
                    <X
                      size={18}
                      strokeWidth={2.3}
                    />
                  </button>
                </div>
              </div>

              {/* ==================================================
                  BODY
              ================================================== */}
              <div
                className="
                  flex
                  min-h-0
                  flex-1
                  flex-col
                  lg:flex-row
                  overflow-hidden
                "
              >
                {/* =================================================
                    LEFT : FRAME
                ================================================= */}
                <div
                  className="
                    relative
                    flex-1
                    min-h-0
                    min-w-0
                    flex
                    items-center
                    justify-center
                    bg-[#0D0503]
                    px-5 sm:px-7 lg:px-8
                    py-5 sm:py-6
                    overflow-hidden
                  "
                >
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    className="
                      block
                      max-w-full
                      max-h-[calc(92vh-120px)]
                      w-auto
                      h-auto
                      object-contain
                      rounded-xl
                      shadow-[0_18px_45px_rgba(0,0,0,0.5)]
                    "
                    style={{
                      background: "transparent",
                    }}
                  />

                  {/* MAIN NAVIGATION */}
                  {totalPhotos > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrev?.();
                        }}
                        aria-label="Foto sebelumnya"
                        className="
                          absolute
                          left-3 sm:left-5
                          top-1/2
                          -translate-y-1/2
                          z-20
                          flex
                          h-9 w-9 sm:h-10 sm:w-10
                          items-center justify-center
                          rounded-full
                          bg-[#2A1510]/90
                          text-[#C9A87C]
                          border border-[#C9A87C]/15
                          shadow-lg
                          backdrop-blur-md
                          transition-all
                          hover:bg-[#4A2A20]
                          hover:scale-105
                        "
                      >
                        <ChevronLeft
                          size={21}
                          strokeWidth={2.4}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNext?.();
                        }}
                        aria-label="Foto berikutnya"
                        className="
                          absolute
                          right-3 sm:right-5
                          top-1/2
                          -translate-y-1/2
                          z-20
                          flex
                          h-9 w-9 sm:h-10 sm:w-10
                          items-center justify-center
                          rounded-full
                          bg-[#2A1510]/90
                          text-[#C9A87C]
                          border border-[#C9A87C]/15
                          shadow-lg
                          backdrop-blur-md
                          transition-all
                          hover:bg-[#4A2A20]
                          hover:scale-105
                        "
                      >
                        <ChevronRight
                          size={21}
                          strokeWidth={2.4}
                        />
                      </button>
                    </>
                  )}
                </div>

                {/* =================================================
                    RIGHT : INFORMATION
                ================================================= */}
                <div
                  className="
                    w-full
                    lg:w-[360px]
                    xl:w-[390px]
                    shrink-0
                    min-h-0
                    flex
                    flex-col
                    bg-[#150907]
                    border-t
                    lg:border-t-0
                    lg:border-l
                    border-[#4A2A20]
                    px-5 sm:px-6
                    py-4 sm:py-5
                    overflow-hidden
                  "
                >
                  {/* FRAME NAME */}
                  <div className="shrink-0 mb-3">
                    <p
                      className="
                        font-serif
                        text-xl sm:text-2xl
                        font-bold
                        text-[#F5EBE0]
                        truncate
                      "
                    >
                      {photo.frame_nama ?? "Frame"}
                    </p>
                  </div>

                  {/* INFO */}
                  <div className="shrink-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <Clock3
                        size={17}
                        className="shrink-0 text-[#C9A87C]/65"
                        strokeWidth={2}
                      />

                      <span
                        className="
                          font-serif
                          text-xs sm:text-sm
                          text-[#C9A87C]/80
                          truncate
                        "
                      >
                        {formatTime(photo.created_at)}
                      </span>
                    </div>

                    {photo.whatsapp_number && (
                      <div className="flex items-center gap-3">
                        <MessageCircle
                          size={17}
                          className="shrink-0 text-[#C9A87C]/65"
                          strokeWidth={2}
                        />

                        <span
                          className="
                            font-serif
                            text-xs sm:text-sm
                            text-[#C9A87C]/80
                            truncate
                          "
                        >
                          {photo.whatsapp_number}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="h-px w-full bg-[#4A2A20] my-4 shrink-0" />

                  {/* =================================================
                      RAW PHOTOS
                  ================================================= */}
                  {hasRaw && (
                    <div className="flex-1 min-h-0 flex flex-col">
                      {/* TITLE */}
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Images
                            size={15}
                            className="text-[#C9A87C]"
                            strokeWidth={2.2}
                          />

                          <p
                            className="
                              font-serif
                              text-[11px]
                              font-bold
                              uppercase
                              tracking-[0.12em]
                              text-[#C9A87C]
                            "
                          >
                            Foto Asli
                          </p>
                        </div>

                        <span
                          className="
                            rounded-full
                            bg-[#2A1510]
                            border border-[#C9A87C]/15
                            px-2.5 py-1
                            font-serif
                            text-[10px]
                            font-semibold
                            text-[#C9A87C]/70
                          "
                        >
                          {rawActiveIndex + 1} /{" "}
                          {photo.raw_photos.length}
                        </span>
                      </div>

                      {/* RAW IMAGE */}
                      <div className="relative flex-1 min-h-0">
                        <div
                          ref={rawScrollerRef}
                          onScroll={handleRawScroll}
                          className="
                            no-scrollbar
                            flex
                            h-full
                            w-full
                            snap-x
                            snap-mandatory
                            overflow-x-auto
                            rounded-2xl
                            border border-[#C9A87C]/20
                            bg-[#0D0503]
                          "
                        >
                          {photo.raw_photos.map(
                            (url, i) => (
                              <div
                                key={`${url}-${i}`}
                                className="
                                  relative
                                  h-full
                                  w-full
                                  shrink-0
                                  snap-center
                                  flex
                                  items-center
                                  justify-center
                                  p-2.5
                                  cursor-pointer
                                  group
                                "
                                onClick={() =>
                                  openRawLightbox(i)
                                }
                              >
                                <img
                                  src={url}
                                  alt={`Foto asli #${
                                    i + 1
                                  }`}
                                  className="
                                    h-full
                                    w-full
                                    object-contain
                                    rounded-xl
                                  "
                                  draggable={false}
                                />

                                {/* HOVER */}
                                <div
                                  className="
                                    absolute
                                    inset-2.5
                                    flex
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-black/0
                                    group-hover:bg-black/35
                                    transition-all
                                    duration-200
                                  "
                                >
                                  <div
                                    className="
                                      flex
                                      h-11 w-11
                                      items-center justify-center
                                      rounded-full
                                      bg-[#1A0A08]/85
                                      border border-[#C9A87C]/25
                                      text-[#C9A87C]
                                      opacity-0
                                      scale-90
                                      group-hover:opacity-100
                                      group-hover:scale-100
                                      transition-all
                                      duration-200
                                      shadow-xl
                                      backdrop-blur-sm
                                    "
                                  >
                                    <Eye
                                      size={20}
                                      strokeWidth={1.9}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* RAW PREV */}
                        {photo.raw_photos.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                scrollRawToIndex(
                                  rawActiveIndex - 1
                                )
                              }
                              disabled={
                                rawActiveIndex === 0
                              }
                              className="
                                absolute
                                left-2
                                top-1/2
                                -translate-y-1/2
                                flex
                                h-8 w-8
                                items-center justify-center
                                rounded-full
                                bg-[#1A0A08]/90
                                text-[#C9A87C]
                                border border-[#C9A87C]/15
                                shadow-lg
                                backdrop-blur-md
                                transition-all
                                hover:bg-[#4A2A20]
                                disabled:opacity-0
                              "
                            >
                              <ChevronLeft
                                size={17}
                                strokeWidth={2.5}
                              />
                            </button>

                            {/* RAW NEXT */}
                            <button
                              onClick={() =>
                                scrollRawToIndex(
                                  rawActiveIndex + 1
                                )
                              }
                              disabled={
                                rawActiveIndex ===
                                photo.raw_photos.length -
                                  1
                              }
                              className="
                                absolute
                                right-2
                                top-1/2
                                -translate-y-1/2
                                flex
                                h-8 w-8
                                items-center justify-center
                                rounded-full
                                bg-[#1A0A08]/90
                                text-[#C9A87C]
                                border border-[#C9A87C]/15
                                shadow-lg
                                backdrop-blur-md
                                transition-all
                                hover:bg-[#4A2A20]
                                disabled:opacity-0
                              "
                            >
                              <ChevronRight
                                size={17}
                                strokeWidth={2.5}
                              />
                            </button>
                          </>
                        )}
                      </div>

                      {/* DOTS */}
                      {photo.raw_photos.length > 1 && (
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            gap-1.5
                            mt-3
                            shrink-0
                          "
                        >
                          {photo.raw_photos.map(
                            (_, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  scrollRawToIndex(i)
                                }
                                aria-label={`Foto ${
                                  i + 1
                                }`}
                                className={`
                                  h-1.5
                                  rounded-full
                                  transition-all
                                  ${
                                    i === rawActiveIndex
                                      ? "w-6 bg-[#C9A87C]"
                                      : "w-1.5 bg-[#C9A87C]/25"
                                  }
                                `}
                              />
                            )
                          )}
                        </div>
                      )}

                      <p
                        className="
                          mt-2
                          shrink-0
                          text-center
                          font-serif
                          text-[9px]
                          text-[#C9A87C]/35
                        "
                      >
                        Klik foto untuk melihat lebih besar
                      </p>
                    </div>
                  )}

                  {/* =================================================
                      ACTIONS
                  ================================================= */}
                  <div
                    className="
                      mt-3
                      pt-3
                      border-t border-[#4A2A20]
                      shrink-0
                    "
                  >
                    {photo.whatsapp_number && (
                      <button
                        onClick={handleSendWhatsApp}
                        disabled={sending}
                        className="
                          w-full
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-[#6B2D2C]
                          py-2.5
                          font-serif
                          text-sm
                          font-semibold
                          text-[#F5EBE0]
                          shadow-md
                          transition-all
                          hover:bg-[#783634]
                          hover:-translate-y-0.5
                          disabled:opacity-60
                        "
                      >
                        {sending ? (
                          <>
                            <span
                              className="
                                h-4 w-4
                                animate-spin
                                rounded-full
                                border-2
                                border-[#F5EBE0]
                                border-t-transparent
                              "
                            />

                            <span>
                              Membuka...
                            </span>
                          </>
                        ) : (
                          <>
                            <MessageCircle
                              size={18}
                              strokeWidth={2.3}
                            />

                            <span>
                              Kirim WhatsApp
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {/* PRINT */}
                      <button
                        onClick={() => {
                          onPrint(photo);

                          if (
                            photo.status !==
                            "printed"
                          ) {
                            onMarkPrinted(photo);
                          }
                        }}
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-[#2A1510]
                          border border-[#4A2A20]
                          py-2.5
                          font-serif
                          text-sm
                          font-medium
                          text-[#C9A87C]
                          transition-all
                          hover:border-[#6B2D2C]
                          hover:bg-[#321A14]
                        "
                      >
                        <Printer
                          size={16}
                          strokeWidth={2.3}
                        />
                        Print
                      </button>

                      {/* DELETE */}
                      <button
                        onClick={() =>
                          setConfirmDelete(true)
                        }
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-[#2A1510]
                          border border-[#4A2A20]
                          py-2.5
                          font-serif
                          text-sm
                          font-medium
                          text-[#A0524A]
                          transition-all
                          hover:border-[#A0524A]
                          hover:bg-[#351B17]
                        "
                      >
                        <Trash2
                          size={16}
                          strokeWidth={2.3}
                        />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          FOTO ASLI FULLSCREEN VIEWER
      ============================================================ */}
      <AnimatePresence>
        {lightboxRawOpen &&
          photo &&
          photo.raw_photos &&
          photo.raw_photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="
                fixed
                inset-0
                z-[60]
                flex
                items-center
                justify-center
                bg-[#080403]/96
                backdrop-blur-xl
                overflow-hidden
              "
              onClick={() =>
                setLightboxRawOpen(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  relative
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  overflow-hidden
                "
              >
                {/* ================================================
                    TOP BAR
                ================================================= */}
                <div
                  className="
                    absolute
                    top-0
                    left-0
                    right-0
                    z-30
                    flex
                    items-center
                    justify-between
                    px-4 sm:px-6
                    py-4
                    bg-gradient-to-b
                    from-black/60
                    to-transparent
                  "
                >
                  {/* COUNTER */}
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      bg-[#1A0A08]/85
                      border border-[#C9A87C]/15
                      px-3.5
                      py-1.5
                      shadow-lg
                      backdrop-blur-md
                    "
                  >
                    <Images
                      size={15}
                      className="text-[#C9A87C]"
                      strokeWidth={2}
                    />

                    <span
                      className="
                        font-serif
                        text-xs
                        font-semibold
                        text-[#C9A87C]
                      "
                    >
                      {lightboxRawIndex + 1}
                      {" / "}
                      {photo.raw_photos.length}
                    </span>
                  </div>

                  {/* CLOSE */}
                  <button
                    onClick={() =>
                      setLightboxRawOpen(false)
                    }
                    aria-label="Tutup foto"
                    className="
                      flex
                      h-10 w-10
                      items-center justify-center
                      rounded-full
                      bg-[#1A0A08]/85
                      border border-[#C9A87C]/15
                      text-[#C9A87C]
                      shadow-lg
                      backdrop-blur-md
                      transition-all
                      hover:bg-[#4A2A20]
                      hover:rotate-90
                    "
                  >
                    <X
                      size={20}
                      strokeWidth={2.3}
                    />
                  </button>
                </div>

                {/* ================================================
                    IMAGE
                ================================================= */}
                {photo.raw_photos[
                  lightboxRawIndex
                ] && (
                  <img
                    src={
                      photo.raw_photos[
                        lightboxRawIndex
                      ]
                    }
                    alt={`Foto asli #${
                      lightboxRawIndex + 1
                    }`}
                    className="
                      max-h-[calc(100vh-150px)]
                      max-w-[calc(100vw-120px)]
                      w-auto
                      h-auto
                      object-contain
                      rounded-2xl
                      shadow-[0_25px_80px_rgba(0,0,0,0.65)]
                      select-none
                    "
                    draggable={false}
                  />
                )}

                {/* ================================================
                    LEFT NAV
                ================================================= */}
                {photo.raw_photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setLightboxRawIndex(
                          (prev) =>
                            prev > 0
                              ? prev - 1
                              : photo
                                  .raw_photos
                                  .length - 1
                        );
                      }}
                      aria-label="Foto sebelumnya"
                      className="
                        absolute
                        left-3 sm:left-6
                        top-1/2
                        -translate-y-1/2
                        z-20
                        flex
                        h-11 w-11
                        sm:h-12 sm:w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-[#1A0A08]/85
                        border border-[#C9A87C]/15
                        text-[#C9A87C]
                        shadow-xl
                        backdrop-blur-md
                        transition-all
                        hover:bg-[#4A2A20]
                        hover:scale-105
                      "
                    >
                      <ChevronLeft
                        size={25}
                        strokeWidth={2.3}
                      />
                    </button>

                    {/* RIGHT NAV */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setLightboxRawIndex(
                          (prev) =>
                            prev <
                            photo.raw_photos
                              .length -
                              1
                              ? prev + 1
                              : 0
                        );
                      }}
                      aria-label="Foto berikutnya"
                      className="
                        absolute
                        right-3 sm:right-6
                        top-1/2
                        -translate-y-1/2
                        z-20
                        flex
                        h-11 w-11
                        sm:h-12 sm:w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-[#1A0A08]/85
                        border border-[#C9A87C]/15
                        text-[#C9A87C]
                        shadow-xl
                        backdrop-blur-md
                        transition-all
                        hover:bg-[#4A2A20]
                        hover:scale-105
                      "
                    >
                      <ChevronRight
                        size={25}
                        strokeWidth={2.3}
                      />
                    </button>
                  </>
                )}

                {/* ================================================
                    BOTTOM BAR
                ================================================= */}
                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    z-30
                    flex
                    flex-col
                    items-center
                    gap-3
                    px-4
                    pb-5 sm:pb-6
                    pt-10
                    bg-gradient-to-t
                    from-black/70
                    to-transparent
                  "
                >
                  {/* DOTS */}
                  {photo.raw_photos.length > 1 && (
                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                        rounded-full
                        bg-[#1A0A08]/75
                        border border-[#C9A87C]/10
                        px-3
                        py-2
                        backdrop-blur-md
                      "
                    >
                      {photo.raw_photos.map(
                        (_, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();

                              setLightboxRawIndex(
                                i
                              );
                            }}
                            aria-label={`Lihat foto ${
                              i + 1
                            }`}
                            className={`
                              h-1.5
                              rounded-full
                              transition-all
                              ${
                                i ===
                                lightboxRawIndex
                                  ? "w-7 bg-[#C9A87C]"
                                  : "w-1.5 bg-[#C9A87C]/30"
                              }
                            `}
                          />
                        )
                      )}
                    </div>
                  )}

                  {/* DOWNLOAD */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      const url =
                        photo.raw_photos?.[
                          lightboxRawIndex
                        ];

                      if (url) {
                        handleDownloadRaw(
                          url,
                          lightboxRawIndex
                        );
                      }
                    }}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-[#C9A87C]
                      px-5
                      py-2.5
                      font-serif
                      text-sm
                      font-bold
                      text-[#2A1510]
                      shadow-xl
                      transition-all
                      hover:bg-[#DFC397]
                      hover:-translate-y-0.5
                    "
                  >
                    <Download
                      size={17}
                      strokeWidth={2.4}
                    />

                    Download Foto
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* ============================================================
          DELETE CONFIRMATION
      ============================================================ */}
      <ConfirmModal
        open={confirmDelete}
        title="Hapus foto ini?"
        description="Foto akan dihapus permanen dari server dan tidak bisa dikembalikan."
        confirmLabel="Ya, hapus"
        danger
        onCancel={() =>
          setConfirmDelete(false)
        }
        onConfirm={() => {
          if (photo) {
            onDelete(photo);
          }

          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}