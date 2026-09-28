import type { CreatePhotoPayload, DashboardStats, Photo, PhotoStatus } from "@/types/photo";

const BASE = "/api/photos";

export async function getPhotos(status?: PhotoStatus): Promise<Photo[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await fetch(`${BASE}${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat daftar foto");
  const json = await res.json();
  return json.data as Photo[];
}

/*
 * ============================================================
 * PENGAMAN UPLOAD (anti 413)
 * ============================================================
 *
 * Vercel menolak request di atas ~4.5 MB (error 413). Yang dikirim
 * = gambar hasil + SEMUA foto mentah. Kalau kegedean, foto mentah
 * di-kompres bertahap (dikecilkan + kualitas diturunkan) SEBELUM
 * dikirim, sampai muat. Kalau ukurannya sudah aman, foto dikirim
 * apa adanya tanpa kehilangan kualitas.
 */
const MAX_BODY_CHARS = 4.2 * 1024 * 1024;

const SHRINK_STEPS: { width: number; quality: number }[] = [
  { width: 1600, quality: 0.9 },
  { width: 1400, quality: 0.85 },
  { width: 1200, quality: 0.8 },
  { width: 1000, quality: 0.75 },
  { width: 800, quality: 0.7 },
  { width: 640, quality: 0.6 },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function reencodeJpeg(
  dataUrl: string,
  maxWidth: number,
  quality: number
): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function bodySize(payload: CreatePhotoPayload, raws: string[]): number {
  return JSON.stringify({ ...payload, rawPhotosBase64: raws }).length;
}

async function fitPayload(
  payload: CreatePhotoPayload,
  forceSmallest = false
): Promise<CreatePhotoPayload> {
  const original = payload.rawPhotosBase64;

  if (!forceSmallest && bodySize(payload, original) <= MAX_BODY_CHARS) {
    return payload;
  }

  const steps = forceSmallest
    ? SHRINK_STEPS.slice(-1)
    : SHRINK_STEPS;

  let raws = original;

  for (const step of steps) {
    raws = await Promise.all(
      original.map((raw) => reencodeJpeg(raw, step.width, step.quality))
    );
    if (bodySize(payload, raws) <= MAX_BODY_CHARS) break;
  }

  return { ...payload, rawPhotosBase64: raws };
}

async function postPhoto(payload: CreatePhotoPayload): Promise<Response> {
  return fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function savePhoto(payload: CreatePhotoPayload): Promise<Photo> {
  let res = await postPhoto(await fitPayload(payload));

  // Kalau tetap ditolak karena kegedean, coba sekali lagi dengan
  // foto mentah paling kecil supaya foto tetap masuk.
  if (res.status === 413) {
    res = await postPhoto(await fitPayload(payload, true));
  }

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
