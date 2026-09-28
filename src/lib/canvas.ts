import { CANVAS_OUTPUT_WIDTH } from "./constants";
import type { SlotRect } from "./frameSlotDetector";

/* ================================================================
 * GEOMETRI KAMERA -> FRAME (SATU SUMBER KEBENARAN)
 * ================================================================
 *
 * Tiga hal di bawah ini WAJIB memakai fungsi yang sama supaya
 * "apa yang terlihat di guide" == "apa yang di-capture" ==
 * "apa yang masuk ke lubang frame":
 *
 *   1. WebcamView      -> menggambar guide  (computeGuideRect)
 *   2. useCamera       -> memotong video    (computeSourceCrop)
 *   3. mergePhotosIntoFrame -> menaruh foto ke lubang frame
 */

/** Preview kamera di-mirror (seperti kaca / selfie). Dipakai oleh
 *  WebcamView (CSS) dan useCamera (capture) supaya keduanya sinkron. */
export const CAMERA_PREVIEW_MIRRORED = true;

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rasio ASLI (dalam piksel) dari satu lubang foto di frame.
 *
 * SlotRect.w / SlotRect.h adalah PECAHAN 0-1 dari kanvas PNG, bukan
 * piksel. Kalau PNG frame tidak persegi, w/h mentah TIDAK sama dengan
 * rasio lubang aslinya — itu penyebab guide landscape padahal
 * lubangnya portrait. Jadi harus dikali ukuran PNG dulu.
 */
export function getSlotPixelRatio(
  slot: SlotRect,
  frameNaturalWidth: number,
  frameNaturalHeight: number
): number | null {
  const w = slot.w * frameNaturalWidth;
  const h = slot.h * frameNaturalHeight;

  if (!(w > 0) || !(h > 0)) {
    return null;
  }

  return w / h;
}

const GUIDE_TOP_INSET = 36;

/**
 * Kotak guide (dalam piksel, relatif ke container kamera) dengan
 * rasio PERSIS `ratio`. Ukurannya menyesuaikan container (responsive)
 * tapi rasionya tidak pernah berubah.
 *
 * Ruang atas dipakai teks petunjuk, ruang bawah dipakai tombol
 * shutter / "Simpan & Lanjut".
 */
export function computeGuideRect(
  containerWidth: number,
  containerHeight: number,
  ratio: number
): PixelRect {
  const bottomInset = clamp(containerHeight * 0.15, 84, 100);

  let availH = containerHeight - GUIDE_TOP_INSET - bottomInset;

  // Container sangat pendek: jangan sampai guide jadi terlalu kecil.
  if (availH < containerHeight * 0.5) {
    availH = containerHeight * 0.5;
  }

  const availW = containerWidth * 0.92;

  let w = availW;
  let h = w / ratio;

  if (h > availH) {
    h = availH;
    w = h * ratio;
  }

  const x = (containerWidth - w) / 2;
  const y = clamp(
    GUIDE_TOP_INSET + (availH - h) / 2,
    0,
    Math.max(0, containerHeight - h)
  );

  return { x, y, w, h };
}

/**
 * Terjemahkan guide (koordinat layar) menjadi area di VIDEO SUMBER
 * (piksel asli kamera).
 *
 * Video ditampilkan dengan object-fit: cover + object-position:
 * center, jadi:
 *
 *   scale  = max(cw / vw, ch / vh)
 *   offset = (container - video * scale) / 2
 *
 * Kalau preview di-mirror (scaleX(-1)), sumbu X dibalik dulu supaya
 * area yang dipotong dari video mentah adalah area yang sama dengan
 * yang tampak di guide.
 *
 * Hasil crop: rasio PERSIS sama dengan guide, dan selalu berada
 * di dalam video.
 */
export function computeSourceCrop(opts: {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  ratio: number;
  mirrored: boolean;
}): PixelRect | null {
  const {
    containerWidth: cw,
    containerHeight: ch,
    videoWidth: vw,
    videoHeight: vh,
    ratio,
    mirrored,
  } = opts;

  if (!(cw > 0) || !(ch > 0) || !(vw > 0) || !(vh > 0) || !(ratio > 0)) {
    return null;
  }

  const guide = computeGuideRect(cw, ch, ratio);

  const scale = Math.max(cw / vw, ch / vh);
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;

  const guideLeft = mirrored ? cw - (guide.x + guide.w) : guide.x;

  const sw = guide.w / scale;
  const sh = guide.h / scale;

  const sx = clamp((guideLeft - offsetX) / scale, 0, Math.max(0, vw - sw));
  const sy = clamp((guide.y - offsetY) / scale, 0, Math.max(0, vh - sh));

  return { x: sx, y: sy, w: sw, h: sh };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw a photo into a slot rect.
 *
 *  Foto hasil kamera sudah dipotong dengan rasio PERSIS sama dengan
 *  lubang ini, jadi `sx/sy/sw/sh` di bawah praktis = seluruh foto
 *  (tidak ada crop kedua). Cover-fit hanya jadi pengaman kalau ada
 *  foto lama dengan rasio berbeda. */
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

  // Lapisan bawah (underlay): foto digambar sedikit lebih besar dari
  // lubang, hanya untuk menutup garis tipis (hairline) di tepi lubang
  // PNG yang semi-transparan. Bagian ini nyaris seluruhnya tertutup
  // artwork frame di atasnya.
  const bleed = 0.012;
  const ox = dw * bleed;
  const oy = dh * bleed;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx - ox, dy - oy, dw + ox * 2, dh + oy * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, dx - ox, dy - oy, dw + ox * 2, dh + oy * 2);
  ctx.restore();

  // Lapisan atas: foto PERSIS di posisi & ukuran lubang, tanpa
  // scale tambahan, jadi komposisinya sama dengan yang terlihat di
  // guide kamera.
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
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
