import { CANVAS_OUTPUT_WIDTH } from "./constants";
import type { SlotRect } from "./frameSlotDetector";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw a photo into a slot rect using "cover" fit so it fills the hole
 *  edge-to-edge without spilling outside it. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.width / img.height;
  const boxRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }

  // Overscan the photo a couple of percent past the slot's own edges
  // before clipping (same trick the live camera preview uses via its
  // scale-[1.02] class) so the photo always bleeds flush under the
  // frame artwork's hole. Without this, sub-pixel rounding or a soft/
  // anti-aliased edge on the frame PNG's hole can leave a hairline gap
  // where the frame's own background peeks through, reading as a thin
  // white border around every photo.
  const bleed = 0.025;
  const ox = dw * bleed;
  const oy = dh * bleed;

  ctx.save();
  // Clip to the *overscanned* rect (not the original slot rect) so the
  // bleed above actually has somewhere to go. Clipping to the exact
  // original rect here defeated the overscan entirely — the frame PNG's
  // hole has a couple of semi-transparent anti-aliased pixels right at
  // its edge, and clipping the photo to precisely the same rect left
  // that soft edge showing through as a thin white ring. The frame
  // artwork drawn on top afterward is fully opaque everywhere outside
  // the actual hole, so letting the photo bleed slightly further here is
  // still safe — it just gets covered back up by the frame there.
  ctx.beginPath();
  ctx.rect(dx - ox, dy - oy, dw + ox * 2, dh + oy * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx - ox, dy - oy, dw + ox * 2, dh + oy * 2);
  ctx.restore();
}

/**
 * Merge captured photo data-URLs into the chosen frame's transparent PNG,
 * using that frame's own auto-detected hole positions (slotLayout) so each
 * photo lands exactly inside its hole — no manual grid guessing.
 */
export async function mergePhotosIntoFrame(
  photoDataUrls: string[],
  framePngUrl: string,
  slotLayout: SlotRect[]
): Promise<string> {
  const frameImg = await loadImage(framePngUrl);

  const width = CANVAS_OUTPUT_WIDTH;
  const height = Math.round((frameImg.height / frameImg.width) * width);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas 2D context not supported");

  // Deliberately no opaque fill here — the canvas stays transparent
  // outside the frame's own holes/artwork, so the exported PNG carries
  // a real transparent background instead of a hidden white rectangle
  // (that hidden fill was showing up as an ugly white box behind every
  // result and admin thumbnail).
  ctx.clearRect(0, 0, width, height);

  const photos = await Promise.all(photoDataUrls.map(loadImage));

  photos.forEach((img, i) => {
    const rect = slotLayout[i];
    if (!rect) return;
    drawCover(
      ctx,
      img,
      rect.x * width,
      rect.y * height,
      rect.w * width,
      rect.h * height
    );
  });

  // Frame artwork drawn on top so its transparent holes reveal the
  // photos placed beneath, and its opaque design stays crisp on top.
  ctx.drawImage(frameImg, 0, 0, width, height);

  // WebP instead of PNG: still keeps the alpha/transparency around the
  // frame's own shape (unlike JPEG), but compresses photographic content
  // *way* smaller than PNG — a full-quality PNG here easily blew past
  // Vercel's ~4.5MB request-body limit on /api/photos and failed with a
  // 413 when saving. 0.9 quality keeps it visually lossless-ish while
  // landing comfortably under that limit.
  return canvas.toDataURL("image/webp", 0.9);
}
