"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { FrameForm } from "@/components/admin/FrameForm";
import { FrameTable } from "@/components/admin/FrameTable";
import { useToast } from "@/components/ui/Toast";
import {
  createFrame,
  deleteFrame,
  getFrames,
  setFrameArchived,
  updateFrame,
} from "@/services/frameService";
import type { Frame, SlotRect } from "@/types/frame";

type FrameView = "active" | "archived";

export default function AdminFramesPage() {
  // Berisi SEMUA frame (aktif + diarsipkan). Dipisah per tab di bawah.
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Frame | null>(null);
  const [view, setView] = useState<FrameView>("active");
  const toast = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const activeFrames = useMemo(() => frames.filter((f) => !f.archived), [frames]);
  const archivedFrames = useMemo(() => frames.filter((f) => f.archived), [frames]);
  const shownFrames = view === "active" ? activeFrames : archivedFrames;

  // Tombol "Edit" di FrameTable cuma set state `editing` — tanpa ini,
  // form pengeditan di atas berubah isinya tapi viewport admin masih
  // di posisi scroll semula (di baris daftar frame paling bawah),
  // jadi kelihatannya seperti "gak kejadian apa-apa". Scroll paksa
  // ke form-nya begitu tombol edit ditekan.
  const handleEdit = (frame: Frame) => {
    setEditing(frame);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const loadFrames = () => {
    setLoading(true);
    getFrames({ includeArchived: true })
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
    // Kalau frame yang lagi diedit ikut dihapus, tutup form editnya.
    if (editing?.id === frame.id) setEditing(null);
    loadFrames();
  };

  const handleToggleArchive = async (frame: Frame) => {
    const nextArchived = !frame.archived;
    try {
      await setFrameArchived(frame.id, nextArchived);
      toast.push(
        nextArchived
          ? `Frame "${frame.nama}" diarsipkan — tidak tampil lagi di pengunjung`
          : `Frame "${frame.nama}" diaktifkan lagi`,
        "success"
      );
      loadFrames();
    } catch {
      toast.push("Gagal mengubah status arsip frame", "error");
    }
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
            {activeFrames.length} frame aktif
          </span>
          {archivedFrames.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#4A1A1A]/10 px-3 py-1.5 font-serif text-xs text-[#4A1A1A]/70">
              {archivedFrames.length} diarsipkan
            </span>
          )}
        </div>
      </motion.div>

      {/* Form Tambah/Edit Frame — 2 kolom di dalam komponennya
          sendiri: kiri input, kanan preview (tinggi preview selalu
          mengikuti persis tinggi kolom input, lihat FrameForm.tsx).
          Dibungkus div + ref supaya tombol "Edit" di tabel bawah bisa
          men-scroll ke sini (lihat handleEdit di atas). */}
      <div ref={formRef}>
        <FrameForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </div>

      {/* Daftar Frame — sengaja TANPA card/background di belakangnya,
          biar PNG frame-nya beneran "mengambang" polos di atas halaman.
          Ada 2 tab: Aktif (tampil di pengunjung) & Diarsipkan (disembunyikan). */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold text-[#4A1A1A] tracking-wide">
            Daftar Frame
          </h2>

          <div className="inline-flex rounded-full bg-[#F5EBE0] p-1">
            {(
              [
                { id: "active", label: "Aktif", count: activeFrames.length },
                { id: "archived", label: "Diarsipkan", count: archivedFrames.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={clsx(
                  "rounded-full px-4 py-1.5 font-serif text-xs font-semibold transition-all",
                  view === tab.id
                    ? "bg-[#6B2D2C] text-[#F5EBE0] shadow"
                    : "text-[#4A1A1A]/70 hover:text-[#4A1A1A]"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {view === "archived" && archivedFrames.length > 0 && (
          <p className="font-serif text-xs text-[#4A1A1A]/50">
            Frame di tab ini disembunyikan dari pengunjung. Tekan ikon arsip
            pada frame untuk mengaktifkannya lagi.
          </p>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-serif text-lg text-[#4A1A1A]/40">
              Memuat frame...
            </p>
          </div>
        ) : (
          <FrameTable
            frames={shownFrames}
            archivedView={view === "archived"}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleArchive={handleToggleArchive}
          />
        )}
      </section>
    </div>
  );
}
