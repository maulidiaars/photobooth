"use client";

import { useEffect, useState, type RefObject } from "react";
import type { FrameContentBox } from "./useFrameContentBox";

export interface FramePreviewLayout {
  /** Panel width in px — derived from the panel's own height so the
   *  frame's *visible artwork* (not its raw transparent-padded canvas)
   *  fills it edge-to-edge. */
  width: number;
  /** backgroundSize/backgroundPosition that render `naturalWidth x
   *  naturalHeight` full source image scaled + shifted so its trimmed
   *  content box exactly fills the panel, cropping the transparent
   *  margin out of view instead of leaving it as a white/empty gap. */
  backgroundSize: string;
  backgroundPosition: string;
  /** How many CSS px equal one natural-image px at the panel's current
   *  size — handy for repositioning child overlays (photo slots) that
   *  were defined as fractions of the *full* source image. */
  scale: number;
}

/**
 * The frame preview panel should never be a fixed-width column with the
 * frame floating small in the middle of it — the frame's own *visible*
 * aspect ratio should decide how wide the panel is, and the transparent
 * margin baked into the source PNG should never be visible as a gap.
 *
 * This watches the panel's height (already fixed by the page layout) and
 * derives both the width and the precise background crop that make the
 * frame's trimmed content box fill the panel exactly:
 *
 *   width = panelHeight × (box.w / box.h)
 *   scale = panelHeight / box.h
 *   backgroundSize = naturalWidth*scale x naturalHeight*scale
 *   backgroundPosition = -box.x*scale, -box.y*scale
 *
 * Recomputes on every resize (window resize, orientation change, DevTools
 * panel toggling, etc.) via ResizeObserver, and whenever a differently
 * shaped frame is selected.
 */
export function useFramePreviewLayout(
  ref: RefObject<HTMLElement | null>,
  contentBox: FrameContentBox | null
): FramePreviewLayout | null {
  const [layout, setLayout] = useState<FramePreviewLayout | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !contentBox) {
      setLayout(null);
      return;
    }

    const recompute = () => {
      const height = el.clientHeight;
      if (height <= 0) return;

      const scale = height / contentBox.box.h;
      // Floor (never round up) so the panel is never wider than the
      // frame's actual scaled content — rounding up here is exactly what
      // was leaving a hairline white gap on the right edge: a container
      // that's fractionally wider than the background content it holds.
      // Flooring means the artwork is, worst case, a sub-pixel wider than
      // the panel (invisibly clipped) rather than the panel ever being
      // wider than the artwork.
      const width = Math.floor(contentBox.box.w * scale);

      setLayout({
        width,
        scale,
        backgroundSize: `${contentBox.naturalWidth * scale}px ${contentBox.naturalHeight * scale}px`,
        backgroundPosition: `${-contentBox.box.x * scale}px ${-contentBox.box.y * scale}px`,
      });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, contentBox]);

  return layout;
}
