export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Klikka Photobooth";

/** Public base URL of the deployed app (Vercel), used to build the
 *  /foto/[id] link sent to guests over WhatsApp. Override via the
 *  NEXT_PUBLIC_APP_URL env var if the Vercel domain ever changes. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://klikkaphotobooth.vercel.app").replace(/\/$/, "");

/** Name of the httpOnly cookie holding the admin JWT. Kept here (not in
 *  lib/auth.ts) so Edge Runtime code like middleware.ts can read it
 *  without pulling in jsonwebtoken, which needs Node's crypto module. */
export const ADMIN_COOKIE_NAME = "clay_admin_token";

export const COUNTDOWN_SECONDS = 3;

/** Total durasi sesi foto (dari klik "mulai sesi foto" sampai waktu
 *  habis) — timer ini tampil di pojok kiri atas setiap halaman sesi
 *  (pilih frame, kamera, hasil) sampai pengguna selesai atau waktunya
 *  habis. */
export const SESSION_DURATION_MS = 5 * 60 * 1000;

export const CANVAS_OUTPUT_WIDTH = 1200;

export const PASTEL_ACCENTS = [
  "pink-gradient",
  "purple-gradient",
  "mint-gradient",
  "yellow-gradient",
] as const;

export const PHOTO_STATUS = {
  PENDING: "pending",
  PRINTED: "printed",
} as const;

export const ROUTES = {
  home: "/",
  frame: "/frame",
  camera: "/camera",
  result: "/result",
  finish: "/finish",
  adminLogin: "/admin/login",
  adminDashboard: "/admin/dashboard",
  adminFrames: "/admin/frames",
  adminPhotos: "/admin/photos",
};
