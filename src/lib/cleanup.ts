import { query } from "./db";
import { deletePublicFile } from "./fileStorage";

interface ExpiredPhotoRow {
  id: string;
  image_result: string;
}

/**
 * Hapus semua foto yang usianya udah lewat 24 jam dari created_at
 * masing-masing (bukan "1x hapus semua tiap tengah malam" — tiap foto
 * kehapus sendiri-sendiri pas genap 24 jam sejak dia dibuat).
 *
 * Dipanggil "lazy" (opportunistic) tiap kali dashboard admin narik data
 * (GET /api/photos & GET /api/admin/stats) supaya kehapusnya kerasa
 * near-real-time selama ada admin yang mantau. Juga dipanggil dari cron
 * job (/api/cron/cleanup-photos, lihat vercel.json) sebagai jaring
 * pengaman kalau kebetulan gak ada dashboard yang lagi dibuka — biar
 * foto & file di storage tetap kehapus dan database gak numpuk terus,
 * pas dipakai keliling ke banyak acara/jalan.
 */
export async function cleanupExpiredPhotos(): Promise<number> {
  try {
    const expired = await query<ExpiredPhotoRow[]>(
      "SELECT id, image_result FROM photos WHERE created_at <= (NOW() - INTERVAL 24 HOUR)"
    );

    if (expired.length === 0) return 0;

    // Hapus file di Vercel Blob dulu (best-effort, jangan sampai satu
    // file gagal kehapus bikin proses lain ikut gagal / stuck).
    await Promise.all(
      expired.map((p) => deletePublicFile(p.image_result).catch(() => {}))
    );

    await query(
      "DELETE FROM photos WHERE created_at <= (NOW() - INTERVAL 24 HOUR)"
    );

    return expired.length;
  } catch (error) {
    console.error("Gagal membersihkan foto kedaluwarsa (24 jam):", error);
    return 0;
  }
}
