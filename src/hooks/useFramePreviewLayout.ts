"use client";

import { useEffect, useState, type RefObject } from "react";
import type { FrameContentBox } from "./useFrameContentBox";

export interface FramePreviewLayout {
  /** Ideal panel width in px — derived from the panel's own height so
   *  the frame's *visible artwork* (not its raw transparent-padded
   *  canvas) fills it edge-to-edge with no crop. This is what drives
   *  the desktop column's `--preview-w`; on mobile the panel's actual
   *  width comes from the page's own stacked layout instead (see
   *  `containerWidth`/`containerHeight` below for the values that
   *  actually match what's on screen). */
  width: number;
  /** backgroundSize/backgroundPosition that render `naturalWidth x
   *  naturalHeight` full source image scaled + shifted so its trimmed
   *  content box fills the panel (cover-fit: cropped on whichever axis
   *  the panel's actual proportions don't match the artwork, instead of
   *  leaving a gap or drifting off-scale). */
  backgroundSize: string;
  backgroundPosition: string;
  /** How many CSS px equal one natural-image px at the panel's current
   *  size — handy for repositioning child overlays (photo slots) that
   *  were defined as fractions of the *full* source image. */
  scale: number;
  /** Content box's top-left corner, in CSS px relative to the panel's
   *  own top-left — 0 when the box fills the panel exactly (desktop);
   *  negative when the box overflows the panel on that axis and is
   *  centered/cropped (the mobile stacked layout, whose width/height
   *  ratio rarely matches the frame's own artwork ratio). */
  offsetX: number;
  offsetY: number;
  /** The panel's actual measured size, for consumers that need to
   *  convert box-relative fractions into on-screen px themselves. */
  containerWidth: number;
  containerHeight: number;
}

/**
 * The frame preview panel should never be a fixed-width column with the
 * frame floating small in the middle of it — the frame's own *visible*
 * aspect ratio should decide how wide the panel is, and the transparent
 * margin baked into the source PNG should never be visible as a gap.
 * That's the desktop column (sized purely from panel height, see `width`
 * below), which is a no-crop fit by construction.
 *
 * The mobile/tablet stacked panel is different: its width/height come
 * straight from the page's own layout (full viewport width, a fixed
 * `54vh`), which almost never matches the frame artwork's own aspect
 * ratio. Forcing the *desktop* no-crop math onto that box was the "layout
 * berantakan di HP" bug — the background was being sized as if the panel
 * were exactly `panelHeight × box.w/box.h` wide, but the panel is
 * actually the full phone width, so the artwork (and every slot
 * positioned as a fraction of it) rendered at the wrong scale/offset for
 * the panel it was actually sitting in.
 *
 * Fix: measure the panel's *actual* rendered width and height (not just
 * height), and always do a cover-fit — scale by whichever axis needs it
 * more, then center — so the artwork fills the panel exactly on every
 * breakpoint:
 *
 *   scale = max(containerWidth / box.w, containerHeight / box.h)
 *   offsetX = (containerWidth - box.w × scale) / 2
 *   offsetY = (containerHeight - box.h × scale) / 2
 *
 * On desktop this converges to the original no-crop behaviour: the panel's
 * CSS width is itself driven by `width` below, so containerWidth ends up
 * equal to `box.w × scale` and offsetX/offsetY settle at 0. On mobile,
 * where the panel's real proportions don't match the frame, this crops
 * (never stretches or misaligns) the overflow evenly off both edges —
 * exactly like `background-size: cover` would.
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
      const containerWidth = el.clientWidth;
      const containerHeight = el.clientHeight;
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const { box } = contentBox;

      // Ideal desktop column width — unchanged, still purely a function
      // of panel height, still what sets `--preview-w`.
      const idealWidth = Math.floor(box.w * (containerHeight / box.h));

      // Cover-fit against the panel's *actual* measured size, so the
      // math is correct however the panel got that size — the JS-driven
      // desktop width, or the CSS-driven mobile "full width, 54vh" box.
      const scale = Math.max(containerWidth / box.w, containerHeight / box.h);
      const offsetX = (containerWidth - box.w * scale) / 2;
      const offsetY = (containerHeight - box.h * scale) / 2;

      setLayout({
        width: idealWidth,
        scale,
        offsetX,
        offsetY,
        containerWidth,
        containerHeight,
        backgroundSize: `${contentBox.naturalWidth * scale}px ${contentBox.naturalHeight * scale}px`,
        backgroundPosition: `${offsetX - box.x * scale}px ${offsetY - box.y * scale}px`,
      });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, contentBox]);

  return layout;
}