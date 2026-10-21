"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Grid3x3, Archive, ArchiveRestore } from "lucide-react";
import type { Frame } from "@/types/frame";
import { ConfirmModal } from "@/components/ui/Modal";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useFrameContentBox } from "@/hooks/useFrameContentBox";

interface FrameTableProps {
  frames: Frame[];
  onEdit: (frame: Frame) => void;
  onDelete: (frame: Frame) => void;
  /** Arsipkan frame aktif / aktifkan lagi frame yang diarsipkan. */
  onToggleArchive: (frame: Frame) => void;
  /** true kalau tab "Diarsipkan" yang sedang dibuka (cuma ngubah teks kosong). */
  archivedView?: boolean;
}

export function FrameTable({
  frames,
  onEdit,
  onDelete,
  onToggleArchive,
  archivedView = false,
}: FrameTableProps) {
  const [pendingDelete, setPendingDelete] =
    useState<Frame | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  /*
    Gallery frame admin sekarang punya scroll internal vertikal.

    Mouse:
      klik + drag ke bawah/atas

    Touch:
      swipe ke bawah/atas

    Jadi halaman admin tidak ikut memanjang gara-gara jumlah frame.
  */
  useDragScroll(scrollerRef, "y");

  if (frames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Grid3x3
          size={32}
          className="text-[#4A1A1A]/20"
        />

        <p className="font-serif text-[#4A1A1A]/40">
          {archivedView ? "Belum ada frame yang diarsipkan" : "Belum ada frame"}
        </p>

        <p className="font-serif text-sm text-[#4A1A1A]/30">
          {archivedView
            ? "Frame yang kamu arsipkan akan muncul di sini"
            : "Tambahkan frame pertamamu di form atas"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/*
        ================================================================
        FRAME GALLERY

        Selalu 4 frame per baris.

        Contoh:
        01 | 02 | 03 | 04
        05 | 06 | 07 | 08
        09 | 10 | 11 | 12

        Kalau lebih dari 4, baris berikutnya tetap berada di dalam
        gallery dan gallery-nya yang di-scroll secara vertikal.
        ================================================================
      */}
      <div
        ref={scrollerRef}
        className="no-scrollbar drag-slider-y h-[62vh] min-h-[320px] max-h-[720px] overflow-y-auto overscroll-contain pr-1 sm:h-[64vh] lg:h-[66vh]"
      >
        <div className="grid grid-cols-4 items-start gap-x-3 gap-y-7 pb-6 sm:gap-x-5 sm:gap-y-9 lg:gap-x-6">
          <AnimatePresence>
            {frames.map((frame) => (
              <AdminFrameCard
                key={frame.id}
                frame={frame}
                onEdit={onEdit}
                onToggleArchive={() => onToggleArchive(frame)}
                onDelete={() => setPendingDelete(frame)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title="Hapus frame ini?"
        description={
          pendingDelete
            ? `"${pendingDelete.nama}" akan dihapus permanen dan tidak bisa dipilih lagi oleh pengunjung.`
            : undefined
        }
        confirmLabel="Ya, hapus"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDelete(pendingDelete);
          }

          setPendingDelete(null);
        }}
      />
    </>
  );
}

interface AdminFrameCardProps {
  frame: Frame;
  onEdit: (frame: Frame) => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

function AdminFrameCard({
  frame,
  onEdit,
  onToggleArchive,
  onDelete,
}: AdminFrameCardProps) {
  /*
    ================================================================
    IMPORTANT

    PNG frame punya transparent padding di luar artwork.

    Kalau langsung pakai aspect-ratio PNG mentah:
      [ transparent area ]
      [      FRAME       ]
      [ transparent area ]

    badge "X slot" akan menempel ke kotak PNG, bukan ke frame.

    Jadi kita ambil bounding box artwork sebenarnya supaya seluruh
    elemen admin terasa benar-benar menempel ke frame.
    ================================================================
  */
  const contentBox = useFrameContentBox(frame.thumbnail);

  const box = contentBox?.box;
  const naturalWidth = contentBox?.naturalWidth;
  const naturalHeight = contentBox?.naturalHeight;

  const trimmedStyle =
    box && naturalWidth && naturalHeight
      ? {
          aspectRatio: `${box.w} / ${box.h}`,

          backgroundImage: `url(${frame.thumbnail})`,

          backgroundRepeat: "no-repeat",

          backgroundSize: `${
            (naturalWidth / box.w) * 100
          }% ${
            (naturalHeight / box.h) * 100
          }%`,

          backgroundPosition: `${
            naturalWidth === box.w
              ? 0
              : (box.x / (naturalWidth - box.w)) * 100
          }% ${
            naturalHeight === box.h
              ? 0
              : (box.y / (naturalHeight - box.h)) * 100
          }%`,
        }
      : null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.94,
      }}
      animate={{
        opacity: frame.archived ? 0.6 : 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.94,
      }}
      whileHover={{
        y: -5,
        opacity: 1,
      }}
      className="group relative min-w-0"
    >
      <div
        className="relative mx-auto w-full max-w-[13rem]"
        style={
          trimmedStyle ?? {
            aspectRatio: "3 / 4",
          }
        }
      >
        {!trimmedStyle && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.thumbnail}
            alt={frame.nama}
            draggable={false}
            className="h-full w-full object-contain"
          />
        )}

        {/*
          ==============================================================
          ACTION BUTTONS

          Tetap berada di frame, bukan di luar card transparan.
          ============================================================== 
        */}
        <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:right-2 sm:top-2">
          <motion.button
            type="button"
            whileHover={{
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.9,
            }}
            onClick={() => onEdit(frame)}
            aria-label={`Edit ${frame.nama}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#4A1A1A] shadow-lg backdrop-blur-sm hover:shadow-xl sm:h-9 sm:w-9"
          >
            <Pencil
              size={14}
              strokeWidth={2.3}
            />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.9,
            }}
            onClick={onToggleArchive}
            aria-label={
              frame.archived
                ? `Aktifkan lagi ${frame.nama}`
                : `Arsipkan ${frame.nama}`
            }
            title={frame.archived ? "Aktifkan lagi" : "Arsipkan"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#6B2D2C] shadow-lg backdrop-blur-sm hover:shadow-xl sm:h-9 sm:w-9"
          >
            {frame.archived ? (
              <ArchiveRestore
                size={14}
                strokeWidth={2.3}
              />
            ) : (
              <Archive
                size={14}
                strokeWidth={2.3}
              />
            )}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.9,
            }}
            onClick={onDelete}
            aria-label={`Hapus ${frame.nama}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#A0524A] shadow-lg backdrop-blur-sm hover:shadow-xl sm:h-9 sm:w-9"
          >
            <Trash2
              size={14}
              strokeWidth={2.3}
            />
          </motion.button>
        </div>

        {/*
          ==============================================================
          SLOT BADGE

          Sebelumnya:
            badge berada di pojok card 3/4

          Sekarang:
            card mengikuti artwork frame,
            sehingga badge benar-benar menempel ke frame.
          ============================================================== 
        */}
        {frame.archived && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[#4A1A1A]/85 px-2.5 py-1 font-serif text-[9px] font-semibold uppercase tracking-wide text-[#F5EBE0] shadow-md backdrop-blur-sm sm:left-2 sm:top-2 sm:text-[10px]">
            Diarsipkan
          </span>
        )}

        <span className="absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#F5EBE0]/80 bg-[#6B2D2C]/90 px-2.5 py-1 font-serif text-[9px] font-semibold text-[#F5EBE0] shadow-md backdrop-blur-sm sm:bottom-2 sm:px-3 sm:text-[10px]">
          {frame.slot} slot
        </span>
      </div>

      <p className="mx-auto mt-2 max-w-[13rem] truncate text-center font-serif text-xs font-semibold text-[#4A1A1A] sm:mt-3 sm:text-sm">
        {frame.nama}
      </p>
    </motion.div>
  );
}
