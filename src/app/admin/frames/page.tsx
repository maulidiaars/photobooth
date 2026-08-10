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
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-clay-lg bg-forest-gradient px-6 py-5 text-paper-light shadow-clay"
      >
        <div>
          <h1 className="font-heading text-3xl font-semibold">Kelola Frame</h1>
          <p className="mt-1 font-body text-sm text-paper-light/75">
            Unggah PNG transparan, sisanya — deteksi kotak foto, thumbnail — otomatis.
          </p>
        </div>
        <div className="rounded-clay-sm bg-white/10 px-4 py-2 text-center">
          <p className="font-heading text-2xl font-semibold leading-none">{frames.length}</p>
          <p className="mt-0.5 font-body text-[11px] text-paper-light/70">frame aktif</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        <div className="xl:sticky xl:top-6">
          <FrameForm
            key={editing?.id ?? "new"}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </div>

        <div>
          {loading ? (
            <p className="text-muted font-body">Memuat frame...</p>
          ) : (
            <FrameTable frames={frames} onEdit={setEditing} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}
