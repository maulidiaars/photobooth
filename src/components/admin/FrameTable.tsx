"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
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
      <p className="text-muted font-body py-10 text-center">
        Belum ada frame. Tambahkan frame pertamamu di sisi kiri.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4">
        {frames.map((frame) => (
          <motion.div
            key={frame.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative"
          >
            {/* No white container — the frame artwork (transparent PNG)
                sits directly on the page, exactly like the actual asset,
                so admins see precisely what visitors will see. Edit/
                delete only appear on hover so the gallery reads clean. */}
            <div className="relative aspect-[3/4] w-full drop-shadow-[0_10px_22px_rgba(58,40,31,0.22)] transition-transform group-hover:-translate-y-1">
              <Image src={frame.thumbnail} alt={frame.nama} fill sizes="220px" className="object-contain" />

              <div className="absolute inset-0 flex items-start justify-end gap-1.5 p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  onClick={() => onEdit(frame)}
                  aria-label={`Edit ${frame.nama}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-clay-sm hover:bg-white"
                >
                  <Pencil size={14} strokeWidth={2.3} />
                </button>
                <button
                  onClick={() => setPendingDelete(frame)}
                  aria-label={`Hapus ${frame.nama}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-clay-sm hover:bg-white"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                </button>
              </div>
            </div>

            <div className="mt-2 text-center">
              <p className="font-heading font-semibold text-ink truncate">{frame.nama}</p>
              <p className="text-xs text-muted font-body">{frame.slot} slot foto</p>
            </div>
          </motion.div>
        ))}
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
