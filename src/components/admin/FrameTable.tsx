"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Grid3x3 } from "lucide-react";
import type { Frame } from "@/types/frame";
import { ConfirmModal } from "@/components/ui/Modal";

interface FrameTableProps {
  frames: Frame[];
  onEdit: (frame: Frame) => void;
  onDelete: (frame: Frame) => void;
}

export function FrameTable({ frames, onEdit, onDelete }: FrameTableProps) {
  const [pendingDelete, setPendingDelete] = useState<Frame | null>(null);

  if (frames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Grid3x3 size={32} className="text-[#4A1A1A]/20" />
        <p className="mt-3 font-serif text-[#4A1A1A]/40">Belum ada frame</p>
        <p className="font-serif text-sm text-[#4A1A1A]/30">Tambahkan frame pertamamu di samping</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {frames.map((frame) => (
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md transition-shadow group-hover:shadow-xl">
                <Image 
                  src={frame.thumbnail} 
                  alt={frame.nama} 
                  fill 
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" 
                  className="object-contain" 
                />

                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-start justify-end gap-1.5 p-2.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(frame)}
                    aria-label={`Edit ${frame.nama}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF7F2] text-[#4A1A1A] shadow-md hover:shadow-lg transition-all"
                  >
                    <Pencil size={14} strokeWidth={2.3} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPendingDelete(frame)}
                    aria-label={`Hapus ${frame.nama}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF7F2] text-[#A0524A] shadow-md hover:shadow-lg transition-all"
                  >
                    <Trash2 size={14} strokeWidth={2.3} />
                  </motion.button>
                </div>

                {/* Status badge */}
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[#6B2D2C]/80 px-2 py-0.5 font-serif text-[9px] font-semibold text-[#F5EBE0]">
                  {frame.slot} slot
                </span>
              </div>

              <div className="mt-2 text-center">
                <p className="font-serif font-semibold text-[#4A1A1A] truncate text-sm">
                  {frame.nama}
                </p>
              </div>
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