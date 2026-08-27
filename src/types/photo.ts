export type PhotoStatus = "pending" | "printed";

export interface Photo {
  id: string;
  frame_id: string;
  image_result: string;
  /** Foto original (tanpa frame) satu-satu, urut sesuai slot 1, 2, 3, dst. */
  raw_photos: string[];
  whatsapp_number: string | null;
  status: PhotoStatus;
  notified: boolean;
  created_at: string;
  frame_nama?: string;
  frame_slot?: number;
}

export interface CreatePhotoPayload {
  frame_id: string;
  imageResultBase64: string;
  /** Foto mentah per slot (base64), sebelum digabung ke frame. */
  rawPhotosBase64: string[];
  whatsappNumber: string;
}

export interface DashboardStats {
  totalFrames: number;
  totalPhotos: number;
  pendingPrint: number;
  printed: number;
  newEntries: number;
}