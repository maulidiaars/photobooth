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

/**
 * Kotak guide (dalam piksel, relatif ke container kamera) dengan
 * rasio PERSIS `ratio`. Guide memenuhi container penuh (sampai ke
 * bawah, di belakang tombol shutter) selama rasionya tetap sama:
 * ukurannya menyesuaikan container (responsive), rasionya tidak
 * pernah berubah.
 */
export function computeGuideRect(
  containerWidth: number,
  containerHeight: number,
  ratio: number
): PixelRect {
  let w = containerWidth;
  let h = w / ratio;

  if (h > containerHeight) {
    h = containerHeight;
    w = h * ratio;
  }

  const x = (containerWidth - w) / 2;
  const y = (containerHeight - h) / 2;

  return { x, y, w, h };
}

/**
 * 0.5x tidak disimulasikan dengan CSS `scale(<1)`.
 *
 * `scale(<1)` hanya mengecilkan seluruh preview ke tengah layar,
 * sehingga terlihat seperti container kamera yang menjauh. Itu bukan
 * perilaku Ultra Wide.
 *
 * Pelebaran 0.5x harus datang dari stream kamera:
 *   1. zoom hardware < 1x,
 *   2. kamera fisik Ultra Wide, atau
 *   3. fallback stream sensor 4:3.
 *
 * Capture selalu memakai stream kamera aktual tanpa faktor digital
 * tambahan agar preview dan hasil foto tetap sinkron.
 */

/**
 * Terjemahkan guide (koordinat layar) menjadi area di VIDEO SUMBER
 * (piksel asli kamera).
 *
 * Video ditampilkan dengan object-fit: cover + object-position: center,
 * jadi scale = max(cw / vw, ch / vh).
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

  if (
    !(cw > 0) ||
    !(ch > 0) ||
    !(vw > 0) ||
    !(vh > 0) ||
    !(ratio > 0)
  ) {
    return null;
  }

  const guide =
    computeGuideRect(
      cw,
      ch,
      ratio
    );

  const scale =
    Math.max(
      cw / vw,
      ch / vh
    );

  const offsetX =
    (cw - vw * scale) / 2;

  const offsetY =
    (ch - vh * scale) / 2;

  const guideLeft =
    mirrored
      ? cw -
        (guide.x + guide.w)
      : guide.x;

  const sw =
    guide.w / scale;

  const sh =
    guide.h / scale;

  const sx =
    clamp(
      (guideLeft - offsetX) /
        scale,
      0,
      Math.max(
        0,
        vw - sw
      )
    );

  const sy =
    clamp(
      (guide.y - offsetY) /
        scale,
      0,
      Math.max(
        0,
        vh - sh
      )
    );

  return {
    x: sx,
    y: sy,
    w: sw,
    h: sh,
  };
}

function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const img =
        new Image();

      img.crossOrigin =
        "anonymous";

      img.onload =
        () => resolve(img);

      img.onerror =
        reject;

      img.src =
        src;
    }
  );
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
  const imgRatio =
    img.width /
    img.height;

  const boxRatio =
    dw / dh;

  let sx = 0;
  let sy = 0;
  let sw =
    img.width;
  let sh =
    img.height;

  if (
    imgRatio >
    boxRatio
  ) {
    sw =
      img.height *
      boxRatio;

    sx =
      (img.width -
        sw) /
      2;
  } else {
    sh =
      img.width /
      boxRatio;

    sy =
      (img.height -
        sh) /
      2;
  }

  // Lapisan bawah (underlay): foto digambar sedikit lebih besar dari
  // lubang, hanya untuk menutup garis tipis (hairline) di tepi lubang
  // PNG yang semi-transparan. Bagian ini nyaris seluruhnya tertutup
  // artwork frame di atasnya.
  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";

  const bleed =
    0.012;

  const ox =
    dw * bleed;

  const oy =
    dh * bleed;

  ctx.save();

  ctx.beginPath();

  ctx.rect(
    dx - ox,
    dy - oy,
    dw + ox * 2,
    dh + oy * 2
  );

  ctx.clip();

  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    dx - ox,
    dy - oy,
    dw + ox * 2,
    dh + oy * 2
  );

  ctx.restore();

  // Lapisan atas: foto PERSIS di posisi & ukuran lubang, tanpa
  // scale tambahan, jadi komposisinya sama dengan yang terlihat di
  // guide kamera.
  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    dx,
    dy,
    dw,
    dh
  );
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
  const probe =
    document.createElement(
      "canvas"
    );

  probe.width = 1;
  probe.height = 1;

  return probe
    .toDataURL(
      "image/webp",
      0.8
    )
    .startsWith(
      "data:image/webp"
    );
}

// Limit request-body Vercel ~4.5MB. Yang dikirim ke server itu SATU
// request berisi hasil akhir + semua foto original (base64), jadi
// jatah hasil akhir = total jatah dikurangi ukuran foto original.
// Ini yang bikin hasil bisa HD tapi tetap aman dari error 413.
const MAX_REQUEST_CHARS =
  4.2 * 1024 * 1024;

const MIN_RESULT_CHARS =
  1.2 * 1024 * 1024;

// Resolusi hasil akhir dibatasi supaya kualitas tetap tinggi tanpa
// membuat payload terlalu besar.
const HD_MAX_WIDTH =
  2400;

/**
 * Merge semua foto ke frame PNG.
 *
 * Foto kamera sudah mempunyai rasio slot yang sama dengan lubang frame,
 * sehingga setiap foto cukup di-cover ke masing-masing slot lalu frame
 * PNG digambar di atasnya.
 */
export async function mergePhotosIntoFrame(
  frameSrc: string,
  photos: Array<{
    dataUrl: string;
    slot: SlotRect;
  }>
): Promise<string> {
  const frameImg =
    await loadImage(
      frameSrc
    );

  const naturalWidth =
    frameImg.naturalWidth ||
    frameImg.width;

  const naturalHeight =
    frameImg.naturalHeight ||
    frameImg.height;

  let width = Math.min(
    Math.max(
      naturalWidth,
      CANVAS_OUTPUT_WIDTH
    ),
    HD_MAX_WIDTH
  );

  const height =
    Math.round(
      width *
        (naturalHeight /
          naturalWidth)
    );

  const render =
    async (
      outputWidth: number
    ) => {
      const outputHeight =
        Math.round(
          outputWidth *
            (naturalHeight /
              naturalWidth)
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        outputWidth;

      canvas.height =
        outputHeight;

      const ctx =
        canvas.getContext(
          "2d"
        );

      if (!ctx) {
        throw new Error(
          "Canvas context unavailable."
        );
      }

      ctx.imageSmoothingEnabled =
        true;

      ctx.imageSmoothingQuality =
        "high";

      /*
       * Background transparan sengaja dipertahankan.
       * Foto akan diletakkan di bawah frame PNG.
       */
      for (
        const photo of photos
      ) {
        const img =
          await loadImage(
            photo.dataUrl
          );

        const dx =
          photo.slot.x *
          outputWidth;

        const dy =
          photo.slot.y *
          outputHeight;

        const dw =
          photo.slot.w *
          outputWidth;

        const dh =
          photo.slot.h *
          outputHeight;

        drawCover(
          ctx,
          img,
          dx,
          dy,
          dw,
          dh
        );
      }

      // Frame PNG berada paling atas.
      ctx.drawImage(
        frameImg,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const maxResultChars =
        MAX_REQUEST_CHARS;

      let dataUrl: string;

      if (
        canvasSupportsWebpEncoding()
      ) {
        let quality = 0.9;

        dataUrl =
          canvas.toDataURL(
            "image/webp",
            quality
          );

        while (
          dataUrl.length >
            maxResultChars &&
          quality > 0.6
        ) {
          quality -= 0.05;

          dataUrl =
            canvas.toDataURL(
              "image/webp",
              quality
            );
        }

        return dataUrl;
      }

      // Fallback buat Safari/iPad/iPhone: JPEG bisa di-encode di semua
      // browser dan kompresinya bagus. JPEG gak punya alpha channel, jadi
      // area transparan di canvas (di luar bentuk frame) dikasih dasar
      // putih dulu sebelum di-export, supaya gak jadi kotak hitam.
      const jpegCanvas =
        document.createElement(
          "canvas"
        );

      jpegCanvas.width =
        outputWidth;

      jpegCanvas.height =
        outputHeight;

      const jctx =
        jpegCanvas.getContext(
          "2d"
        ) as CanvasRenderingContext2D;

      jctx.fillStyle =
        "#ffffff";

      jctx.fillRect(
        0,
        0,
        outputWidth,
        outputHeight
      );

      jctx.drawImage(
        canvas,
        0,
        0
      );

      let quality =
        0.95;

      dataUrl =
        jpegCanvas.toDataURL(
          "image/jpeg",
          quality
        );

      while (
        dataUrl.length >
          maxResultChars &&
        quality > 0.6
      ) {
        quality -= 0.05;

        dataUrl =
          jpegCanvas.toDataURL(
            "image/jpeg",
            quality
          );
      }

      return dataUrl;
    };

  let result =
    await render(
      width
    );

  // Pengaman terakhir (jarang kejadian): kalau masih kegedean walau
  // kualitas sudah turun, kecilkan resolusi sedikit demi sedikit.
  while (
    result.length >
      MAX_REQUEST_CHARS &&
    width > 1200
  ) {
    width =
      Math.max(
        1200,
        Math.round(
          width * 0.85
        )
      );

    result =
      await render(
        width
      );
  }

  return result;
}
