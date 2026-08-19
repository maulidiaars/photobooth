import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { query } from "@/lib/db";
import { saveBase64Image } from "@/lib/fileStorage";
import { cleanupExpiredPhotos } from "@/lib/cleanup";
import type { CreatePhotoPayload, Photo, PhotoStatus } from "@/types/photo";

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

    const photos = status
      ? await query<Photo[]>(`${baseSql} WHERE p.status = ? ORDER BY p.created_at DESC`, [status])
      : await query<Photo[]>(`${baseSql} ORDER BY p.created_at DESC`);

    return NextResponse.json({ data: photos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat data foto" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePhotoPayload;
    const { frame_id, imageResultBase64, whatsappNumber } = body;

    if (!frame_id || !imageResultBase64 || !whatsappNumber) {
      return NextResponse.json({ message: "Data foto tidak lengkap" }, { status: 400 });
    }

    const [frame] = await query<{ id: string }[]>("SELECT id FROM frames WHERE id = ?", [
      frame_id,
    ]);
    if (!frame) {
      return NextResponse.json({ message: "Frame tidak ditemukan" }, { status: 404 });
    }

    const saved = await saveBase64Image(imageResultBase64, "uploads", "result");

    const id = uuidv4();
    await query(
      `INSERT INTO photos (id, frame_id, image_result, whatsapp_number, status, notified)
       VALUES (?, ?, ?, ?, 'pending', 0)`,
      [id, frame_id, saved.publicPath, whatsappNumber]
    );

    const [created] = await query<Photo[]>("SELECT * FROM photos WHERE id = ?", [id]);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan foto" }, { status: 500 });
  }
}
