"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Fires a short, festive confetti burst — used once, right when a
 * session is finished and saved, so the ending feels like a little
 * party instead of just a form submitting successfully.
 */
export function Celebration({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;
    const colors = ["#9C2B3C", "#DDA84C", "#8FB88C", "#D98A90", "#FFFBF2"];
    const duration = 1500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors,
        startVelocity: 45,
        scalar: 1.1,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors,
        startVelocity: 45,
        scalar: 1.1,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    confetti({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.55 },
      colors,
      startVelocity: 38,
      scalar: 1.1,
    });
  }, [trigger]);

  return null;
}
