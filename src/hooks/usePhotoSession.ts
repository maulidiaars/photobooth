import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useCamera } from "./useCamera";
import { useCountdown } from "./useCountdown";
import { useSessionStore } from "@/store/sessionStore";
import { COUNTDOWN_SECONDS, ROUTES } from "@/lib/constants";

export function usePhotoSession() {
  const router = useRouter();
  const { webcamRef, capture, videoConstraints } = useCamera();
  const [showFlash, setShowFlash] = useState(false);
  // When set, the next captured shot replaces this slot instead of
  // being appended — powers "hover a filled slot -> ambil ulang".
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);

  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const capturedPhotos = useSessionStore((s) => s.capturedPhotos);
  const addPhoto = useSessionStore((s) => s.addPhoto);
  const setPhotoAt = useSessionStore((s) => s.setPhotoAt);
  const resetPhotos = useSessionStore((s) => s.resetPhotos);

  const totalSlots = selectedFrame?.slot_layout?.length || selectedFrame?.slot || 4;
  const isComplete = capturedPhotos.length >= totalSlots;

  const handleShot = useCallback(() => {
    const photo = capture();
    if (photo) {
      setShowFlash(true);
      if (retakeIndex !== null) {
        setPhotoAt(retakeIndex, photo);
        setRetakeIndex(null);
      } else {
        addPhoto(photo);
      }
      setTimeout(() => setShowFlash(false), 400);
    }
  }, [capture, addPhoto, setPhotoAt, retakeIndex]);

  const { count, isRunning, start } = useCountdown({
    seconds: COUNTDOWN_SECONDS,
    onComplete: handleShot,
  });

  const takeShot = useCallback(() => {
    if (isRunning || isComplete) return;
    start();
  }, [isRunning, isComplete, start]);

  // Retake a single already-captured slot: click its thumbnail, the
  // camera re-runs the countdown and drops the new shot into that
  // exact hole instead of appending a new one.
  const retakeSlot = useCallback(
    (index: number) => {
      if (isRunning) return;
      setRetakeIndex(index);
      start();
    },
    [isRunning, start]
  );

  const retake = useCallback(() => {
    setRetakeIndex(null);
    resetPhotos();
  }, [resetPhotos]);

  const goToResult = useCallback(() => {
    if (isComplete) router.push(ROUTES.result);
  }, [isComplete, router]);

  return {
    webcamRef,
    videoConstraints,
    count,
    isRunning,
    showFlash,
    takeShot,
    retake,
    retakeSlot,
    retakeIndex,
    goToResult,
    capturedPhotos,
    totalSlots,
    isComplete,
    selectedFrame,
  };
}
