import type { CreateFramePayload, Frame, UpdateFramePayload } from "@/types/frame";

const BASE = "/api/frames";

/**
 * Default: cuma frame AKTIF (yang dilihat pengunjung).
 * Admin bisa minta semuanya (termasuk yang diarsipkan) lewat
 * `includeArchived: true` — server tetap ngecek login admin.
 */
export async function getFrames(options?: { includeArchived?: boolean }): Promise<Frame[]> {
  const url = options?.includeArchived ? `${BASE}?includeArchived=1` : BASE;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat daftar frame");
  const json = await res.json();
  return json.data as Frame[];
}

export async function getFrame(id: string): Promise<Frame> {
  const res = await fetch(`${BASE}/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Frame tidak ditemukan");
  const json = await res.json();
  return json.data as Frame;
}

export async function createFrame(payload: CreateFramePayload): Promise<Frame> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal membuat frame baru");
  const json = await res.json();
  return json.data as Frame;
}

export async function updateFrame(id: string, payload: UpdateFramePayload): Promise<Frame> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal memperbarui frame");
  const json = await res.json();
  return json.data as Frame;
}

/** Arsipkan (archived = true) atau aktifkan lagi (archived = false). */
export async function setFrameArchived(id: string, archived: boolean): Promise<Frame> {
  return updateFrame(id, { archived });
}

export async function deleteFrame(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus frame");
}
