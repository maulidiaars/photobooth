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

/**
 * Pause between one slot's shutter and the next slot's
 * countdown starting automatically.
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

  const gapTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /*
   * Keep the currently selected filter in a ref as well.
   *
   * This makes sure an automatic countdown always uses
   * the latest effect selected by the user.
   */
  const filterRef =
    useRef<PhotoFilterId>(filterId);

  useEffect(() => {
    filterRef.current = filterId;
  }, [filterId]);

  const selectedFrame =
    useSessionStore(
      (s) => s.selectedFrame
    );

  const capturedPhotos =
    useSessionStore(
      (s) => s.capturedPhotos
    );

  const addPhoto =
    useSessionStore((s) => s.addPhoto);

  const setPhotoAt =
    useSessionStore((s) => s.setPhotoAt);

  const resetPhotos =
    useSessionStore((s) => s.resetPhotos);

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

  const handleShot =
    useCallback(async () => {
      /*
       * Always capture using the CURRENT selected effect.
       */
      const activeFilter =
        filterRef.current;

      const photo =
        await capture(activeFilter);

      if (!photo) {
        return;
      }

      setShowFlash(true);

      setTimeout(() => {
        setShowFlash(false);
      }, 380);

      /*
       * Retake only replaces the selected slot.
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

      addPhoto(photo);

      const nextCount =
        capturedPhotos.length + 1;

      /*
       * Continue automatic photo session.
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
