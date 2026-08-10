"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2 } from "lucide-react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { DetectedSlotsPreview } from "@/components/admin/DetectedSlotsPreview";
import { fileToBase64 } from "@/lib/fileToBase64";
import { detectFrameSlots, type SlotRect } from "@/lib/frameSlotDetector";
import type { Frame } from "@/types/frame";

interface FrameFormProps {
  initial?: Frame | null;
  onSubmit: (payload: {
    nama: string;
    framePngBase64?: string;
    slotLayout?: SlotRect[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export function FrameForm({ initial, onSubmit, onCancel }: FrameFormProps) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.frame_png ?? null);
  const [framePngBase64, setFramePngBase64] = useState<string | null>(null);
  const [slotLayout, setSlotLayout] = useState<SlotRect[]>(initial?.slot_layout ?? []);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (file: File | null) => {
    setError(null);
    setFramePngBase64(null);
    setSlotLayout([]);
    if (!file) {
      setPreviewUrl(initial?.frame_png ?? null);
      return;
    }

    setDetecting(true);
    try {
      // Analyze the transparent PNG right in the browser: find every
      // "hole", count them, and pin down each one's exact position —
      // this is the only thing the admin needs to upload.
      const [base64, detected] = await Promise.all([
        fileToBase64(file),
        detectFrameSlots(file),
      ]);
      setFramePngBase64(base64);
      setPreviewUrl(base64);
      setSlotLayout(detected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menganalisis frame. Pastikan file PNG memiliki area transparan."
      );
      setPreviewUrl(initial?.frame_png ?? null);
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!initial && (!framePngBase64 || slotLayout.length === 0)) {
      setError("Unggah file frame PNG transparan terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nama,
        ...(framePngBase64 ? { framePngBase64, slotLayout } : {}),
      });
      setNama("");
      setFramePngBase64(null);
      setSlotLayout([]);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan frame");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <ClayCard bg="mint">
        <h3 className="font-heading text-xl font-semibold text-ink mb-1">
          {initial ? "Edit Frame" : "Tambah Frame Baru"}
        </h3>
        <p className="text-xs text-muted font-body mb-4">
          Cukup unggah 1 file PNG transparan — jumlah &amp; posisi kotak foto akan
          terdeteksi otomatis dari lubang transparan di gambar itu sendiri.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-body text-sm text-ink/80 mb-1 block">Nama Frame</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full rounded-clay-sm bg-white/70 px-4 py-3 font-body shadow-clay-inset outline-none"
              placeholder="Contoh: Frame Lucu Pastel"
            />
          </div>

          <div>
            <label className="font-body text-sm text-ink/80 mb-1 block">
              File Frame PNG (transparan){initial ? " — kosongkan jika tidak diganti" : ""}
            </label>
            <input
              type="file"
              accept="image/png"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="w-full rounded-clay-sm bg-white/70 px-4 py-3 font-body shadow-clay-inset text-sm"
            />
          </div>

          {detecting && (
            <p className="flex items-center gap-1.5 text-sm text-ink/70 font-body">
              <Search size={16} className="animate-pulse" strokeWidth={2.2} />
              Mendeteksi kotak foto...
            </p>
          )}

          {previewUrl && !detecting && (
            <div>
              <DetectedSlotsPreview imageUrl={previewUrl} slots={slotLayout} />
              {slotLayout.length > 0 ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/70 font-body">
                  <CheckCircle2 size={16} className="shrink-0 text-clay-mintDark" strokeWidth={2.2} />
                  Terdeteksi <strong>{slotLayout.length} kotak foto</strong> otomatis.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted font-body">
                  Frame lama ini belum punya data deteksi — unggah ulang file PNG-nya untuk
                  mendeteksi kotak foto.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 font-body">{error}</p>}

          <div className="flex gap-3">
            <ClayButton type="submit" variant="pink" size="sm" disabled={submitting || detecting}>
              {submitting ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Tambah Frame"}
            </ClayButton>
            {onCancel && (
              <ClayButton type="button" variant="ghost" size="sm" onClick={onCancel}>
                Batal
              </ClayButton>
            )}
          </div>
        </form>
      </ClayCard>
    </motion.div>
  );
}
