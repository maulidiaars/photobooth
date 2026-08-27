import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { query } from "@/lib/db";
import { saveBase64Image } from "@/lib/fileStorage";
import { cleanupExpiredPhotos } from "@/lib/cleanup";
import { parsePhotoRow, type PhotoRow } from "@/lib/photoRow";
import type { CreatePhotoPayload, PhotoStatus } from "@/types/photo";

export async function GET(request: NextRequest) {
  try {
    // Bersihin dulu foto yang udah lewat 24 jam sebelum ambil data,
    // supaya list yang dilihat admin otomatis gak nampilin foto basi.
    await cleanupExpiredPhotos();

    const status = request.nextUrl.searchParams.get("status") as PhotoStatus | null;

    const baseSql = `
      SELECT p.*, f.nama AS frame_nama, f.slot AS frame_slot
      FROM photos p
      LEFT JOIN frames f ON f.id = p.frame_id
    `;

    const rows = status
      ? await query<PhotoRow[]>(`${baseSql} WHERE p.status = ? ORDER BY p.created_at DESC`, [status])
      : await query<PhotoRow[]>(`${baseSql} ORDER BY p.created_at DESC`);

    return NextResponse.json({ data: rows.map(parsePhotoRow) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat data foto" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePhotoPayload;
    const { frame_id, imageResultBase64, rawPhotosBase64, whatsappNumber } = body;

    if (
      !frame_id ||
      !imageResultBase64 ||
      !whatsappNumber ||
      !Array.isArray(rawPhotosBase64) ||
      rawPhotosBase64.length === 0
    ) {
      return NextResponse.json({ message: "Data foto tidak lengkap" }, { status: 400 });
    }

    const [frame] = await query<{ id: string }[]>("SELECT id FROM frames WHERE id = ?", [
      frame_id,
    ]);
    if (!frame) {
      return NextResponse.json({ message: "Frame tidak ditemukan" }, { status: 404 });
    }

    const saved = await saveBase64Image(imageResultBase64, "uploads", "result");

    // Upload tiap foto original (raw, tanpa frame) satu-satu, urut
    // sesuai slotnya, biar admin & pengguna nanti bisa unduh satu-satu
    // persis sejumlah slot yang ada di frame tsb.
    const rawSaved = await Promise.all(
      rawPhotosBase64.map((raw) => saveBase64Image(raw, "uploads", "raw"))
    );
    const rawPaths = rawSaved.map((r) => r.publicPath);

    const id = uuidv4();
    await query(
      `INSERT INTO photos (id, frame_id, image_result, raw_photos, whatsapp_number, status, notified)
       VALUES (?, ?, ?, ?, ?, 'pending', 0)`,
      [id, frame_id, saved.publicPath, JSON.stringify(rawPaths), whatsappNumber]
    );

    const [created] = await query<PhotoRow[]>("SELECT * FROM photos WHERE id = ?", [id]);
    return NextResponse.json(
      { data: created ? parsePhotoRow(created) : null },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan foto" }, { status: 500 });
  }
}