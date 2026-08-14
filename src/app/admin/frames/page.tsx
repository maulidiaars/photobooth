"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Grid3x3 } from "lucide-react";
import { FrameForm } from "@/components/admin/FrameForm";
import { FrameTable } from "@/components/admin/FrameTable";
import { useToast } from "@/components/ui/Toast";
import {
  createFrame,
  deleteFrame,
  getFrames,
  updateFrame,
} from "@/services/frameService";
import type { Frame, SlotRect } from "@/types/frame";

export default function AdminFramesPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Frame | null>(null);
  const toast = useToast();

  const loadFrames = () => {
    setLoading(true);
    getFrames()
      .then(setFrames)
      .finally(() => setLoading(false));
  };

  useEffect(loadFrames, []);

  const handleSubmit = async (payload: {
    nama: string;
    framePngBase64?: string;
    slotLayout?: SlotRect[];
  }) => {
    if (editing) {
      await updateFrame(editing.id, payload);
      setEditing(null);
      toast.push("Perubahan frame tersimpan", "success");
    } else {
      if (!payload.framePngBase64 || !payload.slotLayout) return;
      await createFrame({
        nama: payload.nama,
        framePngBase64: payload.framePngBase64,
        slotLayout: payload.slotLayout,
      });
      toast.push("Frame baru berhasil ditambahkan", "success");
    }
    loadFrames();
  };

  const handleDelete = async (frame: Frame) => {
    await deleteFrame(frame.id);
    toast.push(`Frame "${frame.nama}" berhasil dihapus`, "success");
    loadFrames();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header — same style as the Dashboard's title, so the two admin
          pages read as one product instead of switching design language
          halfway through. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#4A1A1A] tracking-wide">
            Kelola Frame
          </h1>
          <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
            Unggah PNG transparan, sisanya — deteksi kotak foto, thumbnail — otomatis.
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-1.5 font-serif text-xs text-[#6B2D2C]">
            <Grid3x3 size={13} strokeWidth={2.2} />
            {frames.length} frame aktif
          </span>
        </div>
      </motion.div>

      {/* Form gets the full page width now — its own 2-column layout
          (upload fields + live preview) needs the room; squeezing it into
          a 340px sidebar was what made it look broken before. */}
      <FrameForm
        key={editing?.id ?? "new"}
        initial={editing}
        onSubmit={handleSubmit}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-4 sm:p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
            Semua Frame
          </h2>
        </div>
        {loading ? (
          <p className="text-[#4A1A1A]/60 font-serif text-sm">Memuat frame...</p>
        ) : (
          <FrameTable frames={frames} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}