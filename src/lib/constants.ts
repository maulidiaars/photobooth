export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Clay Photobooth";

/** Name of the httpOnly cookie holding the admin JWT. Kept here (not in
 *  lib/auth.ts) so Edge Runtime code like middleware.ts can read it
 *  without pulling in jsonwebtoken, which needs Node's crypto module. */
export const ADMIN_COOKIE_NAME = "clay_admin_token";

export const COUNTDOWN_SECONDS = 3;

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
