import { create } from "zustand";
import type { Frame } from "@/types/frame";

interface SessionState {
  selectedFrame: Frame | null;
  capturedPhotos: string[];
  resultImage: string | null;
  whatsappNumber: string;
  setFrame: (frame: Frame) => void;
  addPhoto: (dataUrl: string) => void;
  setPhotoAt: (index: number, dataUrl: string) => void;
  removeLastPhoto: () => void;
  resetPhotos: () => void;
  setResultImage: (dataUrl: string) => void;
  setWhatsappNumber: (value: string) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedFrame: null,
  capturedPhotos: [],
  resultImage: null,
  whatsappNumber: "",
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
  resetSession: () =>
    set({ selectedFrame: null, capturedPhotos: [], resultImage: null, whatsappNumber: "" }),
}));
