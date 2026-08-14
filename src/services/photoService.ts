import type { CreatePhotoPayload, DashboardStats, Photo, PhotoStatus } from "@/types/photo";

const BASE = "/api/photos";

export async function getPhotos(status?: PhotoStatus): Promise<Photo[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE}${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat daftar foto");
  const json = await res.json();
  return json.data as Photo[];
}

export async function savePhoto(payload: CreatePhotoPayload): Promise<Photo> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gagal menyimpan hasil foto");
  const json = await res.json();
  return json.data as Photo;
}

export async function updatePhotoStatus(id: string, status: PhotoStatus): Promise<Photo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Gagal memperbarui status foto");
  const json = await res.json();
  return json.data as Photo;
}

export async function deletePhoto(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus foto");
}

export async function markPhotoNotified(id: string): Promise<Photo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notified: true }),
  });
  if (!res.ok) throw new Error("Gagal memperbarui notifikasi");
  const json = await res.json();
  return json.data as Photo;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/admin/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat statistik");
  const json = await res.json();
  return json.data as DashboardStats;
}
