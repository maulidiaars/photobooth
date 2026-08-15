"use client";

import { useState, type FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon, Grid3x3, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (initial) {
      setNama(initial.nama);
      setPreviewUrl(initial.frame_png);
      setSlotLayout(initial.slot_layout);
      setFileName("");
      setFramePngBase64(null);
      setError(null);
    } else {
      setNama("");
      setPreviewUrl(null);
      setSlotLayout([]);
      setFileName("");
      setFramePngBase64(null);
      setError(null);
    }
  }, [initial]);

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
      
      if (!initial) {
        setNama("");
        setFramePngBase64(null);
        setSlotLayout([]);
        setPreviewUrl(null);
        setFileName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan frame");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    if (onCancel) onCancel();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#E8DDD0]/50 bg-[#FBF7F2] p-5 sm:p-8 shadow-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Header Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DDD0]/30 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#4A1A1A]">
              {initial ? "Edit Frame" : "Tambah Frame Baru"}
            </h3>
            <p className="font-serif text-sm text-[#4A1A1A]/60 mt-0.5">
              Unggah PNG transparan — deteksi slot otomatis
            </p>
          </div>
          {initial && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-xl bg-[#F5EBE0] px-5 py-2.5 font-serif text-sm font-medium text-[#4A1A1A] shadow-sm hover:shadow-md transition-all"
            >
              <X size={18} strokeWidth={2.2} />
              Batal Edit
            </button>
          )}
        </div>

        {/* 2 Kolom seimbang: Form + Preview.
            lg:items-stretch bikin kolom kanan ikut tinggi kolom kiri
            (row grid = tinggi konten terpanjang, otomatis form kiri
            yang biasanya lebih tinggi). Di kolom kanan, box preview
            pakai flex-1 + min-h-0 supaya dia MENGISI sisa tinggi itu
            persis — gak lebih, gak kurang — mau frame yang diupload
            landscape atau strip vertikal super panjang sekalipun. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* Kiri: Input Form */}
          <div className="space-y-5">
            {/* Nama Frame */}
            <div>
              <label className="font-serif text-sm font-semibold text-[#4A1A1A]/80 block mb-1.5">
                Nama Frame <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E8DDD0]/60 bg-white px-4 py-3.5 font-serif shadow-inner outline-none focus:border-[#6B2D2C] focus:ring-2 focus:ring-[#6B2D2C]/20 transition-all text-[#4A1A1A] text-sm"
                placeholder="Contoh: Frame Lucu Pastel"
              />
            </div>

            {/* Upload File */}
            <div>
              <label className="font-serif text-sm font-semibold text-[#4A1A1A]/80 block mb-1.5">
                File PNG (transparan) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/png"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[#E8DDD0] bg-white px-5 py-4 transition-all hover:border-[#6B2D2C]/40 hover:bg-[#FBF7F2]">
                  <Upload size={20} className="text-[#6B2D2C]/60 shrink-0" strokeWidth={2} />
                  <span className="font-serif text-sm text-[#4A1A1A]/60 truncate flex-1">
                    {fileName || (initial ? "Kosongkan jika tidak diganti" : "Pilih file PNG...")}
                  </span>
                </div>
              </div>
            </div>

            {/* Detecting Status */}
            {detecting && (
              <div className="flex items-center gap-3 rounded-xl bg-[#F5EBE0] px-4 py-3.5">
                <Loader2 size={20} className="animate-spin text-[#6B2D2C]" strokeWidth={2.2} />
                <span className="font-serif text-sm text-[#4A1A1A]/70">Mendeteksi slot...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-[#A0524A]/10 px-4 py-3.5 border border-[#A0524A]/20">
                <p className="font-serif text-sm text-[#A0524A]">{error}</p>
              </div>
            )}

            {/* Tombol Submit */}
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="submit"
                disabled={submitting || detecting}
                className="flex items-center gap-2 rounded-xl bg-[#6B2D2C] px-10 py-3.5 font-serif font-semibold text-[#F5EBE0] shadow-md hover:shadow-lg disabled:opacity-60 transition-all hover:bg-[#4A1A1A]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" strokeWidth={2.2} />
                    Menyimpan...
                  </>
                ) : (
                  initial ? "Simpan Perubahan" : "Tambah Frame"
                )}
              </button>
              {!initial && onCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl bg-[#F5EBE0] px-8 py-3.5 font-serif font-medium text-[#4A1A1A] shadow-sm hover:shadow-md transition-all"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* Kanan: Preview — TIDAK PERNAH memanjang sendiri.
              Wrapper "flex flex-col" ikut stretch tinggi baris grid
              (= tinggi kolom kiri), lalu box preview "flex-1 min-h-0"
              mengisi SISA tinggi itu persis. Gambar di dalamnya pakai
              position:absolute inset-0 supaya benar-benar dipaksa pas
              ke ukuran box, apapun rasio PNG yang diupload. */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={18} className="text-[#6B2D2C]" strokeWidth={2} />
              <span className="font-serif text-sm font-semibold text-[#4A1A1A]/70 uppercase tracking-wider">
                Preview Frame
              </span>
              {slotLayout.length > 0 && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#6B2D2C]/10 px-3 py-0.5 font-serif text-xs font-semibold text-[#6B2D2C]">
                  <Grid3x3 size={14} strokeWidth={2} />
                  {slotLayout.length} slot
                </span>
              )}
            </div>

            <div className="relative min-h-[320px] w-full flex-1 overflow-hidden rounded-xl border-2 border-[#E8DDD0] bg-[#0D0503] lg:min-h-0">
              {previewUrl ? (
                <div className="absolute inset-0">
                  <DetectedSlotsPreview imageUrl={previewUrl} slots={slotLayout} />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <Upload size={40} className="text-[#E8DDD0] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="font-serif text-sm text-[#4A1A1A]/30 max-w-[180px] mx-auto">
                    {initial ? "Upload ulang PNG untuk preview" : "Upload PNG transparan untuk melihat preview"}
                  </p>
                </div>
              )}
            </div>

            {/* Info tambahan */}
            <p className="text-xs text-[#4A1A1A]/40 font-serif mt-2 text-center">
              * Area transparan akan terdeteksi otomatis sebagai slot foto
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}