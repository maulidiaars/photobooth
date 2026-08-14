import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Public endpoint backing /foto/[id] — the page guests land on from the
 * WhatsApp message to view + download their own result photo.
 *
 * Deliberately returns only what that page needs to render (image,
 * frame name, date). It never returns whatsapp_number or any other
 * guest's data, and never lists photos — you can only fetch one by its
 * (unguessable) uuid.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const [photo] = await query<
      { id: string; image_result: string; created_at: string; frame_nama: string | null }[]
    >(
      `SELECT p.id, p.image_result, p.created_at, f.nama AS frame_nama
       FROM photos p
       LEFT JOIN frames f ON f.id = p.frame_id
       WHERE p.id = ?`,
      [id]
    );

    if (!photo) {
      return NextResponse.json({ message: "Foto tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: photo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat foto" }, { status: 500 });
  }
}
