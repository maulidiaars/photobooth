import { useCallback, useRef } from "react";
import Webcam from "react-webcam";

const videoConstraints: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export function useCamera() {
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playShutterSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/shutter.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      /* Autoplay might be blocked until first user gesture — safe to ignore. */
    });
  }, []);

  const capture = useCallback((): string | null => {
    if (!webcamRef.current) return null;
    playShutterSound();
    return webcamRef.current.getScreenshot() ?? null;
  }, [playShutterSound]);

  return { webcamRef, capture, videoConstraints };
}
