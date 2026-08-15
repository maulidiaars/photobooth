"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Grid3x3 } from "lucide-react";
import type { Frame } from "@/types/frame";
import { ConfirmModal } from "@/components/ui/Modal";
import { useDragScroll } from "@/hooks/useDragScroll";

interface FrameTableProps {
  frames: Frame[];
  onEdit: (frame: Frame) => void;
  onDelete: (frame: Frame) => void;
}

export function FrameTable({ frames, onEdit, onDelete }: FrameTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Frame | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollerRef);

  if (frames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Grid3x3 size={32} className="text-[#4A1A1A]/20" />
        <p className="font-serif text-[#4A1A1A]/40">Belum ada frame</p>
        <p className="font-serif text-sm text-[#4A1A1A]/30">
          Tambahkan frame pertamamu di form atas
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Satu baris terus (flex-nowrap), scroll ke samping kalau
          frame-nya banyak — TIDAK di-wrap ke bawah. Sengaja tanpa
          card/border/bg pembungkus: cuma PNG frame (transparan) yang
          "mengambang" langsung di atas halaman, ukurannya juga
          dibesarkan supaya jelas kelihatan. */}
      <div
        ref={scrollerRef}
        className="no-scrollbar drag-slider -mx-1 flex select-none gap-8 overflow-x-auto scroll-smooth px-1 pb-4"
      >
        <AnimatePresence>
          {frames.map((frame) => (
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              whileHover={{ y: -6 }}
              className="group relative w-60 shrink-0 sm:w-72 md:w-80"
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={frame.thumbnail}
                  alt={frame.nama}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 60vw, (max-width: 1024px) 35vw, 320px"
                  className="object-contain drop-shadow-[0_20px_32px_rgba(74,26,26,0.28)] transition-transform duration-300 group-hover:scale-[1.03]"
                />

                {/* Hover Actions — melayang langsung di atas frame */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-end gap-1.5 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(frame)}
                    aria-label={`Edit ${frame.nama}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF7F2] text-[#4A1A1A] shadow-lg hover:shadow-xl transition-all"
                  >
                    <Pencil size={15} strokeWidth={2.3} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPendingDelete(frame)}
                    aria-label={`Hapus ${frame.nama}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF7F2] text-[#A0524A] shadow-lg hover:shadow-xl transition-all"
                  >
                    <Trash2 size={15} strokeWidth={2.3} />
                  </motion.button>
                </div>

                {/* Status badge */}
                <span className="absolute bottom-2 right-2 rounded-full bg-[#6B2D2C]/85 px-2.5 py-0.5 font-serif text-[10px] font-semibold text-[#F5EBE0] shadow-md">
                  {frame.slot} slot
                </span>
              </div>

              <p className="mt-3 truncate text-center font-serif text-sm font-semibold text-[#4A1A1A]">
                {frame.nama}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
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
          if (pendingDelete) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
}