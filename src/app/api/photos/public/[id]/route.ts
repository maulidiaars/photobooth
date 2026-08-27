import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

interface PublicPhotoRow {
  id: string;
  image_result: string;
  raw_photos: string | string[] | null;
  created_at: string;
  frame_nama: string | null;
}

/**
 * Public endpoint backing /foto/[id] — the page guests land on from the
 * WhatsApp message to view + download their own result photo.
 *
 * Deliberately returns only what that page needs to render (image, raw
 * photos, frame name, date). It never returns whatsapp_number or any
 * other guest's data, and never lists photos — you can only fetch one by
 * its (unguessable) uuid.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const [photo] = await query<PublicPhotoRow[]>(
      `SELECT p.id, p.image_result, p.raw_photos, p.created_at, f.nama AS frame_nama
       FROM photos p
       LEFT JOIN frames f ON f.id = p.frame_id
       WHERE p.id = ?`,
      [id]
    );

    if (!photo) {
      return NextResponse.json({ message: "Foto tidak ditemukan" }, { status: 404 });
    }

    let rawPhotos: string[] = [];
    if (Array.isArray(photo.raw_photos)) {
      rawPhotos = photo.raw_photos;
    } else if (typeof photo.raw_photos === "string" && photo.raw_photos.length > 0) {
      try {
        rawPhotos = JSON.parse(photo.raw_photos) as string[];
      } catch {
        rawPhotos = [];
      }
    }

    return NextResponse.json({
      data: {
        id: photo.id,
        image_result: photo.image_result,
        raw_photos: rawPhotos,
        created_at: photo.created_at,
        frame_nama: photo.frame_nama,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat foto" }, { status: 500 });
  }
}