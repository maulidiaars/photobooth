import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cleanupExpiredPhotos } from "@/lib/cleanup";
import type { DashboardStats } from "@/types/photo";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Sama kayak /api/photos — bersihin foto yang udah lewat 24 jam dulu
    // biar angka statistiknya gak ikut ngitung foto yang sebetulnya udah
    // "kadaluwarsa".
    await cleanupExpiredPhotos();

    const [framesRows, photosRows, pendingRows, printedRows, newRows] = await Promise.all([
      query<{ totalFrames: number }[]>("SELECT COUNT(*) AS totalFrames FROM frames"),
      query<{ totalPhotos: number }[]>("SELECT COUNT(*) AS totalPhotos FROM photos"),
      query<{ pendingPrint: number }[]>(
        "SELECT COUNT(*) AS pendingPrint FROM photos WHERE status = 'pending'"
      ),
      query<{ printed: number }[]>(
        "SELECT COUNT(*) AS printed FROM photos WHERE status = 'printed'"
      ),
      query<{ newEntries: number }[]>(
        "SELECT COUNT(*) AS newEntries FROM photos WHERE notified = 0"
      ),
    ]);

    const stats: DashboardStats = {
      totalFrames: framesRows[0]?.totalFrames ?? 0,
      totalPhotos: photosRows[0]?.totalPhotos ?? 0,
      pendingPrint: pendingRows[0]?.pendingPrint ?? 0,
      printed: printedRows[0]?.printed ?? 0,
      newEntries: newRows[0]?.newEntries ?? 0,
    };
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat statistik" }, { status: 500 });
  }
}
