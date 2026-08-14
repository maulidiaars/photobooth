"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCw, X } from "lucide-react";
import { FrameForm } from "@/components/admin/FrameForm";
import { FrameTable } from "@/components/admin/FrameTable";
import {
  getFrames,
  createFrame,
  updateFrame,
  deleteFrame,
} from "@/services/frameService";
import { useToast } from "@/components/ui/Toast";
import type { Frame } from "@/types/frame";

export default function FramesPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const loadFrames = async () => {
    setLoading(true);

    try {
      const data = await getFrames();
      setFrames(data);
    } catch {
      toast.push("Gagal memuat frame", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFrames();
  }, []);

  const handleCreate = async (payload: {
    nama: string;
    framePngBase64?: string;
    slotLayout?: any[];
  }) => {
    try {
      // Frame baru wajib memiliki PNG dan layout slot
      if (!payload.framePngBase64 || !payload.slotLayout) {
        toast.push("PNG frame dan slot layout wajib diisi", "error");
        return;
      }

      const framePngBase64 = payload.framePngBase64;
      const slotLayout = payload.slotLayout;

      await createFrame({
        nama: payload.nama,
        framePngBase64,
        slotLayout,
      });

      toast.push("Frame berhasil ditambahkan", "success");
      setShowForm(false);
      loadFrames();
    } catch {
      toast.push("Gagal menambahkan frame", "error");
    }
  };

  const handleUpdate = async (payload: {
    nama: string;
    framePngBase64?: string;
    slotLayout?: any[];
  }) => {
    if (!editingFrame) return;

    try {
      await updateFrame(editingFrame.id, payload);

      toast.push("Frame berhasil diperbarui", "success");
      setEditingFrame(null);
      setShowForm(false);
      loadFrames();
    } catch {
      toast.push("Gagal memperbarui frame", "error");
    }
  };

  const handleDelete = async (frame: Frame) => {
    try {
      await deleteFrame(frame.id);

      toast.push("Frame berhasil dihapus", "success");
      loadFrames();
    } catch {
      toast.push("Gagal menghapus frame", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
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
            Unggah PNG transparan — deteksi slot otomatis
          </p>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => {
              setEditingFrame(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#6B2D2C] px-5 py-2.5 font-serif text-sm font-semibold text-[#F5EBE0] shadow-md hover:shadow-lg transition-all"
          >
            {showForm && !editingFrame ? (
              <>
                <X size={16} strokeWidth={2.2} />
                Tutup
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.2} />
                Tambah Frame
              </>
            )}
          </button>

          <button
            onClick={loadFrames}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EBE0] text-[#4A1A1A] shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw
              size={16}
              strokeWidth={2.2}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </motion.div>

      {/* Form */}
      {(showForm || editingFrame) && (
        <FrameForm
          initial={editingFrame}
          onSubmit={editingFrame ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingFrame(null);
          }}
        />
      )}

      {/* Daftar Frame */}
      <div className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
            Semua Frame
          </h2>

          <span className="rounded-full bg-[#6B2D2C]/10 px-3.5 py-1 font-serif text-xs font-medium text-[#6B2D2C]">
            {frames.length} frame
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw
              size={24}
              className="animate-spin text-[#6B2D2C]/40"
              strokeWidth={2}
            />
          </div>
        ) : (
          <FrameTable
            frames={frames}
            onEdit={(frame) => {
              setEditingFrame(frame);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}