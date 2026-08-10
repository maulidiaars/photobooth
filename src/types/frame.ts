import type { SlotRect } from "@/lib/frameSlotDetector";

export interface Frame {
  id: string;
  nama: string;
  thumbnail: string;
  frame_png: string;
  slot: number;
  slot_layout: SlotRect[];
  created_at: string;
}

export interface CreateFramePayload {
  nama: string;
  framePngBase64: string;
  slotLayout: SlotRect[];
}

export interface UpdateFramePayload {
  nama?: string;
  framePngBase64?: string;
  slotLayout?: SlotRect[];
}

export type { SlotRect };
