import type { FaceEffectId } from "./faceEffects";

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
  | "sunset"
  | FaceEffectId;

export type PhotoEffectKind = "filter" | "ar";

export interface PhotoFilter {
  id: PhotoFilterId;
  label: string;
  filter: string;
  swatch: string;
  kind?: PhotoEffectKind;
  /** Emoji shown on the filter's thumbnail chip. */
  icon?: string;
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

  // Real AR face-tracking effects — these follow the head (position,
  // tilt, distance) live, and get baked into the captured photo too.
  {
    id: "love-hearts",
    label: "Love",
    kind: "ar",
    icon: "❤️",
    filter: "saturate(1.08) brightness(1.03)",
    swatch: "linear-gradient(135deg,#4b1726,#d85d78,#ffd1db)",
  },
  {
    id: "ghost-love",
    label: "Ghost",
    kind: "ar",
    icon: "👻",
    filter: "contrast(1.05) saturate(.94) brightness(1.02)",
    swatch: "linear-gradient(135deg,#1b1b24,#4b3b55,#cfc8e8)",
  },
  {
    id: "cool-glasses",
    label: "Cool",
    kind: "ar",
    icon: "😎",
    filter: "contrast(1.06) saturate(1.03)",
    swatch: "linear-gradient(135deg,#111318,#3a3f47,#9aa3ad)",
  },
  {
    id: "bunny",
    label: "Bunny",
    kind: "ar",
    icon: "🐰",
    filter: "saturate(1.06) brightness(1.05)",
    swatch: "linear-gradient(135deg,#c46a86,#f7c9d8,#fff5f8)",
  },
  {
    id: "cat",
    label: "Cat",
    kind: "ar",
    icon: "🐱",
    filter: "sepia(.05) saturate(1.05)",
    swatch: "linear-gradient(135deg,#3a2a26,#8a6a58,#e8c9b8)",
  },
  {
    id: "princess",
    label: "Princess",
    kind: "ar",
    icon: "👑",
    filter: "saturate(1.1) brightness(1.04)",
    swatch: "linear-gradient(135deg,#8c6a1f,#e8b84b,#fff3c4)",
  },
  {
    id: "kiss",
    label: "Kiss",
    kind: "ar",
    icon: "💋",
    filter: "saturate(1.1) brightness(1.03)",
    swatch: "linear-gradient(135deg,#8d203b,#ef7187,#ffd6df)",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    kind: "ar",
    icon: "✨",
    filter: "saturate(1.12) contrast(1.03) brightness(1.05)",
    swatch: "linear-gradient(135deg,#6b5a9e,#b8a6e4,#fff8cf)",
  },
  {
    id: "devil",
    label: "Devil",
    kind: "ar",
    icon: "😈",
    filter: "contrast(1.12) saturate(1.05) brightness(.97)",
    swatch: "linear-gradient(135deg,#3d0b0b,#a31f1f,#e0645a)",
  },
  {
    id: "flowers",
    label: "Cute",
    kind: "ar",
    icon: "🌸",
    filter: "saturate(1.08) brightness(1.05)",
    swatch: "linear-gradient(135deg,#7d4a63,#e8a8c9,#fdf0f7)",
  },
];

export const DEFAULT_PHOTO_FILTER: PhotoFilterId = "original";

export function getPhotoFilter(id: PhotoFilterId): PhotoFilter {
  return PHOTO_FILTERS.find((item) => item.id === id) ?? PHOTO_FILTERS[0]!;
}
