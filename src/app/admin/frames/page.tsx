"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
    <div className="flex flex-col gap-10">
      {/* Header */}
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
            Unggah PNG transparan, deteksi kotak foto &amp; thumbnail otomatis
          </p>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-1.5 font-serif text-xs text-[#6B2D2C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5B7F5C] animate-pulse" />
            {frames.length} frame aktif
          </span>
        </div>
      </motion.div>

      {/* Form Tambah/Edit Frame — 2 kolom di dalam komponennya
          sendiri: kiri input, kanan preview (tinggi preview selalu
          mengikuti persis tinggi kolom input, lihat FrameForm.tsx). */}
      <FrameForm
        key={editing?.id ?? "new"}
        initial={editing}
        onSubmit={handleSubmit}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      {/* Daftar Frame — sengaja TANPA card/background di belakangnya,
          biar PNG frame-nya beneran "mengambang" polos di atas halaman.
          Satu baris terus, kalau frame-nya banyak tinggal di-scroll ke
          samping (lihat FrameTable.tsx). */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
            Daftar Frame
          </h2>
          <span className="font-serif text-xs text-[#4A1A1A]/50">
            {frames.length} frame
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-serif text-lg text-[#4A1A1A]/40">
              Memuat frame...
            </p>
          </div>
        ) : (
          <FrameTable frames={frames} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}