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

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
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
  const w =
    slot.w *
    frameNaturalWidth;

  const h =
    slot.h *
    frameNaturalHeight;

  if (
    !(w > 0) ||
    !(h > 0)
  ) {
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
  let w =
    containerWidth;

  let h =
    w / ratio;

  if (
    h >
    containerHeight
  ) {
    h =
      containerHeight;

    w =
      h * ratio;
  }

  const x =
    (containerWidth -
      w) /
    2;

  const y =
    (containerHeight -
      h) /
    2;

  return {
    x,
    y,
    w,
    h,
  };
}

/**
 * Faktor pelebaran DIGITAL untuk zoom 0.5x.
 *
 * CATATAN:
 * Fungsi ini masih dipertahankan agar kompatibel dengan logic
 * kamera project yang sekarang.
 *
 * Kalau hardware kamera / kamera Ultra Wide tersedia, nilai yang
 * dikembalikan adalah 1 sehingga tidak ada digital scaling tambahan.
 */
export function computeDigitalZoomFactor(
  opts: {
    containerWidth: number;
    containerHeight: number;
    videoWidth: number;
    videoHeight: number;
    ratio: number;
    zoom: number;
    hardware: boolean;
  }
): number {
  const {
    containerWidth:
      cw,
    containerHeight:
      ch,
    videoWidth:
      vw,
    videoHeight:
      vh,
    ratio,
    zoom,
    hardware,
  } = opts;

  if (
    zoom >= 1 ||
    hardware
  ) {
    return 1;
  }

  if (
    !(cw > 0) ||
    !(ch > 0) ||
    !(vw > 0) ||
    !(vh > 0) ||
    !(ratio > 0)
  ) {
    return 1;
  }

  const guide =
    computeGuideRect(
      cw,
      ch,
      ratio
    );

  const s1 =
    Math.max(
      cw / vw,
      ch / vh
    );

  const sMin =
    Math.max(
      guide.w / vw,
      guide.h / vh
    );

  return clamp(
    Math.max(
      zoom,
      sMin / s1
    ),
    0.01,
    1
  );
}

/**
 * Terjemahkan guide (koordinat layar) menjadi area di VIDEO SUMBER
 * (piksel asli kamera).
 *
 * Video ditampilkan object-fit: cover + object-position: center.
 *
 * Kalau preview di-mirror (scaleX(-1)), sumbu X dibalik dulu supaya
 * area yang dipotong dari video mentah adalah area yang sama dengan
 * yang tampak di guide.
 *
 * Hasil crop: rasio PERSIS sama dengan guide, dan selalu berada
 * di dalam video.
 */
export function computeSourceCrop(
  opts: {
    containerWidth: number;
    containerHeight: number;
    videoWidth: number;
    videoHeight: number;
    ratio: number;
    mirrored: boolean;

    /**
     * Pelebaran digital (0-1) dari zoom 0.5x.
     * Default = 1.
     */
    zoomFactor?: number;
  }
): PixelRect | null {
  const {
    containerWidth:
      cw,
    containerHeight:
      ch,
    videoWidth:
      vw,
    videoHeight:
      vh,
    ratio,
    mirrored,
    zoomFactor = 1,
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

  const safeZoomFactor =
    zoomFactor > 0
      ? zoomFactor
      : 1;

  const scale =
    Math.max(
      cw / vw,
      ch / vh
    ) *
    safeZoomFactor;

  const offsetX =
    (cw -
      vw * scale) /
    2;

  const offsetY =
    (ch -
      vh * scale) /
    2;

  const guideLeft =
    mirrored
      ? cw -
        (guide.x +
          guide.w)
      : guide.x;

  const sw =
    guide.w /
    scale;

  const sh =
    guide.h /
    scale;

  const sx =
    clamp(
      (guideLeft -
        offsetX) /
        scale,
      0,
      Math.max(
        0,
        vw - sw
      )
    );

  const sy =
    clamp(
      (guide.y -
        offsetY) /
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
        () =>
          resolve(img);

      img.onerror =
        reject;

      img.src =
        src;
    }
  );
}

/**
 * Draw a photo into a slot rect.
 *
 * Foto hasil kamera sudah dipotong dengan rasio PERSIS sama dengan
 * lubang ini, jadi cover-fit hanya menjadi pengaman kalau ada foto
 * dengan rasio berbeda.
 */
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

  /*
   * Lapisan bawah (underlay): foto digambar sedikit lebih besar
   * dari lubang, hanya untuk menutup hairline tipis di tepi lubang
   * PNG yang semi-transparan.
   */
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

  /*
   * Lapisan atas: foto PERSIS di posisi & ukuran lubang.
   */
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

/*
 * Safari/WebKit — termasuk Chrome/Firefox di iOS — menggunakan
 * WebKit sebagai engine browser.
 *
 * Beberapa versi tidak benar-benar meng-encode canvas ke WebP.
 * Karena itu kita cek hasil data URL-nya secara nyata.
 */
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

/*
 * Limit request-body Vercel sekitar 4.5 MB.
 *
 * Yang dikirim ke server:
 *   - result image
 *   - raw photos
 *
 * Jadi result image tidak boleh memakai seluruh limit.
 */
const MAX_REQUEST_CHARS =
  4.2 *
  1024 *
  1024;

const MIN_RESULT_CHARS =
  1.2 *
  1024 *
  1024;

/*
 * Resolusi hasil akhir.
 *
 * Tetap HD, tapi dibatasi supaya payload tidak terlalu besar.
 */
const HD_MAX_WIDTH =
  2400;

/**
 * ================================================================
 * MERGE PHOTOS INTO FRAME
 * ================================================================
 *
 * PENTING:
 *
 * Function ini menerima 3 parameter karena result/page.tsx project
 * kamu memang memanggil:
 *
 * mergePhotosIntoFrame(
 *   capturedPhotos,
 *   selectedFrame.frame_png,
 *   selectedFrame.slot_layout
 * )
 *
 * JANGAN mengubah signature ini menjadi 2 parameter.
 */
export async function mergePhotosIntoFrame(
  photoDataUrls: string[],
  framePngUrl: string,
  slotLayout: SlotRect[]
): Promise<string> {
  /*
   * Load frame PNG.
   */
  const frameImg =
    await loadImage(
      framePngUrl
    );

  /*
   * Load semua foto yang sudah diambil.
   */
  const photos =
    await Promise.all(
      photoDataUrls.map(
        loadImage
      )
    );

  /*
   * Hitung ukuran raw photos karena result image + raw photos
   * nantinya dikirim dalam request yang sama.
   */
  const rawChars =
    photoDataUrls.reduce(
      (
        sum,
        photo
      ) =>
        sum +
        photo.length,
      0
    );

  const maxResultChars =
    Math.max(
      MIN_RESULT_CHARS,
      MAX_REQUEST_CHARS -
        rawChars -
        20_000
    );

  const useWebp =
    canvasSupportsWebpEncoding();

  /**
   * Render frame + foto ke canvas.
   */
  const render = (
    width: number
  ): string => {
    const height =
      Math.round(
        (frameImg.height /
          frameImg.width) *
          width
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const ctx =
      canvas.getContext(
        "2d",
        {
          alpha: true,
        }
      ) as
        | CanvasRenderingContext2D
        | null;

    if (!ctx) {
      throw new Error(
        "Canvas 2D context not supported"
      );
    }

    ctx.imageSmoothingEnabled =
      true;

    ctx.imageSmoothingQuality =
      "high";

    /*
     * Jangan kasih background putih.
     *
     * Frame PNG tetap transparan di luar artwork.
     */
    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    /*
     * Masukkan foto berdasarkan slot_layout frame.
     *
     * Ini yang memastikan setiap foto masuk ke lubang frame
     * yang sesuai.
     */
    photos.forEach(
      (
        img,
        index
      ) => {
        const rect =
          slotLayout[
            index
          ];

        if (!rect) {
          return;
        }

        drawCover(
          ctx,
          img,
          rect.x *
            width,
          rect.y *
            height,
          rect.w *
            width,
          rect.h *
            height
        );
      }
    );

    /*
     * Frame artwork selalu paling atas.
     */
    ctx.drawImage(
      frameImg,
      0,
      0,
      width,
      height
    );

    /*
     * Browser yang benar-benar support WebP:
     * gunakan WebP supaya ukuran file lebih kecil.
     */
    if (useWebp) {
      let quality =
        0.95;

      let dataUrl =
        canvas.toDataURL(
          "image/webp",
          quality
        );

      while (
        dataUrl.length >
          maxResultChars &&
        quality >
          0.6
      ) {
        quality -=
          0.05;

        dataUrl =
          canvas.toDataURL(
            "image/webp",
            quality
          );
      }

      return dataUrl;
    }

    /*
     * Safari/iPhone/iPad fallback:
     *
     * JPEG tidak mendukung transparansi, jadi buat canvas kedua
     * dengan background putih terlebih dahulu.
     */
    const jpegCanvas =
      document.createElement(
        "canvas"
      );

    jpegCanvas.width =
      width;

    jpegCanvas.height =
      height;

    const jctx =
      jpegCanvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

    jctx.fillStyle =
      "#ffffff";

    jctx.fillRect(
      0,
      0,
      width,
      height
    );

    jctx.drawImage(
      canvas,
      0,
      0
    );

    let quality =
      0.95;

    let dataUrl =
      jpegCanvas.toDataURL(
        "image/jpeg",
        quality
      );

    while (
      dataUrl.length >
        maxResultChars &&
      quality >
        0.6
    ) {
      quality -=
        0.05;

      dataUrl =
        jpegCanvas.toDataURL(
          "image/jpeg",
          quality
        );
    }

    return dataUrl;
  };

  /*
   * Tentukan ukuran awal output.
   *
   * Minimal mengikuti CANVAS_OUTPUT_WIDTH,
   * maksimal 2400px.
   */
  let width =
    Math.min(
      Math.max(
        frameImg.width,
        CANVAS_OUTPUT_WIDTH
      ),
      HD_MAX_WIDTH
    );

  let result =
    render(width);

  /*
   * Pengaman terakhir.
   *
   * Kalau hasil masih terlalu besar setelah quality diturunkan,
   * turunkan resolusi secara bertahap.
   */
  while (
    result.length >
      maxResultChars &&
    width >
      1200
  ) {
    width =
      Math.max(
        1200,
        Math.round(
          width * 0.85
        )
      );

    result =
      render(width);
  }

  return result;
}
