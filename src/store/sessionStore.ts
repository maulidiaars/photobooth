import { create } from "zustand";
import type { Frame } from "@/types/frame";
import { SESSION_DURATION_MS } from "@/lib/constants";

interface SessionState {
  selectedFrame: Frame | null;
  capturedPhotos: string[];
  resultImage: string | null;
  whatsappNumber: string;
  // Timestamp (Date.now()) kapan sesi harus berakhir — di-set sekali
  // waktu pengguna klik "mulai sesi foto" di halaman utama, lalu
  // dibaca ulang oleh komponen SessionTimer di tiap halaman sesi
  // (frame/kamera/hasil) supaya hitungan mundurnya tetap sinkron
  // walau pengguna pindah halaman. null berarti belum ada sesi aktif.
  sessionDeadline: number | null;
  setFrame: (frame: Frame) => void;
  addPhoto: (dataUrl: string) => void;
  setPhotoAt: (index: number, dataUrl: string) => void;
  removeLastPhoto: () => void;
  resetPhotos: () => void;
  setResultImage: (dataUrl: string) => void;
  setWhatsappNumber: (value: string) => void;
  startSessionTimer: () => void;
  clearSessionTimer: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedFrame: null,
  capturedPhotos: [],
  resultImage: null,
  whatsappNumber: "",
  sessionDeadline: null,
  setFrame: (frame) => set({ selectedFrame: frame, capturedPhotos: [], resultImage: null }),
  addPhoto: (dataUrl) =>
    set((state) => ({ capturedPhotos: [...state.capturedPhotos, dataUrl] })),
  setPhotoAt: (index, dataUrl) =>
    set((state) => {
      const photos = [...state.capturedPhotos];
      photos[index] = dataUrl;
      return { capturedPhotos: photos };
    }),
  removeLastPhoto: () =>
    set((state) => ({ capturedPhotos: state.capturedPhotos.slice(0, -1) })),
  resetPhotos: () => set({ capturedPhotos: [], resultImage: null }),
  setResultImage: (dataUrl) => set({ resultImage: dataUrl }),
  setWhatsappNumber: (value) => set({ whatsappNumber: value }),
  startSessionTimer: () => set({ sessionDeadline: Date.now() + SESSION_DURATION_MS }),
  clearSessionTimer: () => set({ sessionDeadline: null }),
  resetSession: () =>
    set({
      selectedFrame: null,
      capturedPhotos: [],
      resultImage: null,
      whatsappNumber: "",
      sessionDeadline: null,
    }),
}));
