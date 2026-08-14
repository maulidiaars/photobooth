import type { Frame, SlotRect } from "@/types/frame";

export interface FrameRow {
  id: string;
  nama: string;
  thumbnail: string;
  frame_png: string;
  slot: number;
  slot_layout: string | SlotRect[];
  created_at: string;
}

export function parseFrameRow(row: FrameRow): Frame {
  let slotLayout: SlotRect[] = [];
  if (Array.isArray(row.slot_layout)) {
    slotLayout = row.slot_layout;
  } else if (typeof row.slot_layout === "string" && row.slot_layout.length > 0) {
    try {
      slotLayout = JSON.parse(row.slot_layout) as SlotRect[];
    } catch {
      slotLayout = [];
    }
  }

  return {
    id: row.id,
    nama: row.nama,
    thumbnail: row.thumbnail,
    frame_png: row.frame_png,
    slot: row.slot,
    slot_layout: slotLayout,
    created_at: row.created_at,
  };
}
