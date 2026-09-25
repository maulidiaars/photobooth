import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "./useCamera";
import { useCountdown } from "./useCountdown";
import { useSessionStore } from "@/store/sessionStore";
import {
  COUNTDOWN_SECONDS,
  ROUTES,
} from "@/lib/constants";
import type { PhotoFilterId } from "@/lib/photoFilters";

/*
 * Jeda kecil setelah satu foto selesai sebelum countdown
 * foto berikutnya dimulai.
 */
const AUTO_SHOT_GAP_MS = 1100;

type SessionMode =
  | "idle"
  | "auto"
  | "retake";

export function usePhotoSession(
  filterId: PhotoFilterId = "original"
) {
  const router = useRouter();

  const {
    webcamRef,
    capture,
    videoConstraints,
  } = useCamera();

  const [showFlash, setShowFlash] =
    useState(false);

  const [mode, setMode] =
    useState<SessionMode>("idle");

  const [isPausing, setIsPausing] =
    useState(false);

  const [retakeIndex, setRetakeIndex] =
    useState<number | null>(null);

  /*
   * Simpan filter TERBARU di ref.

   * Ini penting karena saat countdown berjalan,
   * callback foto bisa berjalan beberapa saat kemudian.

   * Ref selalu menunjuk ke filter terakhir yang dipilih.
   */
  const filterRef =
    useRef<PhotoFilterId>(filterId);

  useEffect(() => {
    filterRef.current = filterId;
  }, [filterId]);

  const gapTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const selectedFrame =
    useSessionStore(
      (s) => s.selectedFrame
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

  const totalSlots =
    selectedFrame?.slot_layout?.length ||
    selectedFrame?.slot ||
    4;

  const isComplete =
    capturedPhotos.length >= totalSlots;

  const clearGapTimer =
    useCallback(() => {
      if (gapTimerRef.current) {
        clearTimeout(
          gapTimerRef.current
        );

        gapTimerRef.current = null;
      }
    }, []);

  useEffect(() => {
    return () => {
      clearGapTimer();
    };
  }, [clearGapTimer]);

  /*
   * Satu foto selesai diambil.
   */
  const handleShot =
    useCallback(async () => {
      /*
       * SELALU ambil filter TERBARU.
       *
       * Jadi misalnya:
       *
       * Foto pertama = Original
       *
       * Setelah semua selesai:
       * user pilih B&W
       *
       * klik slot 2
       * → retake
       *
       * foto baru = B&W
       */
      const activeFilter =
        filterRef.current;

      const photo =
        await capture(activeFilter);

      if (!photo) return;

      setShowFlash(true);

      setTimeout(() => {
        setShowFlash(false);
      }, 380);

      /*
       * RETAKE
       *
       * Foto hanya mengganti slot yang dipilih.
       * Foto slot lainnya tidak disentuh.
       */
      if (retakeIndex !== null) {
        setPhotoAt(
          retakeIndex,
          photo
        );

        setRetakeIndex(null);
        setMode("idle");

        return;
      }

      /*
       * FOTO NORMAL
       */
      addPhoto(photo);

      const nextCount =
        capturedPhotos.length + 1;

      /*
       * Kalau masih ada slot:
       * lanjut ke countdown berikutnya.
       */
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
    }, [
      capture,
      addPhoto,
      setPhotoAt,
      retakeIndex,
      mode,
      capturedPhotos.length,
      totalSlots,
    ]);

  const {
    count,
    isRunning,
    start,
  } = useCountdown({
    seconds: COUNTDOWN_SECONDS,
    onComplete: handleShot,
  });

  /*
   * Mulai sesi foto normal.
   */
  const takeAllShots =
    useCallback(() => {
      if (
        isRunning ||
        isComplete ||
        isPausing
      ) {
        return;
      }

      setMode("auto");
      start();
    }, [
      isRunning,
      isComplete,
      isPausing,
      start,
    ]);

  /*
   * Mulai retake slot tertentu.
   *
   * Filter tidak disentuh sama sekali.
   * Jadi filter yang sedang aktif akan digunakan.
   */
  const confirmRetake =
    useCallback(
      (index: number) => {
        if (
          isRunning ||
          isPausing
        ) {
          return;
        }

        setRetakeIndex(index);
        setMode("retake");

        start();
      },
      [
        isRunning,
        isPausing,
        start,
      ]
    );

  /*
   * Tetap dipertahankan untuk kompatibilitas
   * dengan hook/store lainnya.
   *
   * Tombol "ambil ulang semua" sendiri sudah dihapus
   * dari CameraPage.
   */
  const retakeAll =
    useCallback(() => {
      clearGapTimer();

      setRetakeIndex(null);
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

  /*
   * Menentukan slot yang sedang menunggu foto.
   */
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
  };
}
