/**
 * Utilities buat nge-parse & nge-format tanggal yang datang dari DB.
 *
 * KENAPA INI PERLU:
 * DB (TiDB Cloud) balikin kolom `created_at` dalam UTC, tapi sebagai
 * string POLOS tanpa "Z"/offset di belakangnya (lihat `dateStrings: true`
 * di `lib/db.ts`), contoh: "2026-08-26 05:00:00".
 *
 * Kalau string kayak gitu langsung dilempar ke `new Date(...)`, browser
 * bakal nganggep itu jam LOKAL apa adanya (bukan UTC) — padahal aslinya
 * itu jam UTC. Efeknya jam yang ditampilkan jadi geser/salah (mundur
 * sekitar 7 jam buat WIB). Ini akar masalah "foto jam 12 siang malah
 * kebaca jam 05:00".
 *
 * Fix-nya: normalisasi string itu jadi UTC eksplisit dulu (tambahin "Z"
 * / ganti spasi jadi "T" + "Z") sebelum di-parse, baru dirender ke jam
 * Indonesia (WIB) pakai `timeZone: "Asia/Jakarta"` — apapun timezone
 * device/browser yang dipakai buat lihat.
 *
 * SEMUA tempat yang nampilin `created_at` (dashboard, notifikasi,
 * lightbox foto, halaman share publik, teks WhatsApp, dll) WAJIB lewat
 * helper di file ini, jangan `new Date(iso)` langsung, biar konsisten.
 */

/** Parse string tanggal dari DB (naive UTC) jadi objek Date yang benar. */
export function parseDbDate(iso: string): Date {
  const utcIso = iso.includes("T")
    ? iso.endsWith("Z")
      ? iso
      : `${iso}Z`
    : `${iso.replace(" ", "T")}Z`;

  return new Date(utcIso);
}

/** Format "26 Agu, 12.00" (tanggal + jam, buat dashboard/lightbox/notif). */
export function formatDateTimeID(iso: string): string {
  return parseDbDate(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

/** Format "26 Agu 2026, 12.00" (tanggal lengkap + tahun + jam). */
export function formatDateTimeFullID(iso: string): string {
  return parseDbDate(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

/** Format "26 Agustus 2026" (tanggal aja, buat halaman share publik). */
export function formatDateID(iso: string): string {
  return parseDbDate(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}