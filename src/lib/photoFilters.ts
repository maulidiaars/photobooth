export type PhotoFilterId =
  | "original"
  | "warm"
  | "vintage"
  | "mono"
  | "film"
  | "cool"
  | "soft"
  | "dramatic"
  | "fade"
  | "rose"
  | "night"
  | "vivid"
  | "matte"
  | "sunset";

export interface PhotoFilter {
  id: PhotoFilterId;
  label: string;
  filter: string;
  swatch: string;
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  {
    id: "original",
    label: "Original",
    filter: "none",
    swatch: "linear-gradient(135deg,#d9d9d9,#fff 48%,#9e9e9e)",
  },
  {
    id: "warm",
    label: "Warm",
    filter: "sepia(.16) saturate(1.16) contrast(1.02) brightness(1.03) hue-rotate(-5deg)",
    swatch: "linear-gradient(135deg,#8e4434,#e6b36d,#fff0c9)",
  },
  {
    id: "vintage",
    label: "Vintage",
    filter: "sepia(.38) saturate(.82) contrast(.94) brightness(1.04)",
    swatch: "linear-gradient(135deg,#4d4032,#b99570,#e3c8a8)",
  },
  {
    id: "mono",
    label: "B&W",
    filter: "grayscale(1) contrast(1.08) brightness(1.03)",
    swatch: "linear-gradient(135deg,#111,#777,#f1f1f1)",
  },
  {
    id: "film",
    label: "Film",
    filter: "contrast(1.12) saturate(.9) sepia(.08) brightness(1.02)",
    swatch: "linear-gradient(135deg,#272522,#9a765c,#ded0bd)",
  },
  {
    id: "cool",
    label: "Cool",
    filter: "saturate(.92) contrast(1.04) brightness(1.04) hue-rotate(8deg)",
    swatch: "linear-gradient(135deg,#27384b,#779bb2,#e2edf3)",
  },
  {
    id: "soft",
    label: "Soft",
    filter: "saturate(.88) contrast(.92) brightness(1.08) blur(.12px)",
    swatch: "linear-gradient(135deg,#d4a9a4,#ead8c9,#fff5e8)",
  },
  {
    id: "dramatic",
    label: "Drama",
    filter: "contrast(1.22) saturate(1.08) brightness(.94)",
    swatch: "linear-gradient(135deg,#170f12,#713d42,#d19b8d)",
  },
  {
    id: "fade",
    label: "Fade",
    filter: "contrast(.9) saturate(.72) brightness(1.08)",
    swatch: "linear-gradient(135deg,#6f6870,#bcb3b1,#eee8e1)",
  },
  {
    id: "rose",
    label: "Rose",
    filter: "sepia(.12) saturate(1.08) hue-rotate(-12deg) brightness(1.03)",
    swatch: "linear-gradient(135deg,#633844,#c9818c,#f2d1ce)",
  },
  {
    id: "night",
    label: "Night",
    filter: "contrast(1.14) saturate(.82) brightness(.86) hue-rotate(6deg)",
    swatch: "linear-gradient(135deg,#0e1520,#344c6a,#9baec3)",
  },
  {
    id: "vivid",
    label: "Vivid",
    filter: "saturate(1.34) contrast(1.08) brightness(1.02)",
    swatch: "linear-gradient(135deg,#213b28,#d06b48,#f4cf63)",
  },
  {
    id: "matte",
    label: "Matte",
    filter: "contrast(.88) saturate(.84) brightness(1.04) sepia(.06)",
    swatch: "linear-gradient(135deg,#4b4845,#a59c91,#e5ddd0)",
  },
  {
    id: "sunset",
    label: "Sunset",
    filter: "sepia(.2) saturate(1.22) contrast(1.03) brightness(1.02) hue-rotate(-9deg)",
    swatch: "linear-gradient(135deg,#7c2937,#df714d,#f3c17a)",
  },
];

export const DEFAULT_PHOTO_FILTER: PhotoFilterId = "original";

export function getPhotoFilter(id: PhotoFilterId): PhotoFilter {
  return PHOTO_FILTERS.find((item) => item.id === id) ?? PHOTO_FILTERS[0]!;
}

/* ================================================================
 * FALLBACK FILTER UNTUK SAFARI / iPad / iPhone
 * ================================================================
 *
 * `ctx.filter` (filter CSS di canvas) TIDAK didukung Safari/WebKit
 * (semua browser di iPhone & iPad). Di sana filter cuma kelihatan di
 * preview (CSS biasa), tapi hasil jepretannya polos tanpa filter.
 *
 * Solusinya: kalau `ctx.filter` tidak jalan, filter yang sama
 * (sepia, saturate, contrast, brightness, hue-rotate, grayscale)
 * dihitung manual per-piksel memakai rumus resmi filter CSS, jadi
 * hasilnya menyatu dengan foto & mirip dengan preview.
 */

let nativeCanvasFilterSupport: boolean | null = null;

export function canvasSupportsNativeFilter(): boolean {
  if (nativeCanvasFilterSupport !== null) {
    return nativeCanvasFilterSupport;
  }

  try {
    const probe = document.createElement("canvas");
    probe.width = 1;
    probe.height = 1;

    const ctx = probe.getContext("2d");

    if (!ctx || !("filter" in ctx)) {
      nativeCanvasFilterSupport = false;
      return false;
    }

    ctx.filter = "grayscale(1)";
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 1, 1);

    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

    // Merah murni -> abu-abu kalau filternya benar-benar jalan.
    nativeCanvasFilterSupport = r === g && g === b;
  } catch {
    nativeCanvasFilterSupport = false;
  }

  return nativeCanvasFilterSupport;
}

interface FilterOp {
  name: string;
  value: number;
}

function parseFilterOps(css: string): FilterOp[] {
  const ops: FilterOp[] = [];

  const re =
    /([a-z-]+)\(\s*([-+]?\d*\.?\d+)\s*(deg|rad|turn|%|px)?\s*\)/gi;

  let match: RegExpExecArray | null;

  while ((match = re.exec(css)) !== null) {
    const name = (match[1] ?? "").toLowerCase();
    let value = parseFloat(match[2] ?? "0");
    const unit = (match[3] ?? "").toLowerCase();

    if (name === "hue-rotate") {
      if (unit === "rad") value = (value * 180) / Math.PI;
      else if (unit === "turn") value = value * 360;
    } else if (unit === "%") {
      value = value / 100;
    }

    ops.push({ name, value });
  }

  return ops;
}

function mulMat3(a: number[], b: number[]): number[] {
  const out = new Array<number>(9).fill(0);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;

      for (let k = 0; k < 3; k++) {
        sum += (a[r * 3 + k] ?? 0) * (b[k * 3 + c] ?? 0);
      }

      out[r * 3 + c] = sum;
    }
  }

  return out;
}

function mulMatVec3(a: number[], v: number[]): number[] {
  return [0, 1, 2].map(
    (r) =>
      (a[r * 3] ?? 0) * (v[0] ?? 0) +
      (a[r * 3 + 1] ?? 0) * (v[1] ?? 0) +
      (a[r * 3 + 2] ?? 0) * (v[2] ?? 0)
  );
}

function clamp01(n: number) {
  return Math.min(Math.max(n, 0), 1);
}

/**
 * Terapkan string filter CSS (mis. "sepia(.2) saturate(1.2)") ke
 * seluruh isi canvas, per piksel. Dipakai hanya kalau `ctx.filter`
 * tidak didukung browser.
 */
export function applyCssFilterFallback(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  css: string
) {
  if (!css || css === "none") return;

  const ops = parseFilterOps(css);

  if (!ops.length) return;

  // Semua operasi digabung jadi satu transformasi: out = M * rgb + o
  let m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let o = [0, 0, 0];

  for (const { name, value } of ops) {
    if (name === "brightness") {
      const b = Math.max(value, 0);
      m = m.map((x) => x * b);
      o = o.map((x) => x * b);
      continue;
    }

    if (name === "contrast") {
      const c = Math.max(value, 0);
      const t = 255 * (0.5 - 0.5 * c);
      m = m.map((x) => x * c);
      o = o.map((x) => x * c + t);
      continue;
    }

    let a: number[] | null = null;

    if (name === "grayscale") {
      const k = 1 - clamp01(value);

      a = [
        0.2126 + 0.7874 * k, 0.7152 - 0.7152 * k, 0.0722 - 0.0722 * k,
        0.2126 - 0.2126 * k, 0.7152 + 0.2848 * k, 0.0722 - 0.0722 * k,
        0.2126 - 0.2126 * k, 0.7152 - 0.7152 * k, 0.0722 + 0.9278 * k,
      ];
    } else if (name === "sepia") {
      const k = 1 - clamp01(value);

      a = [
        0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k,
        0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k,
        0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k,
      ];
    } else if (name === "saturate") {
      const s = Math.max(value, 0);

      a = [
        0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
        0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
        0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
      ];
    } else if (name === "hue-rotate") {
      const rad = (value * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      a = [
        0.213 + cos * 0.787 - sin * 0.213,
        0.715 - cos * 0.715 - sin * 0.715,
        0.072 - cos * 0.072 + sin * 0.928,
        0.213 - cos * 0.213 + sin * 0.143,
        0.715 + cos * 0.285 + sin * 0.14,
        0.072 - cos * 0.072 - sin * 0.283,
        0.213 - cos * 0.213 - sin * 0.787,
        0.715 - cos * 0.715 + sin * 0.715,
        0.072 + cos * 0.928 + sin * 0.072,
      ];
    }

    // blur() dan lainnya sengaja dilewati (efeknya nyaris tak terlihat).
    if (a) {
      m = mulMat3(a, m);
      o = mulMatVec3(a, o);
    }
  }

  const image = ctx.getImageData(0, 0, width, height);
  const d = image.data;

  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = m as [
    number, number, number, number, number, number, number, number, number
  ];
  const [o0, o1, o2] = o as [number, number, number];

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] as number;
    const g = d[i + 1] as number;
    const b = d[i + 2] as number;

    // Uint8ClampedArray otomatis membatasi nilai ke 0-255.
    d[i] = m0 * r + m1 * g + m2 * b + o0;
    d[i + 1] = m3 * r + m4 * g + m5 * b + o1;
    d[i + 2] = m6 * r + m7 * g + m8 * b + o2;
  }

  ctx.putImageData(image, 0, 0);
}
