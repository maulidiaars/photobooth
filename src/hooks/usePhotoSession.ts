import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "./useCamera";
import { useCountdown } from "./useCountdown";
import {
  useSessionStore,
} from "@/store/sessionStore";
import {
  COUNTDOWN_SECONDS,
  ROUTES,
} from "@/lib/constants";
import type { PhotoFilterId } from "@/lib/photoFilters";
import {
  detectFrameSlotsFromUrl,
  type SlotRect,
} from "@/lib/frameSlotDetector";
import { getSlotPixelRatio } from "@/lib/canvas";

const AUTO_SHOT_GAP_MS =
  1100;

type SessionMode =
  | "idle"
  | "auto"
  | "retake";

export function usePhotoSession(
  filterId: PhotoFilterId =
    "original"
) {
  const router =
    useRouter();

  const {
    webcamRef,
    capture,
    videoConstraints,
  } = useCamera();

  const [showFlash, setShowFlash] =
    useState(false);

  const [mode, setMode] =
    useState<SessionMode>(
      "idle"
    );

  const [isPausing, setIsPausing] =
    useState(false);

  const [retakeIndex, setRetakeIndex] =
    useState<number | null>(
      null
    );

  const [slotLayout, setSlotLayout] =
    useState<SlotRect[]>([]);

  const [slotsReady, setSlotsReady] =
    useState(false);

  /*
   * Ukuran asli (piksel) PNG frame. Dibutuhkan karena SlotRect
   * hanya menyimpan PECAHAN 0-1 — rasio lubang yang sebenarnya
   * baru ketahuan setelah dikali ukuran PNG.
   */
  const [frameSize, setFrameSize] =
    useState<{
      w: number;
      h: number;
    } | null>(null);

  const filterRef =
    useRef<PhotoFilterId>(
      filterId
    );

  useEffect(() => {
    filterRef.current =
      filterId;
  }, [filterId]);

  const gapTimerRef =
    useRef<ReturnType
      typeof setTimeout
    > | null>(null);

  const selectedFrame =
    useSessionStore(
      (s) => s.selectedFrame
    );

  const setFrameSlotLayout =
    useSessionStore(
      (s) =>
        s.setFrameSlotLayout
    );

  const capturedPhotos =
    useSessionStore(
      (s) => s.capturedPhotos
    );

  const addPhoto =
    useSessionStore(
      (s) => s.addPhoto
    );

  const setPhotoAt =
    useSessionStore(
      (s) => s.setPhotoAt
    );

  const resetPhotos =
    useSessionStore(
      (s) => s.resetPhotos
    );

  /*
   * ============================================================
   * DETEKSI ULANG SLOT LANGSUNG DARI PNG FRAME
   * ============================================================
   */
  useEffect(() => {
    let cancelled = false;

    if (!selectedFrame) {
      setSlotLayout([]);
      setSlotsReady(false);
      return;
    }

    setSlotsReady(false);

    /*
     * Sementara pakai data lama sebagai fallback
     * supaya preview tidak kosong total.
     */
    setSlotLayout(
      selectedFrame.slot_layout ??
        []
    );

    detectFrameSlotsFromUrl(
      selectedFrame.frame_png
    )
      .then((detected) => {
        if (cancelled) return;

        if (
          !detected.length
        ) {
          throw new Error(
            "Tidak ada slot"
          );
        }

        /*
         * Ini yang paling penting:
         *
         * slot_layout lama dari database
         * diganti dengan slot yang benar-benar
         * ditemukan dari PNG frame.
         */
        setSlotLayout(
          detected
        );

        setFrameSlotLayout(
          detected
        );

        setSlotsReady(true);
      })
      .catch(() => {
        if (cancelled) return;

        /*
         * Kalau deteksi gagal, gunakan data
         * database sebagai fallback.
         */
        const fallback =
          selectedFrame.slot_layout ??
          [];

        setSlotLayout(
          fallback
        );

        setSlotsReady(
          fallback.length > 0
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedFrame?.frame_png,
  ]);

  useEffect(() => {
    const src =
      selectedFrame?.frame_png;

    if (!src) {
      setFrameSize(null);
      return;
    }

    let cancelled = false;

    setFrameSize(null);

    const img = new Image();

    img.onload = () => {
      if (cancelled) return;

      if (
        img.naturalWidth > 0 &&
        img.naturalHeight > 0
      ) {
        setFrameSize({
          w: img.naturalWidth,
          h: img.naturalHeight,
        });
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setFrameSize(null);
      }
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [
    selectedFrame?.frame_png,
  ]);

  /*
   * Kamera baru dianggap siap kalau slot sudah terdeteksi DAN
   * ukuran PNG frame sudah diketahui (supaya rasio guide/capture
   * benar sejak foto pertama).
   */
  const cameraReady =
    slotsReady &&
    frameSize !== null;

  const totalSlots =
    slotLayout.length ||
    selectedFrame?.slot ||
    4;

  const isComplete =
    slotsReady &&
    capturedPhotos.length >=
      totalSlots;

  /*
   * ============================================================
   * SLOT TARGET & RASIO CAPTURE
   * ============================================================
   *
   * Satu-satunya sumber rasio untuk guide kamera DAN capture:
   *
   *   slot frame yang akan diisi (retake -> slot itu,
   *   normal -> slot berikutnya)
   *        ↓
   *   lebar/tinggi PIKSEL lubang di PNG frame
   *        ↓
   *   guide kamera  +  crop capture
   */
  const targetSlotIndex =
    retakeIndex !== null
      ? retakeIndex
      : capturedPhotos.length;

  const targetSlot =
    slotLayout[
      targetSlotIndex
    ] ?? slotLayout[0];

  const captureAspectRatio =
    targetSlot && frameSize
      ? getSlotPixelRatio(
          targetSlot,
          frameSize.w,
          frameSize.h
        )
      : null;

  const clearGapTimer =
    useCallback(() => {
      if (gapTimerRef.current) {
        clearTimeout(
          gapTimerRef.current
        );

        gapTimerRef.current =
          null;
      }
    }, []);

  useEffect(() => {
    return () => {
      clearGapTimer();
    };
  }, [
    clearGapTimer,
  ]);

  const handleShot =
    useCallback(
      async () => {
        if (
          !cameraReady ||
          !captureAspectRatio
        ) {
          return;
        }

        const activeFilter =
          filterRef.current;

        /*
         * Rasio PIKSEL lubang foto frame — sama persis dengan
         * rasio guide yang sedang tampil di kamera.
         */
        const photo =
          await capture(
            activeFilter,
            captureAspectRatio
          );

        if (!photo) {
          return;
        }

        setShowFlash(true);

        setTimeout(() => {
          setShowFlash(false);
        }, 380);

        /*
         * RETAKE
         */
        if (
          retakeIndex !== null
        ) {
          setPhotoAt(
            retakeIndex,
            photo
          );

          setRetakeIndex(
            null
          );

          setMode("idle");

          return;
        }

        /*
         * FOTO NORMAL
         */
        addPhoto(photo);

        const nextCount =
          capturedPhotos.length +
          1;

        if (
          mode === "auto" &&
          nextCount < totalSlots
        ) {
          setIsPausing(true);

          gapTimerRef.current =
            setTimeout(() => {
              setIsPausing(false);
              start();
            }, AUTO_SHOT_GAP_MS);
        } else {
          setMode("idle");
        }
      },
      [
        cameraReady,
        captureAspectRatio,
        capture,
        addPhoto,
        setPhotoAt,
        retakeIndex,
        mode,
        capturedPhotos.length,
        totalSlots,
      ]
    );

  const {
    count,
    isRunning,
    start,
  } = useCountdown({
    seconds:
      COUNTDOWN_SECONDS,
    onComplete:
      handleShot,
  });

  const takeAllShots =
    useCallback(() => {
      if (
        !cameraReady ||
        isRunning ||
        isComplete ||
        isPausing
      ) {
        return;
      }

      setMode("auto");

      start();
    }, [
      cameraReady,
      isRunning,
      isComplete,
      isPausing,
      start,
    ]);

  const confirmRetake =
    useCallback(
      (index: number) => {
        if (
          !cameraReady ||
          isRunning ||
          isPausing
        ) {
          return;
        }

        setRetakeIndex(
          index
        );

        setMode("retake");

        start();
      },
      [
        cameraReady,
        isRunning,
        isPausing,
        start,
      ]
    );

  const retakeAll =
    useCallback(() => {
      clearGapTimer();

      setRetakeIndex(
        null
      );

      setIsPausing(false);

      setMode("idle");

      resetPhotos();
    }, [
      resetPhotos,
      clearGapTimer,
    ]);

  const goToResult =
    useCallback(() => {
      if (isComplete) {
        router.push(
          ROUTES.result
        );
      }
    }, [
      isComplete,
      router,
    ]);

  const activeIndex =
    retakeIndex !== null
      ? retakeIndex
      : mode === "auto" &&
          !isComplete
        ? capturedPhotos.length
        : null;

  return {
    webcamRef,
    videoConstraints,

    count,
    isRunning,
    isPausing,

    mode,

    showFlash,

    takeAllShots,
    confirmRetake,
    retakeAll,

    retakeIndex,
    activeIndex,

    goToResult,

    capturedPhotos,

    totalSlots,

    isComplete,

    selectedFrame,

    slotLayout,

    /*
     * `slotsReady` dipakai UI untuk mengaktifkan tombol.
     * Sekarang berarti: slot terdeteksi DAN rasio kamera siap.
     */
    slotsReady: cameraReady,

    /*
     * Rasio PIKSEL lubang foto slot yang akan diisi berikutnya.
     * Dipakai guide kamera dan capture.
     */
    captureAspectRatio,
  };
}
