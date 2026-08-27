import type { Photo, PhotoStatus } from "@/types/photo";

/**
 * Shape of a row as it comes straight out of MySQL/TiDB — `raw_photos`
 * is stored as a JSON-encoded TEXT column (same trick `frames.slot_layout`
 * uses in lib/frameRow.ts), so it needs parsing before it matches the
 * `Photo` type the rest of the app works with.
 */
export interface PhotoRow {
  id: string;
  frame_id: string;
  image_result: string;
  raw_photos: string | string[] | null;
  whatsapp_number: string | null;
  status: PhotoStatus;
  notified: number | boolean;
  created_at: string;
  frame_nama?: string;
  frame_slot?: number;
}

export function parsePhotoRow(row: PhotoRow): Photo {
  let rawPhotos: string[] = [];
  if (Array.isArray(row.raw_photos)) {
    rawPhotos = row.raw_photos;
  } else if (typeof row.raw_photos === "string" && row.raw_photos.length > 0) {
    try {
      rawPhotos = JSON.parse(row.raw_photos) as string[];
    } catch {
      rawPhotos = [];
    }
  }

  return {
    id: row.id,
    frame_id: row.frame_id,
    image_result: row.image_result,
    raw_photos: rawPhotos,
    whatsapp_number: row.whatsapp_number,
    status: row.status,
    notified: Boolean(row.notified),
    created_at: row.created_at,
    frame_nama: row.frame_nama,
    frame_slot: row.frame_slot,
  };
}