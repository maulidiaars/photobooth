"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Search, Upload, X, Image as ImageIcon, Grid3x3 } from "lucide-react";
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
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = async (file: File | null) => {
    setError(null);
    setFramePngBase64(null);
    setSlotLayout([]);
    setFileName("");
    if (!file) {
      setPreviewUrl(initial?.frame_png ?? null);
      return;
    }

    setFileName(file.name);
    setDetecting(true);
    try {
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
      setFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan frame");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-6 shadow-md"
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#4A1A1A]">
              {initial ? "Edit Frame" : "Tambah Frame Baru"}
            </h3>
            <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
              Unggah PNG transparan — deteksi slot otomatis
            </p>
          </div>
          {initial && onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-xl bg-[#F5EBE0] px-4 py-2 font-serif text-sm font-medium text-[#4A1A1A] shadow-sm hover:shadow-md transition-all"
            >
              <X size={16} strokeWidth={2.2} />
              Batal
            </button>
          )}
        </div>

        {/* 2 Kolom Seimbang */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kiri: Form */}
          <div className="bg-[#F5EBE0]/20 rounded-xl p-5 border border-[#E8DDD0]/30">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-serif text-sm font-medium text-[#4A1A1A]/80 block mb-1.5">
                  Nama Frame
                </label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#E8DDD0]/50 bg-white px-4 py-3 font-serif shadow-inner outline-none focus:border-[#6B2D2C] transition-colors text-[#4A1A1A] text-sm"
                  placeholder="Contoh: Frame Lucu Pastel"
                />
              </div>

              <div>
                <label className="font-serif text-sm font-medium text-[#4A1A1A]/80 block mb-1.5">
                  File PNG (transparan)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[#E8DDD0] bg-white px-5 py-4 transition-colors hover:border-[#6B2D2C]/40">
                    <Upload size={18} className="text-[#6B2D2C]/60 shrink-0" strokeWidth={2} />
                    <span className="font-serif text-sm text-[#4A1A1A]/60 truncate">
                      {fileName || (initial ? "Kosongkan jika tidak diganti" : "Pilih file PNG...")}
                    </span>
                  </div>
                </div>
              </div>

              {detecting && (
                <div className="flex items-center gap-2.5 rounded-xl bg-[#F5EBE0] px-4 py-3">
                  <Search size={18} className="animate-spin text-[#6B2D2C]" strokeWidth={2.2} />
                  <span className="font-serif text-sm text-[#4A1A1A]/70">Mendeteksi slot...</span>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-[#A0524A]/10 px-4 py-3">
                  <p className="font-serif text-sm text-[#A0524A]">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || detecting}
                  className="flex items-center gap-2 rounded-xl bg-[#6B2D2C] px-8 py-3 font-serif font-semibold text-[#F5EBE0] shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
                >
                  {submitting ? "Menyimpan..." : initial ? "Simpan" : "Tambah"}
                </button>
                {!initial && onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl bg-[#F5EBE0] px-6 py-3 font-serif font-medium text-[#4A1A1A] shadow-sm hover:shadow-md transition-all"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Kanan: Preview */}
          <div className="bg-[#F5EBE0]/20 rounded-xl border border-[#E8DDD0]/30 p-5 flex flex-col min-h-[380px]">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={18} className="text-[#6B2D2C]" strokeWidth={2} />
              <span className="font-serif text-sm font-medium text-[#4A1A1A]/80">Preview</span>
              {slotLayout.length > 0 && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-1 font-serif text-xs font-semibold text-[#6B2D2C]">
                  <Grid3x3 size={12} strokeWidth={2} />
                  {slotLayout.length} slot
                </span>
              )}
            </div>

            {previewUrl ? (
              <div className="flex-1 flex items-center justify-center bg-[#0D0503] rounded-xl overflow-hidden">
                <DetectedSlotsPreview imageUrl={previewUrl} slots={slotLayout} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#E8DDD0] rounded-xl bg-white/50">
                <Upload size={36} className="text-[#E8DDD0]" strokeWidth={1.5} />
                <p className="font-serif text-sm text-[#4A1A1A]/40 text-center max-w-[200px]">
                  {initial ? "Upload ulang PNG" : "Upload PNG untuk preview"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}