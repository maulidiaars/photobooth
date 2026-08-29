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
}: PhotoLightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);

  const [rawActiveIndex, setRawActiveIndex] = useState(0);

  const [lightboxRawOpen, setLightboxRawOpen] = useState(false);
  const [lightboxRawIndex, setLightboxRawIndex] = useState(0);

  const rawScrollerRef = useRef<HTMLDivElement>(null);

  const toast = useToast();

  // ============================================
  // RESET RAW PHOTO SLIDER
  // ============================================
  useEffect(() => {
    setRawActiveIndex(0);

    requestAnimationFrame(() => {
      rawScrollerRef.current?.scrollTo({
        left: 0,
        behavior: "auto",
      });
    });
  }, [photo?.id]);

  // ============================================
  // ESCAPE KEY
  // ============================================
  useEffect(() => {
    if (!photo && !lightboxRawOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxRawOpen) {
          setLightboxRawOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo, lightboxRawOpen, onClose]);

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
          `Semoga harimu menyenangkan, sampai jumpa lagi! 👋\n\n` +
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
  // DOWNLOAD RAW PHOTO
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
  // RAW PHOTO SCROLL
  // ============================================
  const handleRawScroll = () => {
    const el = rawScrollerRef.current;

    if (!el || !photo) return;

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

    if (!el || !photo) return;

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
  // OPEN RAW PHOTO MODAL
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
      {/* =====================================================
          MAIN PHOTO MODAL
      ===================================================== */}
      <AnimatePresence>
        {photo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/75 backdrop-blur-md
              p-2 sm:p-4
              overflow-hidden
            "
            onClick={onClose}
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 10,
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
                stiffness: 320,
                damping: 28,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                flex flex-col
                w-full
                lg:w-[92vw]
                xl:w-[88vw]
                max-w-[1040px]
                max-h-[95vh]
                sm:max-h-[92vh]
                overflow-hidden
                rounded-[20px]
                bg-[#120604]
                border border-[#4A2A20]
                shadow-[0_30px_80px_rgba(0,0,0,0.65)]
              "
            >
              {/* =================================================
                  HEADER
              ================================================= */}
              <div
                className="
                  flex shrink-0
                  items-center justify-between
                  gap-2
                  min-h-[58px]
                  sm:min-h-[64px]
                  px-3 sm:px-5
                  bg-[#2A1510]
                  border-b border-[#4A2A20]
                "
              >
                {/* LEFT — STATUS */}
                <div className="flex items-center min-w-0">
                  <span
                    className={`
                      inline-flex items-center
                      rounded-full
                      px-3 sm:px-4
                      py-1.5
                      font-serif
                      text-[10px] sm:text-xs
                      font-bold
                      tracking-wide
                      whitespace-nowrap
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

                {/* RIGHT — DOWNLOAD + CLOSE */}
                <div className="flex items-center gap-2 shrink-0">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(photo)}
                      className="
                        flex items-center justify-center
                        gap-2
                        rounded-xl
                        bg-[#4A2A20]
                        px-3 sm:px-4
                        py-2
                        font-serif
                        text-xs sm:text-sm
                        font-medium
                        text-[#C9A87C]
                        transition-all
                        hover:bg-[#5A3A30]
                        active:scale-95
                      "
                    >
                      <Download
                        size={16}
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
                      sm:h-10 sm:w-10
                      items-center justify-center
                      rounded-xl
                      bg-[#4A2A20]
                      text-[#C9A87C]
                      transition-all
                      hover:bg-[#5A3A30]
                      active:scale-95
                      shrink-0
                    "
                  >
                    <X
                      size={19}
                      strokeWidth={2.3}
                    />
                  </button>
                </div>
              </div>

              {/* =================================================
                  CONTENT
                  DESKTOP = 2 COLUMN
                  MOBILE / TABLET = STACK (scrollable)
              ================================================= */}
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
                    LEFT — FRAME
                ================================================= */}
                <div
                  className="
                    relative
                    flex
                    min-h-0
                    shrink-0
                    lg:flex-[0_0_54%]
                    lg:shrink
                    items-center
                    justify-center
                    overflow-hidden
                    bg-[#0D0503]
                    p-3
                    sm:p-5
                    lg:p-7
                  "
                >
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    className="
                      block
                      w-auto
                      h-auto
                      max-w-full
                      max-h-[30vh]
                      sm:max-h-[36vh]
                      md:max-h-[42vh]
                      lg:max-h-[68vh]
                      object-contain
                      rounded-lg
                      shadow-[0_18px_45px_rgba(0,0,0,0.55)]
                    "
                    draggable={false}
                  />
                </div>

                {/* =================================================
                    RIGHT — INFORMATION
                    (scrollable content + sticky action footer,
                    so nothing ever gets cut off on short screens)
                ================================================= */}
                <div
                  className="
                    min-w-0
                    min-h-0
                    flex-1
                    lg:flex-[0_0_46%]
                    bg-[#150907]
                    border-t
                    lg:border-t-0
                    lg:border-l
                    border-[#4A2A20]
                    flex
                    flex-col
                    overflow-hidden
                  "
                >
                  {/* SCROLLABLE INFO AREA */}
                  <div
                    className="
                      min-h-0
                      flex-1
                      overflow-y-auto
                      p-4
                      sm:p-5
                      lg:p-6
                    "
                  >
                    {/* FRAME NAME */}
                    <div className="mb-3">
                      <h2
                        className="
                          font-serif
                          text-xl
                          sm:text-2xl
                          lg:text-[28px]
                          leading-tight
                          font-bold
                          text-[#F5EBE0]
                          break-words
                        "
                      >
                        {photo.frame_nama ?? "Frame"}
                      </h2>
                    </div>

                    {/* INFO */}
                    <div
                      className="
                        space-y-2
                        sm:space-y-2.5
                        mb-3
                      "
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock3
                          size={17}
                          className="shrink-0 text-[#C9A87C]/70"
                          strokeWidth={2}
                        />

                        <span
                          className="
                            font-serif
                            text-xs sm:text-sm
                            text-[#C9A87C]/85
                            break-words
                          "
                        >
                          {formatTime(photo.created_at)}
                        </span>
                      </div>

                      {photo.whatsapp_number && (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageCircle
                            size={17}
                            className="shrink-0 text-[#C9A87C]/70"
                            strokeWidth={2}
                          />

                          <span
                            className="
                              font-serif
                              text-xs sm:text-sm
                              text-[#C9A87C]/85
                              break-words
                            "
                          >
                            {photo.whatsapp_number}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DIVIDER */}
                    <div className="h-px bg-[#4A2A20] mb-3" />

                    {/* =================================================
                        RAW PHOTOS
                    ================================================= */}
                    {hasRaw && (
                      <div className="flex flex-col">
                        {/* TITLE */}
                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            mb-2
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                              text-[#C9A87C]
                            "
                          >
                            <Images
                              size={15}
                              strokeWidth={2.2}
                            />

                            <span
                              className="
                                font-serif
                                text-[10px]
                                sm:text-xs
                                font-bold
                                uppercase
                                tracking-wider
                              "
                            >
                              Foto Asli
                            </span>
                          </div>

                          <span
                            className="
                              font-serif
                              text-[10px]
                              sm:text-xs
                              font-semibold
                              text-[#C9A87C]/55
                            "
                          >
                            {rawActiveIndex + 1} /{" "}
                            {photo.raw_photos.length}
                          </span>
                        </div>

                        {/* RAW SLIDER */}
                        <div
                          className="
                            relative
                            w-full
                            h-[38vw]
                            min-h-[120px]
                            max-h-[145px]
                            sm:h-[165px]
                            md:h-[180px]
                            lg:h-[190px]
                            shrink-0
                          "
                        >
                          <div
                            ref={rawScrollerRef}
                            onScroll={handleRawScroll}
                            className="
                              no-scrollbar
                              flex
                              w-full
                              h-full
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
                                    w-full
                                    h-full
                                    shrink-0
                                    snap-center
                                    flex
                                    items-center
                                    justify-center
                                    p-2 sm:p-3
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
                                      w-full
                                      h-full
                                      object-contain
                                      rounded-xl
                                    "
                                    draggable={false}
                                  />

                                  {/* HOVER */}
                                  <div
                                    className="
                                      absolute
                                      inset-2 sm:inset-3
                                      flex
                                      items-center
                                      justify-center
                                      rounded-xl
                                      bg-black/0
                                      group-hover:bg-black/35
                                      transition-all
                                      duration-300
                                    "
                                  >
                                    <div
                                      className="
                                        opacity-0
                                        scale-75
                                        group-hover:opacity-100
                                        group-hover:scale-100
                                        transition-all
                                        duration-300
                                        rounded-full
                                        bg-[#21100C]/90
                                        p-3
                                        border
                                        border-[#C9A87C]/25
                                        shadow-xl
                                      "
                                    >
                                      <Eye
                                        size={22}
                                        className="text-[#C9A87C]"
                                        strokeWidth={1.8}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* LEFT */}
                          {photo.raw_photos.length >
                            1 && (
                            <button
                              onClick={() =>
                                scrollRawToIndex(
                                  rawActiveIndex - 1
                                )
                              }
                              disabled={
                                rawActiveIndex === 0
                              }
                              aria-label="Foto sebelumnya"
                              className="
                                absolute
                                left-2
                                top-1/2
                                -translate-y-1/2
                                flex
                                h-8 w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-[#21100C]/90
                                text-[#C9A87C]
                                shadow-lg
                                transition-all
                                hover:bg-[#3A2018]
                                disabled:opacity-0
                              "
                            >
                              <ChevronLeft
                                size={18}
                                strokeWidth={2.4}
                              />
                            </button>
                          )}

                          {/* RIGHT */}
                          {photo.raw_photos.length >
                            1 && (
                            <button
                              onClick={() =>
                                scrollRawToIndex(
                                  rawActiveIndex + 1
                                )
                              }
                              disabled={
                                rawActiveIndex ===
                                photo.raw_photos.length - 1
                              }
                              aria-label="Foto berikutnya"
                              className="
                                absolute
                                right-2
                                top-1/2
                                -translate-y-1/2
                                flex
                                h-8 w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-[#21100C]/90
                                text-[#C9A87C]
                                shadow-lg
                                transition-all
                                hover:bg-[#3A2018]
                                disabled:opacity-0
                              "
                            >
                              <ChevronRight
                                size={18}
                                strokeWidth={2.4}
                              />
                            </button>
                          )}
                        </div>

                        {/* DOTS */}
                        {photo.raw_photos.length >
                          1 && (
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              flex-wrap
                              gap-1.5
                              mt-2
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
                                      i ===
                                      rawActiveIndex
                                        ? "w-5 bg-[#C9A87C]"
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
                            mt-1.5
                            text-center
                            font-serif
                            text-[9px]
                            sm:text-[10px]
                            text-[#C9A87C]/40
                          "
                        >
                          Klik foto untuk melihat lebih besar
                        </p>
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      ACTIONS — sticky footer, always visible,
                      never scrolls away / gets cut off
                  ================================================= */}
                  <div
                    className="
                      shrink-0
                      border-t border-[#4A2A20]
                      p-4
                      sm:p-5
                      lg:p-6
                      pt-3
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
                          sm:py-3
                          font-serif
                          text-sm
                          sm:text-base
                          font-semibold
                          text-[#F5EBE0]
                          shadow-lg
                          transition-all
                          hover:bg-[#793532]
                          hover:shadow-xl
                          active:scale-[0.99]
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
                              size={19}
                              strokeWidth={2.3}
                            />

                            <span>
                              Kirim WhatsApp
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    <div
                      className={`
                        grid
                        grid-cols-2
                        gap-2
                        ${
                          photo.whatsapp_number
                            ? "mt-2"
                            : ""
                        }
                      `}
                    >
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
                          bg-[#21100C]
                          border border-[#4A2A20]
                          py-2.5
                          font-serif
                          text-xs sm:text-sm
                          font-medium
                          text-[#C9A87C]
                          transition-all
                          hover:border-[#6B2D2C]
                          hover:bg-[#2A1510]
                          active:scale-[0.99]
                        "
                      >
                        <Printer
                          size={17}
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
                          bg-[#21100C]
                          border border-[#4A2A20]
                          py-2.5
                          font-serif
                          text-xs sm:text-sm
                          font-medium
                          text-[#A0524A]
                          transition-all
                          hover:border-[#A0524A]
                          hover:bg-[#2A1510]
                          active:scale-[0.99]
                        "
                      >
                        <Trash2
                          size={17}
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

      {/* =========================================================
          RAW PHOTO VIEWER
      ========================================================= */}
      <AnimatePresence>
        {lightboxRawOpen &&
          photo &&
          photo.raw_photos &&
          photo.raw_photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="
                fixed
                inset-0
                z-[60]
                flex
                items-center
                justify-center
                bg-black/80
                backdrop-blur-md
                p-3
                sm:p-5
              "
              onClick={() =>
                setLightboxRawOpen(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: 8,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="
                  relative
                  flex
                  flex-col
                  w-full
                  max-w-[900px]
                  max-h-[92vh]
                  overflow-hidden
                  rounded-[20px]
                  bg-[#120604]
                  border border-[#4A2A20]
                  shadow-[0_30px_90px_rgba(0,0,0,0.7)]
                "
              >
                {/* RAW HEADER */}
                <div
                  className="
                    flex
                    shrink-0
                    flex-wrap
                    items-center
                    justify-between
                    gap-2
                    px-3
                    sm:px-4
                    py-2.5
                    sm:py-3
                    bg-[#2A1510]
                    border-b border-[#4A2A20]
                  "
                >
                  {/* COUNTER */}
                  <div
                    className="
                      rounded-full
                      bg-[#21100C]
                      border border-[#C9A87C]/15
                      px-3
                      py-1
                      shrink-0
                    "
                  >
                    <span
                      className="
                        font-serif
                        text-[10px]
                        sm:text-xs
                        font-semibold
                        text-[#C9A87C]
                        whitespace-nowrap
                      "
                    >
                      Foto {lightboxRawIndex + 1}{" "}
                      dari {photo.raw_photos.length}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
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
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#21100C]
                        border border-[#4A2A20]
                        px-3
                        sm:px-4
                        py-2
                        font-serif
                        text-xs
                        sm:text-sm
                        font-medium
                        text-[#C9A87C]
                        transition-all
                        hover:bg-[#3A2018]
                        active:scale-95
                      "
                    >
                      <Download
                        size={16}
                        strokeWidth={2.2}
                      />

                      <span className="hidden sm:inline">
                        Download
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        setLightboxRawOpen(false)
                      }
                      aria-label="Tutup foto"
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#21100C]
                        border border-[#4A2A20]
                        text-[#C9A87C]
                        transition-all
                        hover:bg-[#3A2018]
                        active:scale-95
                      "
                    >
                      <X
                        size={18}
                        strokeWidth={2.3}
                      />
                    </button>
                  </div>
                </div>

                {/* IMAGE AREA */}
                <div
                  className="
                    relative
                    flex
                    min-h-0
                    flex-1
                    items-center
                    justify-center
                    bg-[#080302]
                    p-3
                    sm:p-5
                    md:p-7
                    overflow-hidden
                  "
                >
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
                        block
                        max-w-full
                        max-h-[60vh]
                        sm:max-h-[68vh]
                        md:max-h-[72vh]
                        object-contain
                        rounded-xl
                        shadow-[0_20px_60px_rgba(0,0,0,0.65)]
                      "
                      draggable={false}
                    />
                  )}

                  {/* PREVIOUS */}
                  {photo.raw_photos.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setLightboxRawIndex(
                          (prev) =>
                            prev > 0
                              ? prev - 1
                              : photo.raw_photos.length -
                                1
                        );
                      }}
                      aria-label="Foto sebelumnya"
                      className="
                        absolute
                        left-2
                        sm:left-4
                        md:left-5
                        top-1/2
                        -translate-y-1/2
                        flex
                        h-9 w-9
                        sm:h-11 sm:w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-[#21100C]/95
                        border border-[#C9A87C]/15
                        text-[#C9A87C]
                        shadow-xl
                        transition-all
                        hover:bg-[#3A2018]
                        active:scale-95
                      "
                    >
                      <ChevronLeft
                        size={22}
                        strokeWidth={2.4}
                      />
                    </button>
                  )}

                  {/* NEXT */}
                  {photo.raw_photos.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setLightboxRawIndex(
                          (prev) =>
                            prev <
                            photo.raw_photos.length -
                              1
                              ? prev + 1
                              : 0
                        );
                      }}
                      aria-label="Foto berikutnya"
                      className="
                        absolute
                        right-2
                        sm:right-4
                        md:right-5
                        top-1/2
                        -translate-y-1/2
                        flex
                        h-9 w-9
                        sm:h-11 sm:w-11
                        items-center
                        justify-center
                        rounded-full
                        bg-[#21100C]/95
                        border border-[#C9A87C]/15
                        text-[#C9A87C]
                        shadow-xl
                        transition-all
                        hover:bg-[#3A2018]
                        active:scale-95
                      "
                    >
                      <ChevronRight
                        size={22}
                        strokeWidth={2.4}
                      />
                    </button>
                  )}
                </div>

                {/* RAW DOTS */}
                {photo.raw_photos.length > 1 && (
                  <div
                    className="
                      flex
                      shrink-0
                      flex-wrap
                      items-center
                      justify-center
                      gap-1.5
                      bg-[#120604]
                      px-4
                      py-2.5
                      border-t border-[#4A2A20]
                    "
                  >
                    {photo.raw_photos.map(
                      (_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxRawIndex(i);
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
                                : "w-1.5 bg-[#C9A87C]/25"
                            }
                          `}
                        />
                      )
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* =========================================================
          DELETE CONFIRMATION
      ========================================================= */}
      <ConfirmModal
        open={confirmDelete}
        title="Hapus foto ini?"
        description="Foto akan dihapus permanen dari server dan tidak bisa dikembalikan."
        confirmLabel="Ya, hapus"
        danger
        onCancel={() => setConfirmDelete(false)}
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