import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "./useCamera";
import { useCountdown } from "./useCountdown";
import { useSessionStore } from "@/store/sessionStore";
import { COUNTDOWN_SECONDS, ROUTES } from "@/lib/constants";

/** Pause between one slot's shutter and the next slot's countdown
 *  starting automatically, so the person has a beat to reset their
 *  pose before "3..2..1" fires again. */
const AUTO_SHOT_GAP_MS = 1100;

type SessionMode = "idle" | "auto" | "retake";

export function usePhotoSession() {
  const router = useRouter();
  const { webcamRef, capture, videoConstraints } = useCamera();
  const [showFlash, setShowFlash] = useState(false);
  const [mode, setMode] = useState<SessionMode>("idle");
  const [isPausing, setIsPausing] = useState(false);
  // When set, the next captured shot replaces this slot instead of
  // being appended — powers "klik foto di frame -> ambil ulang".
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const capturedPhotos = useSessionStore((s) => s.capturedPhotos);
  const addPhoto = useSessionStore((s) => s.addPhoto);
  const setPhotoAt = useSessionStore((s) => s.setPhotoAt);
  const resetPhotos = useSessionStore((s) => s.resetPhotos);

  const totalSlots = selectedFrame?.slot_layout?.length || selectedFrame?.slot || 4;
  const isComplete = capturedPhotos.length >= totalSlots;

  const clearGapTimer = useCallback(() => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearGapTimer(), [clearGapTimer]);

  const handleShot = useCallback(() => {
    const photo = capture();
    if (!photo) return;

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 380);

    // Single-slot retake: drop the new shot straight into that slot
    // and stop — the rest of the strip stays untouched.
    if (retakeIndex !== null) {
      setPhotoAt(retakeIndex, photo);
      setRetakeIndex(null);
      setMode("idle");
      return;
    }

    addPhoto(photo);
    const nextCount = capturedPhotos.length + 1;

    // Auto sequence: as long as slots remain, keep going on our own —
    // 3-2-1-jepret into slot 1, pause, 3-2-1-jepret into slot 2, dst.
    if (mode === "auto" && nextCount < totalSlots) {
      setIsPausing(true);
      gapTimerRef.current = setTimeout(() => {
        setIsPausing(false);
        start();
      }, AUTO_SHOT_GAP_MS);
    } else {
      setMode("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, addPhoto, setPhotoAt, retakeIndex, mode, capturedPhotos.length, totalSlots]);

  const { count, isRunning, start } = useCountdown({
    seconds: COUNTDOWN_SECONDS,
    onComplete: handleShot,
  });

  /** Kicks off the whole strip: countdown -> jepret -> countdown ->
   *  jepret ... until every slot in the frame is filled. */
  const takeAllShots = useCallback(() => {
    if (isRunning || isComplete || isPausing) return;
    setMode("auto");
    start();
  }, [isRunning, isComplete, isPausing, start]);

  /** Re-shoot exactly one already-filled slot (called after the user
   *  confirms the "ambil ulang?" modal). Everything else is left
   *  alone — this never restarts the whole sequence. */
  const confirmRetake = useCallback(
    (index: number) => {
      if (isRunning || isPausing) return;
      setRetakeIndex(index);
      setMode("retake");
      start();
    },
    [isRunning, isPausing, start]
  );

  const retakeAll = useCallback(() => {
    clearGapTimer();
    setRetakeIndex(null);
    setIsPausing(false);
    setMode("idle");
    resetPhotos();
  }, [resetPhotos, clearGapTimer]);

  const goToResult = useCallback(() => {
    if (isComplete) router.push(ROUTES.result);
  }, [isComplete, router]);

  // Which slot is "next up" — used to highlight it inside the live
  // frame preview while auto mode is armed/running/pausing.
  const activeIndex =
    retakeIndex !== null
      ? retakeIndex
      : mode === "auto" && !isComplete
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
