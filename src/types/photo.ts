export type PhotoStatus = "pending" | "printed";

export interface Photo {
  id: string;
  frame_id: string;
  image_result: string;
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
  whatsappNumber: string;
}

export interface DashboardStats {
  totalFrames: number;
  totalPhotos: number;
  pendingPrint: number;
  printed: number;
  newEntries: number;
}
