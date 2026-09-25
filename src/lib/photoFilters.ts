export type PhotoFilterId =
  | "original"
  | "warm"
  | "vintage"
  | "mono"
  | "film"
  | "cool"
  | "soft"
  | "dramatic";

export interface PhotoFilter {
  id: PhotoFilterId;
  label: string;
  filter: string;
  swatch: string;
}

/**
 * Filters are intentionally CSS-filter based so the exact same value can
 * be used for the live webcam preview and baked into the captured photo
 * with CanvasRenderingContext2D.filter.
 */
export const PHOTO_FILTERS: PhotoFilter[] = [
  {
    id: "original",
    label: "Original",
    filter: "none",
    swatch: "linear-gradient(135deg, #d9d9d9, #ffffff 48%, #9e9e9e)",
  },
  {
    id: "warm",
    label: "Warm",
    filter: "sepia(0.16) saturate(1.16) contrast(1.02) brightness(1.03) hue-rotate(-5deg)",
    swatch: "linear-gradient(135deg, #8e4434, #e6b36d, #fff0c9)",
  },
  {
    id: "vintage",
    label: "Vintage",
    filter: "sepia(0.38) saturate(0.82) contrast(0.94) brightness(1.04)",
    swatch: "linear-gradient(135deg, #4d4032, #b99570, #e3c8a8)",
  },
  {
    id: "mono",
    label: "B&W",
    filter: "grayscale(1) contrast(1.08) brightness(1.03)",
    swatch: "linear-gradient(135deg, #111, #777, #f1f1f1)",
  },
  {
    id: "film",
    label: "Film",
    filter: "contrast(1.12) saturate(0.9) sepia(0.08) brightness(1.02)",
    swatch: "linear-gradient(135deg, #272522, #9a765c, #ded0bd)",
  },
  {
    id: "cool",
    label: "Cool",
    filter: "saturate(0.92) contrast(1.04) brightness(1.04) hue-rotate(8deg)",
    swatch: "linear-gradient(135deg, #27384b, #779bb2, #e2edf3)",
  },
  {
    id: "soft",
    label: "Soft",
    filter: "saturate(0.88) contrast(0.92) brightness(1.08) blur(0.12px)",
    swatch: "linear-gradient(135deg, #d4a9a4, #ead8c9, #fff5e8)",
  },
  {
    id: "dramatic",
    label: "Dramatic",
    filter: "contrast(1.22) saturate(1.08) brightness(0.94)",
    swatch: "linear-gradient(135deg, #170f12, #713d42, #d19b8d)",
  },
];

export const DEFAULT_PHOTO_FILTER: PhotoFilterId = "original";

export function getPhotoFilter(id: PhotoFilterId): PhotoFilter {
  return (
    PHOTO_FILTERS.find((item) => item.id === id) ?? PHOTO_FILTERS[0]!
  );
}
