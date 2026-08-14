import type { CreateFramePayload, Frame, UpdateFramePayload } from "@/types/frame";

const BASE = "/api/frames";

export async function getFrames(): Promise<Frame[]> {
  const res = await fetch(BASE, { cache: "no-store" });
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

export async function deleteFrame(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus frame");
}
