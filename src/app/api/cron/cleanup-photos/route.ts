import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredPhotos } from "@/lib/cleanup";

/**
 * Endpoint buat Vercel Cron (lihat vercel.json) — jaring pengaman supaya
 * foto yang udah lewat 24 jam tetap kehapus dari database + Vercel Blob
 * walaupun kebetulan lagi gak ada admin yang buka dashboard (yang mana
 * jadi tempat "lazy cleanup" biasanya jalan, lihat src/lib/cleanup.ts).
 *
 * Kalau env var CRON_SECRET diisi di Vercel, endpoint ini otomatis
 * ke-protect: Vercel bakal ngirim header
 * `Authorization: Bearer <CRON_SECRET>` tiap manggil cron ini, jadi kalau
 * ada orang lain coba akses endpoint ini langsung dari luar bakal ditolak.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const deleted = await cleanupExpiredPhotos();
  return NextResponse.json({ ok: true, deleted });
}
