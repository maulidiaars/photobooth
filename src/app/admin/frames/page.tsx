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
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Frame | null>(null);
  const [view, setView] = useState<FrameView>("active");
  const [busyFrameId, setBusyFrameId] = useState<string | null>(null);
  const toast = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const activeFrames = useMemo(
    () => frames.filter((frame) => !frame.archived),
    [frames]
  );

  const archivedFrames = useMemo(
    () => frames.filter((frame) => frame.archived),
    [frames]
  );

  const shownFrames =
    view === "active" ? activeFrames : archivedFrames;

  const loadFrames = async () => {
    setLoading(true);

    try {
      const data = await getFrames({ includeArchived: true });
      setFrames(data);
    } catch {
      toast.push("Gagal memuat daftar frame", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFrames();
    // Muat daftar frame ketika halaman admin pertama kali dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (frame: Frame) => {
    setEditing(frame);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleSubmit = async (payload: {
    nama: string;
    framePngBase64?: string;
    slotLayout?: SlotRect[];
  }) => {
    try {
      if (editing) {
        await updateFrame(editing.id, payload);
        setEditing(null);
        toast.push("Perubahan frame tersimpan", "success");
      } else {
        if (!payload.framePngBase64 || !payload.slotLayout) {
          return;
        }

        await createFrame({
          nama: payload.nama,
          framePngBase64: payload.framePngBase64,
          slotLayout: payload.slotLayout,
        });

        toast.push("Frame baru berhasil ditambahkan", "success");
      }

      await loadFrames();
    } catch {
      toast.push("Gagal menyimpan frame", "error");
    }
  };

  const handleDelete = async (frame: Frame) => {
    try {
      await deleteFrame(frame.id);

      setFrames((current) =>
        current.filter((item) => item.id !== frame.id)
      );

      if (editing?.id === frame.id) {
        setEditing(null);
      }

      toast.push(`Frame "${frame.nama}" berhasil dihapus`, "success");
    } catch {
      toast.push("Gagal menghapus frame", "error");
    }
  };

  const handleToggleArchive = async (frame: Frame) => {
    if (busyFrameId) return;

    const nextArchived = !frame.archived;
    setBusyFrameId(frame.id);

    try {
      // Simpan status ke server terlebih dahulu.
      const updatedFrame = await setFrameArchived(
        frame.id,
        nextArchived
      );

      // Perbarui daftar secara langsung tanpa reload halaman.
      setFrames((current) =>
        current.map((item) =>
          item.id === frame.id ? updatedFrame : item
        )
      );

      // Tetap di tab yang sama: kartunya memudar keluar dengan halus,
      // tanpa halaman lompat ke tab lain.

      toast.push(
        nextArchived
          ? `Frame "${frame.nama}" berhasil diarsipkan`
          : `Frame "${frame.nama}" berhasil diaktifkan kembali`,
        "success"
      );
    } catch {
      toast.push("Gagal mengubah status arsip frame", "error");
    } finally {
      setBusyFrameId(null);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#4A1A1A]">
            Kelola Frame
          </h1>
          <p className="mt-0.5 font-serif text-sm text-[#4A1A1A]/60">
            Unggah PNG transparan, deteksi kotak foto &amp; thumbnail otomatis
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-1.5 font-serif text-xs text-[#6B2D2C]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5B7F5C]" />
            {activeFrames.length} frame aktif
          </span>

          <span className="inline-flex items-center rounded-full bg-[#4A1A1A]/10 px-3 py-1.5 font-serif text-xs text-[#4A1A1A]/70">
            {archivedFrames.length} diarsipkan
          </span>
        </div>
      </motion.div>

      <div ref={formRef}>
        <FrameForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold tracking-wide text-[#4A1A1A]">
            Daftar Frame
          </h2>

          <div className="relative inline-flex rounded-full bg-[#F5EBE0] p-1">
            {(
              [
                {
                  id: "active",
                  label: "Aktif",
                  count: activeFrames.length,
                },
                {
                  id: "archived",
                  label: "Diarsipkan",
                  count: archivedFrames.length,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={clsx(
                  "relative rounded-full px-4 py-1.5 font-serif text-xs font-semibold transition-colors duration-200",
                  view === tab.id
                    ? "text-[#F5EBE0]"
                    : "text-[#4A1A1A]/70 hover:text-[#4A1A1A]"
                )}
              >
                {view === tab.id && (
                  <motion.span
                    layoutId="frame-view-pill"
                    className="absolute inset-0 rounded-full bg-[#6B2D2C] shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
                  />
                )}

                <span className="relative z-10">
                  {tab.label} ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {view === "archived" && archivedFrames.length > 0 && (
          <p className="font-serif text-xs text-[#4A1A1A]/60">
            Frame di sini disembunyikan dari pengunjung. Aktifkan kembali
            jika ingin menampilkannya lagi.
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
