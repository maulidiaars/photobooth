import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { query } from "@/lib/db";
import { saveBase64Image } from "@/lib/fileStorage";
import { requireAdmin } from "@/lib/requireAdmin";
import { parseFrameRow, type FrameRow } from "@/lib/frameRow";
import type { CreateFramePayload } from "@/types/frame";

export async function GET() {
  try {
    const rows = await query<FrameRow[]>("SELECT * FROM frames ORDER BY created_at DESC");
    return NextResponse.json({ data: rows.map(parseFrameRow) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memuat data frame" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateFramePayload;
    const { nama, framePngBase64, slotLayout } = body;

    if (!nama || !framePngBase64 || !slotLayout || slotLayout.length === 0) {
      return NextResponse.json(
        { message: "Nama, file frame PNG, dan hasil deteksi kotak foto wajib ada" },
        { status: 400 }
      );
    }

    // Only ONE file is uploaded — the transparent frame PNG itself also
    // doubles as the thumbnail preview, so no separate thumbnail upload
    // is needed.
    const framePng = await saveBase64Image(framePngBase64, "frames", "frame");

    const id = uuidv4();
    await query(
      `INSERT INTO frames (id, nama, thumbnail, frame_png, slot, slot_layout) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nama, framePng.publicPath, framePng.publicPath, slotLayout.length, JSON.stringify(slotLayout)]
    );

    const [created] = await query<FrameRow[]>("SELECT * FROM frames WHERE id = ?", [id]);
    return NextResponse.json({ data: created ? parseFrameRow(created) : null }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal membuat frame baru" },
      { status: 500 }
    );
  }
}
