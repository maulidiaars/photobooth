import { create } from "zustand";
import type { Frame } from "@/types/frame";
import type { SlotRect } from "@/lib/frameSlotDetector";
import { SESSION_DURATION_MS } from "@/lib/constants";

interface SessionState {
  selectedFrame: Frame | null;
  capturedPhotos: string[];
  resultImage: string | null;
  whatsappNumber: string;
  sessionDeadline: number | null;

  setFrame: (
    frame: Frame
  ) => void;

  setFrameSlotLayout: (
    slotLayout: SlotRect[]
  ) => void;

  addPhoto: (
    dataUrl: string
  ) => void;

  setPhotoAt: (
    index: number,
    dataUrl: string
  ) => void;

  removeLastPhoto: () => void;

  resetPhotos: () => void;

  setResultImage: (
    dataUrl: string
  ) => void;

  setWhatsappNumber: (
    value: string
  ) => void;

  startSessionTimer: () => void;

  clearSessionTimer: () => void;

  resetSession: () => void;
}

export const useSessionStore =
  create<SessionState>((set) => ({
    selectedFrame: null,

    capturedPhotos: [],

    resultImage: null,

    whatsappNumber: "",

    sessionDeadline: null,

    setFrame: (frame) =>
      set({
        selectedFrame: frame,
        capturedPhotos: [],
        resultImage: null,
      }),

    /*
     * Update layout frame TANPA menghapus
     * foto yang sudah diambil.
     */
    setFrameSlotLayout: (
      slotLayout
    ) =>
      set((state) => ({
        selectedFrame:
          state.selectedFrame
            ? {
                ...state.selectedFrame,
                slot_layout:
                  slotLayout,
                slot:
                  slotLayout.length,
              }
            : null,
      })),

    addPhoto: (
      dataUrl
    ) =>
      set((state) => ({
        capturedPhotos: [
          ...state.capturedPhotos,
          dataUrl,
        ],
      })),

    setPhotoAt: (
      index,
      dataUrl
    ) =>
      set((state) => {
        const photos = [
          ...state.capturedPhotos,
        ];

        photos[index] =
          dataUrl;

        return {
          capturedPhotos:
            photos,
        };
      }),

    removeLastPhoto: () =>
      set((state) => ({
        capturedPhotos:
          state.capturedPhotos.slice(
            0,
            -1
          ),
      })),

    resetPhotos: () =>
      set({
        capturedPhotos: [],
        resultImage: null,
      }),

    setResultImage: (
      dataUrl
    ) =>
      set({
        resultImage: dataUrl,
      }),

    setWhatsappNumber: (
      value
    ) =>
      set({
        whatsappNumber: value,
      }),

    startSessionTimer: () =>
      set({
        sessionDeadline:
          Date.now() +
          SESSION_DURATION_MS,
      }),

    clearSessionTimer: () =>
      set({
        sessionDeadline: null,
      }),

    resetSession: () =>
      set({
        selectedFrame: null,
        capturedPhotos: [],
        resultImage: null,
        whatsappNumber: "",
        sessionDeadline: null,
      }),
  }));
