import { query } from "@/lib/db";

/**
 * Self-migrating schema helper.
 *
 * Bikin 2 hal secara otomatis (cuma sekali per instance server):
 *  1. Kolom `frames.archived`   -> buat fitur arsip frame
 *  2. Tabel `settings`          -> buat simpan template pesan WhatsApp
 *
 * Jadi kamu NGGAK perlu jalanin SQL manual di database — cukup deploy
 * kodenya, begitu API dipanggil pertama kali tabelnya ngurus dirinya sendiri.
 */
let schemaPromise: Promise<void> | null = null;

async function run() {
  const cols = await query<{ c: number | string }[]>(
    `SELECT COUNT(*) AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'frames'
        AND COLUMN_NAME = 'archived'`
  );

  if (Number(cols[0]?.c ?? 0) === 0) {
    try {
      await query(
        "ALTER TABLE frames ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0"
      );
    } catch (error) {
      // Dua request barengan bisa sama-sama coba nambah kolom.
      // Kalau kolomnya udah ada (errno 1060), aman diabaikan.
      const code = (error as { code?: string }).code;
      if (code !== "ER_DUP_FIELDNAME") throw error;
    }
  }

  await query(
    `CREATE TABLE IF NOT EXISTS settings (
       setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
       setting_value TEXT NOT NULL,
       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
}

export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = run().catch((error) => {
      schemaPromise = null; // biar dicoba lagi di request berikutnya
      throw error;
    });
  }
  return schemaPromise;
}
