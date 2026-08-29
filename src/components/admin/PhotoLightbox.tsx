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
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxRawOpen) {
          setLightboxRawOpen(false);
        } else if (confirmDelete) {
          setConfirmDelete(false);
        } else {
          onClose();
        }
      }

      if (
        lightboxRawOpen &&
        photo.raw_photos &&
        photo.raw_photos.length > 1
      ) {
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
  }, [photo, lightboxRawOpen, confirmDelete, onClose]);

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

      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

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

      if (!response.ok) {
        throw new Error("Gagal mengambil gambar");
      }

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
    } catch (error) {
      console.error("Download error:", error);
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

    if (!el || !photo || !photo.raw_photos?.length) {
      return;
    }

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

    if (!el || !photo || !photo.raw_photos?.length) {
      return;
    }

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
  // OPEN RAW PHOTO LIGHTBOX
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
            transition={{ duration: 0.2 }}
            className="
              fixed inset-0
              z-50
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
                scale: 0.94,
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

                /* MODAL TIDAK FULL WIDTH */
                w-fit
                max-w-[calc(100vw-24px)]
                sm:max-w-[calc(100vw-40px)]

                /* MODAL TIDAK FULL HEIGHT */
                max-h-[calc(100vh-24px)]
                sm:max-h-[calc(100vh-40px)]

                flex
                flex-col

                overflow-hidden

                rounded-2xl

                bg-[#1A0A08]

                border
                border-[#4A2A20]

                shadow-[0_25px_80px_rgba(0,0,0,0.65)]
              "
            >
              {/* =====================================================
                  HEADER
              ===================================================== */}
              <div
                className="
                  flex
                  shrink-0
                  items-center
                  justify-between

                  bg-[#2A1510]

                  px-3
                  sm:px-4
                  md:px-5

                  py-2.5
                  sm:py-3

                  border-b
                  border-[#4A2A20]
                "
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className="
                      font-serif
                      text-[10px]
                      sm:text-xs
                      font-medium
                      text-[#C9A87C]
                    "
                  >
                    #{currentIndex + 1} / {totalPhotos}
                  </span>

                  <span className="h-4 w-px bg-[#4A2A20]" />

                  <span
                    className={`
                      rounded-full
                      px-2.5
                      sm:px-3
                      py-0.5

                      font-serif
                      text-[10px]
                      sm:text-xs
                      font-semibold

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

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {onDownload && (
                    <button
                      onClick={() => onDownload(photo)}
                      className="
                        flex
                        items-center
                        gap-1.5
                        sm:gap-2

                        rounded-lg

                        bg-[#4A2A20]

                        px-2.5
                        sm:px-3.5

                        py-1
                        sm:py-1.5

                        font-serif
                        text-[10px]
                        sm:text-xs
                        font-medium

                        text-[#C9A87C]

                        transition-colors

                        hover:bg-[#5A3A30]
                      "
                    >
                      <Download
                        size={14}
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
                      h-7
                      w-7
                      sm:h-8
                      sm:w-8

                      items-center
                      justify-center

                      rounded-lg

                      bg-[#4A2A20]

                      text-[#C9A87C]

                      transition-colors

                      hover:bg-[#5A3A30]
                    "
                  >
                    <X
                      size={16}
                      strokeWidth={2.4}
                    />
                  </button>
                </div>
              </div>

              {/* =====================================================
                  BODY
                  NO SCROLL
              ===================================================== */}
              <div
                className="
                  flex
                  min-w-0
                  min-h-0

                  flex-1

                  overflow-hidden

                  flex-col
                  lg:flex-row

                  items-stretch
                "
              >
                {/* =====================================================
                    KIRI — FRAME
                    WIDTH MENGIKUTI FRAME
                ===================================================== */}
                <div
                  className="
                    relative

                    flex
                    shrink-0

                    items-center
                    justify-center

                    bg-[#0D0503]

                    overflow-hidden

                    p-3
                    sm:p-4
                    md:p-5

                    /* DESKTOP:
                       area kiri dibuat compact */
                    lg:w-auto
                    lg:min-w-[300px]
                    xl:min-w-[340px]
                  "
                >
                  <img
                    src={photo.image_result}
                    alt="Hasil foto"
                    className="
                      block

                      w-auto
                      h-auto

                      max-h-[58vh]
                      sm:max-h-[62vh]
                      lg:max-h-[68vh]

                      max-w-[calc(100vw-40px)]
                      lg:max-w-[380px]

                      object-contain

                      rounded-lg

                      shadow-[0_18px_45px_rgba(0,0,0,0.65)]
                    "
                    style={{
                      background: "transparent",
                    }}
                  />

                  {/* MAIN PHOTO NAVIGATION */}
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
                          left-2
                          sm:left-3

                          top-1/2
                          -translate-y-1/2

                          z-20

                          flex
                          h-8
                          w-8
                          sm:h-9
                          sm:w-9
                          md:h-10
                          md:w-10

                          items-center
                          justify-center

                          rounded-full

                          bg-[#2A1510]/90

                          text-[#C9A87C]

                          shadow-lg
                          backdrop-blur-sm

                          transition-all

                          hover:bg-[#4A2A20]
                        "
                      >
                        <ChevronLeft
                          size={21}
                          strokeWidth={2.5}
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
                          right-2
                          sm:right-3

                          top-1/2
                          -translate-y-1/2

                          z-20

                          flex
                          h-8
                          w-8
                          sm:h-9
                          sm:w-9
                          md:h-10
                          md:w-10

                          items-center
                          justify-center

                          rounded-full

                          bg-[#2A1510]/90

                          text-[#C9A87C]

                          shadow-lg
                          backdrop-blur-sm

                          transition-all

                          hover:bg-[#4A2A20]
                        "
                      >
                        <ChevronRight
                          size={21}
                          strokeWidth={2.5}
                        />
                      </button>
                    </>
                  )}
                </div>

                {/* =====================================================
                    KANAN — INFO
                ===================================================== */}
                <div
                  className="
                    w-full

                    lg:w-[350px]
                    xl:w-[370px]

                    shrink-0

                    min-h-0

                    border-t
                    lg:border-t-0
                    lg:border-l

                    border-[#4A2A20]

                    bg-[#150907]

                    p-3
                    sm:p-4
                    md:p-5

                    flex
                    flex-col

                    overflow-hidden
                  "
                >
                  {/* FRAME NAME */}
                  <div className="shrink-0 mb-1.5 sm:mb-2">
                    <p
                      className="
                        font-serif

                        text-lg
                        sm:text-xl

                        font-bold

                        text-[#F5EBE0]

                        truncate
                      "
                    >
                      {photo.frame_nama ?? "Frame"}
                    </p>
                  </div>

                  {/* INFO */}
                  <div
                    className="
                      shrink-0

                      space-y-1.5
                      sm:space-y-2

                      mb-2
                      sm:mb-3
                    "
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock3
                        size={16}
                        className="
                          shrink-0
                          text-[#C9A87C]/60
                        "
                        strokeWidth={2}
                      />

                      <span
                        className="
                          font-serif
                          text-xs
                          sm:text-sm

                          text-[#C9A87C]/80

                          truncate
                        "
                      >
                        {formatTime(photo.created_at)}
                      </span>
                    </div>

                    {photo.whatsapp_number && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MessageCircle
                          size={16}
                          className="
                            shrink-0
                            text-[#C9A87C]/60
                          "
                          strokeWidth={2}
                        />

                        <span
                          className="
                            font-serif
                            text-xs
                            sm:text-sm

                            text-[#C9A87C]/80

                            truncate
                          "
                        >
                          {photo.whatsapp_number}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DIVIDER */}
                  <div
                    className="
                      h-px
                      w-full
                      shrink-0

                      bg-[#4A2A20]

                      mb-2
                      sm:mb-3
                    "
                  />

                  {/* =====================================================
                      RAW PHOTOS
                  ===================================================== */}
                  {hasRaw && (
                    <div
                      className="
                        flex
                        flex-col

                        min-h-0
                        shrink-0
                      "
                    >
                      {/* TITLE */}
                      <div
                        className="
                          flex
                          items-center
                          justify-between

                          mb-1.5
                          sm:mb-2
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            sm:gap-2

                            text-[#C9A87C]
                          "
                        >
                          <Images
                            size={14}
                            strokeWidth={2.2}
                          />

                          <p
                            className="
                              font-serif
                              text-[10px]
                              sm:text-xs

                              font-semibold

                              uppercase
                              tracking-wide
                            "
                          >
                            Foto Asli
                          </p>
                        </div>

                        {photo.raw_photos.length > 1 && (
                          <span
                            className="
                              font-serif

                              text-[10px]
                              sm:text-[11px]

                              font-semibold

                              text-[#C9A87C]/50
                            "
                          >
                            {rawActiveIndex + 1} /{" "}
                            {photo.raw_photos.length}
                          </span>
                        )}
                      </div>

                      {/* SLIDER */}
                      <div
                        className="
                          relative

                          h-[155px]
                          sm:h-[175px]
                          md:h-[185px]

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
                            overflow-y-hidden

                            rounded-xl

                            border
                            border-[#C9A87C]/25

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

                                  p-2
                                  sm:p-3

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

                                    rounded-lg
                                  "
                                  draggable={false}
                                />

                                {/* EYE OVERLAY */}
                                <div
                                  className="
                                    absolute
                                    inset-0

                                    flex
                                    items-center
                                    justify-center

                                    rounded-lg

                                    bg-black/0

                                    group-hover:bg-black/40

                                    transition-all
                                    duration-300
                                  "
                                >
                                  <div
                                    className="
                                      opacity-0

                                      group-hover:opacity-100

                                      scale-75

                                      group-hover:scale-100

                                      transition-all
                                      duration-300
                                    "
                                  >
                                    <div
                                      className="
                                        rounded-full

                                        bg-[#2A1510]/85

                                        p-2.5
                                        sm:p-3

                                        backdrop-blur-sm

                                        ring-1
                                        ring-[#C9A87C]/30
                                      "
                                    >
                                      <Eye
                                        size={24}
                                        className="text-[#C9A87C]"
                                        strokeWidth={1.8}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {/* RAW PREVIOUS */}
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
                              aria-label="Foto asli sebelumnya"
                              className="
                                absolute
                                left-1
                                sm:left-2

                                top-1/2
                                -translate-y-1/2

                                z-10

                                flex
                                h-7
                                w-7
                                sm:h-8
                                sm:w-8

                                items-center
                                justify-center

                                rounded-full

                                bg-[#2A1510]/90

                                text-[#C9A87C]

                                shadow-md

                                backdrop-blur-sm

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

                            {/* RAW NEXT */}
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
                              aria-label="Foto asli berikutnya"
                              className="
                                absolute
                                right-1
                                sm:right-2

                                top-1/2
                                -translate-y-1/2

                                z-10

                                flex
                                h-7
                                w-7
                                sm:h-8
                                sm:w-8

                                items-center
                                justify-center

                                rounded-full

                                bg-[#2A1510]/90

                                text-[#C9A87C]

                                shadow-md

                                backdrop-blur-sm

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
                          </>
                        )}
                      </div>

                      {/* DOTS */}
                      {photo.raw_photos.length > 1 && (
                        <div
                          className="
                            mt-2

                            flex
                            items-center
                            justify-center

                            gap-1.5
                          "
                        >
                          {photo.raw_photos.map(
                            (_, i) => (
                              <button
                                key={i}
                                onClick={() =>
                                  scrollRawToIndex(i)
                                }
                                aria-label={`Lihat foto asli ${
                                  i + 1
                                }`}
                                className={`
                                  h-1.5

                                  rounded-full

                                  transition-all

                                  ${
                                    i === rawActiveIndex
                                      ? "w-5 bg-[#C9A87C]"
                                      : "w-1.5 bg-[#C9A87C]/30"
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

                          text-[8px]
                          sm:text-[10px]

                          text-[#C9A87C]/40
                        "
                      >
                        Klik foto untuk melihat lebih besar
                      </p>
                    </div>
                  )}

                  {/* =====================================================
                      ACTIONS
                  ===================================================== */}
                  <div
                    className="
                      mt-2
                      sm:mt-3

                      pt-2
                      sm:pt-3

                      border-t
                      border-[#4A2A20]

                      shrink-0

                      space-y-2
                    "
                  >
                    {/* WHATSAPP */}
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

                          font-semibold

                          text-[#F5EBE0]

                          shadow-md

                          transition-all

                          hover:shadow-lg

                          disabled:opacity-60
                        "
                      >
                        {sending ? (
                          <>
                            <span
                              className="
                                h-3.5
                                w-3.5
                                sm:h-4
                                sm:w-4

                                animate-spin

                                rounded-full

                                border-2
                                border-[#F5EBE0]

                                border-t-transparent
                              "
                            />

                            <span className="text-xs sm:text-sm">
                              Membuka...
                            </span>
                          </>
                        ) : (
                          <>
                            <MessageCircle
                              size={18}
                              strokeWidth={2.3}
                            />

                            <span className="text-xs sm:text-sm">
                              Kirim WhatsApp
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    {/* PRINT + DELETE */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onPrint(photo);

                          if (
                            photo.status !== "printed"
                          ) {
                            onMarkPrinted(photo);
                          }
                        }}
                        className="
                          flex
                          items-center
                          justify-center

                          gap-1.5
                          sm:gap-2

                          rounded-xl

                          bg-[#2A1510]

                          py-2
                          sm:py-2.5

                          font-serif

                          text-xs
                          sm:text-sm

                          font-medium

                          text-[#C9A87C]

                          border
                          border-[#4A2A20]

                          transition-all

                          hover:border-[#6B2D2C]
                        "
                      >
                        <Printer
                          size={16}
                          strokeWidth={2.3}
                        />

                        Print
                      </button>

                      <button
                        onClick={() =>
                          setConfirmDelete(true)
                        }
                        className="
                          flex
                          items-center
                          justify-center

                          gap-1.5
                          sm:gap-2

                          rounded-xl

                          bg-[#2A1510]

                          py-2
                          sm:py-2.5

                          font-serif

                          text-xs
                          sm:text-sm

                          font-medium

                          text-[#A0524A]

                          border
                          border-[#4A2A20]

                          transition-all

                          hover:border-[#A0524A]
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
          RAW PHOTO LIGHTBOX
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
              className="
                fixed
                inset-0
                z-[60]

                flex
                items-center
                justify-center

                bg-black/90
                backdrop-blur-md

                p-4
                sm:p-6

                overflow-hidden
              "
              onClick={() =>
                setLightboxRawOpen(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.92,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
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
                  items-center
                  justify-center

                  w-fit

                  max-w-[calc(100vw-32px)]
                  sm:max-w-[calc(100vw-80px)]

                  max-h-[calc(100vh-32px)]
                  sm:max-h-[calc(100vh-80px)]

                  rounded-2xl

                  bg-[#120604]/80

                  border
                  border-[#4A2A20]

                  p-2
                  sm:p-4

                  shadow-[0_30px_100px_rgba(0,0,0,0.8)]
                "
              >
                {/* CLOSE */}
                <button
                  onClick={() =>
                    setLightboxRawOpen(false)
                  }
                  aria-label="Tutup foto"
                  className="
                    absolute

                    top-2
                    right-2
                    sm:top-3
                    sm:right-3

                    z-30

                    flex

                    h-8
                    w-8
                    sm:h-9
                    sm:w-9

                    items-center
                    justify-center

                    rounded-full

                    bg-[#2A1510]/90

                    text-[#C9A87C]

                    backdrop-blur-sm

                    transition-all

                    hover:bg-[#4A2A20]
                  "
                >
                  <X
                    size={20}
                    strokeWidth={2.4}
                  />
                </button>

                {/* COUNTER */}
                <div
                  className="
                    absolute

                    top-2
                    left-2
                    sm:top-3
                    sm:left-3

                    z-30
                  "
                >
                  <span
                    className="
                      rounded-full

                      bg-[#2A1510]/90

                      px-3
                      py-1.5

                      font-serif

                      text-[10px]
                      sm:text-xs

                      font-medium

                      text-[#C9A87C]

                      backdrop-blur-sm
                    "
                  >
                    {lightboxRawIndex + 1} /{" "}
                    {photo.raw_photos.length}
                  </span>
                </div>

                {/* IMAGE */}
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

                    w-auto
                    h-auto

                    max-h-[calc(100vh-100px)]

                    max-w-[calc(100vw-70px)]
                    sm:max-w-[calc(100vw-140px)]

                    object-contain

                    rounded-lg

                    shadow-2xl
                  "
                  draggable={false}
                />

                {/* PREVIOUS */}
                {photo.raw_photos.length > 1 && (
                  <>
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

                        left-1
                        sm:left-3

                        top-1/2
                        -translate-y-1/2

                        z-20

                        flex

                        h-9
                        w-9
                        sm:h-11
                        sm:w-11

                        items-center
                        justify-center

                        rounded-full

                        bg-[#2A1510]/90

                        text-[#C9A87C]

                        backdrop-blur-sm

                        transition-all

                        hover:bg-[#4A2A20]
                      "
                    >
                      <ChevronLeft
                        size={24}
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* NEXT */}
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

                        right-1
                        sm:right-3

                        top-1/2
                        -translate-y-1/2

                        z-20

                        flex

                        h-9
                        w-9
                        sm:h-11
                        sm:w-11

                        items-center
                        justify-center

                        rounded-full

                        bg-[#2A1510]/90

                        text-[#C9A87C]

                        backdrop-blur-sm

                        transition-all

                        hover:bg-[#4A2A20]
                      "
                    >
                      <ChevronRight
                        size={24}
                        strokeWidth={2.5}
                      />
                    </button>
                  </>
                )}

                {/* DOWNLOAD */}
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
                    absolute

                    bottom-3
                    sm:bottom-4

                    right-3
                    sm:right-4

                    z-30

                    flex
                    items-center

                    gap-1.5
                    sm:gap-2

                    rounded-xl

                    bg-[#2A1510]/95

                    px-3
                    sm:px-4

                    py-2
                    sm:py-2.5

                    text-[#C9A87C]

                    border
                    border-[#4A2A20]

                    backdrop-blur-sm

                    transition-all

                    hover:bg-[#4A2A20]
                  "
                >
                  <Download
                    size={17}
                    strokeWidth={2.3}
                  />

                  <span
                    className="
                      font-serif
                      text-xs
                      sm:text-sm
                      font-medium
                    "
                  >
                    Download
                  </span>
                </button>

                {/* DOTS */}
                {photo.raw_photos.length > 1 && (
                  <div
                    className="
                      absolute

                      bottom-4
                      sm:bottom-5

                      left-1/2

                      -translate-x-1/2

                      z-30

                      flex
                      items-center

                      gap-1.5
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
                                ? "w-6 bg-[#C9A87C]"
                                : "w-1.5 bg-[#C9A87C]/30"
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