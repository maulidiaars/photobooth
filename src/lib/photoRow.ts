import type { Photo, PhotoStatus } from "@/types/photo";
import type { SlotRect } from "@/lib/frameSlotDetector";

/**
 * Shape of a row as it comes straight out of MySQL/TiDB — `raw_photos`
 * and `frame_slot_layout` are both stored/selected as JSON-encoded TEXT
 * (same trick `frames.slot_layout` uses in lib/frameRow.ts), so they
 * need parsing before matching the `Photo` type the rest of the app
 * works with.
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
  frame_slot_layout?: string | SlotRect[] | null;
}

function parseJsonArray<T>(value: string | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }
  return [];
}

export function parsePhotoRow(row: PhotoRow): Photo {
  return {
    id: row.id,
    frame_id: row.frame_id,
    image_result: row.image_result,
    raw_photos: parseJsonArray<string>(row.raw_photos),
    whatsapp_number: row.whatsapp_number,
    status: row.status,
    notified: Boolean(row.notified),
    created_at: row.created_at,
    frame_nama: row.frame_nama,
    frame_slot: row.frame_slot,
    frame_slot_layout: parseJsonArray<SlotRect>(row.frame_slot_layout),
  };
}