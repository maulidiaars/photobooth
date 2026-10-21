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
        <motion.div
          key={archivedView ? "archived" : "active"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-4 items-start gap-x-3 gap-y-7 pb-6 sm:gap-x-5 sm:gap-y-9 lg:gap-x-6"
        >
          <AnimatePresence initial={false}>
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
        </motion.div>
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
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="group relative min-w-0"
    >
      {/*
        Hover dibuat halus: frame cuma naik 2px dan dapat bayangan
        lembut yang mengikuti bentuk frame. Tidak ada scale / lompatan.
      */}
      <div
        className="relative mx-auto w-full max-w-[13rem] transition-[filter,transform] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_8px_14px_rgba(58,40,31,0.2)]"
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
          ACTION BUTTONS

          Muncul pelan saat hover / fokus. Di layar sentuh (HP/tablet)
          tidak ada hover, jadi tombolnya selalu kelihatan.
        */}
        <div className="absolute right-1.5 top-1.5 z-10 flex translate-y-0.5 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 sm:right-2 sm:top-2 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(frame)}
            aria-label={`Edit ${frame.nama}`}
            title="Edit"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#4A1A1A] shadow-sm transition-colors hover:bg-white active:scale-95 sm:h-8 sm:w-8"
          >
            <Pencil size={13} strokeWidth={2.3} />
          </button>

          <button
            type="button"
            onClick={onToggleArchive}
            aria-label={
              frame.archived
                ? `Aktifkan lagi ${frame.nama}`
                : `Arsipkan ${frame.nama}`
            }
            title={frame.archived ? "Aktifkan lagi" : "Arsipkan"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#6B2D2C] shadow-sm transition-colors hover:bg-white active:scale-95 sm:h-8 sm:w-8"
          >
            {frame.archived ? (
              <ArchiveRestore size={13} strokeWidth={2.3} />
            ) : (
              <Archive size={13} strokeWidth={2.3} />
            )}
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Hapus ${frame.nama}`}
            title="Hapus"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF7F2]/95 text-[#A0524A] shadow-sm transition-colors hover:bg-white active:scale-95 sm:h-8 sm:w-8"
          >
            <Trash2 size={13} strokeWidth={2.3} />
          </button>
        </div>

        {/* Badge jumlah slot */}
        <span className="absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#6B2D2C]/85 px-2.5 py-1 font-serif text-[9px] font-semibold text-[#F5EBE0] shadow-sm backdrop-blur-sm sm:bottom-2 sm:px-3 sm:text-[10px]">
          {frame.slot} slot
        </span>
      </div>

      <p className="mx-auto mt-2 max-w-[13rem] truncate text-center font-serif text-xs font-semibold text-[#4A1A1A] sm:mt-3 sm:text-sm">
        {frame.nama}
      </p>
    </motion.div>
  );
}
