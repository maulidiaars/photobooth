"use client";

import { useEffect, useState } from "react";

/**
 * Frame PNGs are exported with a chunk of fully-transparent canvas around
 * the actual ticket/strip artwork (e.g. a 375x666 file where the visible
 * design only occupies roughly the middle 195x576). That's invisible where
 * the image is left to size itself freely, but the moment a parent panel
 * is sized from the image's *raw* aspect ratio, that transparent margin
 * becomes a highly visible white gap around the frame — which is exactly
 * the "white container around the frame" bug this hook exists to fix.
 *
 * This scans the image's alpha channel once (client-side canvas, mirrors
 * the same alpha-threshold approach as frameSlotDetector's hole detection)
 * and returns the bounding box of its non-transparent content, in the
 * image's own natural pixel space. Layout code can then size panels from
 * `box.w / box.h` (the artwork's real aspect ratio) and use `box`/
 * `naturalWidth`/`naturalHeight` together to crop the rendered background
 * so the transparent margin is cropped away instead of displayed.
 */
export interface FrameContentBox {
  naturalWidth: number;
  naturalHeight: number;
  box: { x: number; y: number; w: number; h: number };
}

const ALPHA_THRESHOLD = 10;
// Cap the number of pixels actually scanned for very large source
// images — we only need the bounding box, not per-pixel accuracy, so a
// coarse stride on huge images keeps this fast without losing precision
// that matters for layout.
const MAX_SCAN_DIM = 900;

// Module-level cache: the same frame image is loaded on both the frame
// selection page and the camera page, and its content box never changes,
// so there's no reason to re-scan it every time it's selected again.
const cache = new Map<string, FrameContentBox>();

function computeContentBox(img: HTMLImageElement): FrameContentBox {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  const scale = Math.min(1, MAX_SCAN_DIM / Math.max(naturalWidth, naturalHeight));
  const w = Math.max(1, Math.round(naturalWidth * scale));
  const h = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context tidak didukung browser ini");
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      const alpha = data[(rowOffset + x) * 4 + 3] ?? 0;
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    // Nothing but transparent pixels found (shouldn't happen for a real
    // frame) — fall back to the full canvas rather than a zero-size box.
    return { naturalWidth, naturalHeight, box: { x: 0, y: 0, w: naturalWidth, h: naturalHeight } };
  }

  // Scale the detected box back up from the (possibly downsampled) scan
  // canvas to the image's real natural pixel space.
  const inv = 1 / scale;
  return {
    naturalWidth,
    naturalHeight,
    box: {
      x: minX * inv,
      y: minY * inv,
      w: (maxX - minX + 1) * inv,
      h: (maxY - minY + 1) * inv,
    },
  };
}

export function useFrameContentBox(src: string | null | undefined): FrameContentBox | null {
  const [result, setResult] = useState<FrameContentBox | null>(src ? (cache.get(src) ?? null) : null);

  useEffect(() => {
    if (!src) {
      setResult(null);
      return;
    }

    const cached = cache.get(src);
    if (cached) {
      setResult(cached);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const value = computeContentBox(img);
        cache.set(src, value);
        setResult(value);
      } catch {
        // Canvas read failed (e.g. tainted by a cross-origin source without
        // CORS headers) — fall back to the untrimmed full image so the
        // preview still renders instead of breaking.
        const fallback: FrameContentBox = {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          box: { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight },
        };
        setResult(fallback);
      }
    };
    img.onerror = () => {
      if (!cancelled) setResult(null);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return result;
}
