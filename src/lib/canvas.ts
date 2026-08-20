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

// Safari/WebKit — yaitu SEMUA browser di iPhone/iPad, termasuk "Chrome"
// atau "Firefox" versi iOS sekalipun, karena Apple mewajibkan semua
// browser di iOS pakai mesin WebKit-nya Safari — sampai sekarang belum
// bisa encode canvas ke format WebP. Kalau diminta toDataURL("image/webp"),
// dia gak error, tapi DIAM-DIAM balikin PNG full-size tanpa kompresi
// sama sekali. Itu yang bikin hasil foto dari iPad jadi jauh lebih besar
// dari yang seharusnya dan nabrak limit ukuran request Vercel (413).
// Makanya kita cek dulu betulan didukung apa nggak, jangan cuma asumsi.
function canvasSupportsWebpEncoding(): boolean {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  return probe.toDataURL("image/webp", 0.8).startsWith("data:image/webp");
}

// Sisain jarak aman di bawah limit request-body Vercel (~4.5MB) biar
// gak mepet-mepet 413 lagi walau sekecil apapun kelebihannya.
const MAX_RESULT_BYTES = 4 * 1024 * 1024;

function base64ByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.ceil((base64.length * 3) / 4);
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

  if (canvasSupportsWebpEncoding()) {
    // WebP tetap dipertahankan buat browser yang beneran dukung
    // (Chrome/Firefox/Edge, dsb) — transparansinya kejaga & ukurannya
    // paling kecil. Kalau satu frame tertentu (banyak slot / detail
    // rumit) masih kegedean walau udah WebP, turunin kualitasnya
    // sedikit demi sedikit sampai aman di bawah limit.
    let quality = 0.9;
    let dataUrl = canvas.toDataURL("image/webp", quality);
    while (base64ByteLength(dataUrl) > MAX_RESULT_BYTES && quality > 0.5) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/webp", quality);
    }
    return dataUrl;
  }

  // Fallback buat Safari/iPad/iPhone: JPEG bisa di-encode di semua
  // browser dan kompresinya bagus. JPEG gak punya alpha channel, jadi
  // area transparan di canvas (di luar bentuk frame) dikasih dasar
  // putih dulu sebelum di-export, supaya gak jadi kotak hitam.
  const jpegCanvas = document.createElement("canvas");
  jpegCanvas.width = width;
  jpegCanvas.height = height;
  const jctx = jpegCanvas.getContext("2d") as CanvasRenderingContext2D;
  jctx.fillStyle = "#ffffff";
  jctx.fillRect(0, 0, width, height);
  jctx.drawImage(canvas, 0, 0);

  let quality = 0.92;
  let dataUrl = jpegCanvas.toDataURL("image/jpeg", quality);
  while (base64ByteLength(dataUrl) > MAX_RESULT_BYTES && quality > 0.5) {
    quality -= 0.1;
    dataUrl = jpegCanvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}