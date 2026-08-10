import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { deletePublicFile, saveBase64Image } from "@/lib/fileStorage";
import { requireAdmin } from "@/lib/requireAdmin";
import { parseFrameRow, type FrameRow } from "@/lib/frameRow";
import type { UpdateFramePayload } from "@/types/frame";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const [row] = await query<FrameRow[]>("SELECT * FROM frames WHERE id = ?", [id]);
    if (!row) {
      return NextResponse.json({ message: "Frame tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: parseFrameRow(row) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memuat frame" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const [existingRow] = await query<FrameRow[]>("SELECT * FROM frames WHERE id = ?", [id]);
    if (!existingRow) {
      return NextResponse.json({ message: "Frame tidak ditemukan" }, { status: 404 });
    }
    const existing = parseFrameRow(existingRow);

    const body = (await request.json()) as UpdateFramePayload;
    const nama = body.nama ?? existing.nama;

    let framePng = existing.frame_png;
    let thumbnail = existing.thumbnail;
    let slot = existing.slot;
    let slotLayout = existing.slot_layout;

    // A new PNG upload always comes with a freshly-detected slotLayout
    // from the browser — re-analyzing the image itself, so slot count
    // and hole positions always stay in sync with the actual file.
    if (body.framePngBase64 && body.slotLayout && body.slotLayout.length > 0) {
      const saved = await saveBase64Image(body.framePngBase64, "frames", "frame");
      await deletePublicFile(existing.frame_png);
      framePng = saved.publicPath;
      thumbnail = saved.publicPath;
      slotLayout = body.slotLayout;
      slot = body.slotLayout.length;
    }

    await query(
      `UPDATE frames SET nama = ?, thumbnail = ?, frame_png = ?, slot = ?, slot_layout = ? WHERE id = ?`,
      [nama, thumbnail, framePng, slot, JSON.stringify(slotLayout), id]
    );

    const [updatedRow] = await query<FrameRow[]>("SELECT * FROM frames WHERE id = ?", [id]);
    return NextResponse.json({ data: updatedRow ? parseFrameRow(updatedRow) : null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memperbarui frame" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const [existingRow] = await query<FrameRow[]>("SELECT * FROM frames WHERE id = ?", [id]);
    if (!existingRow) {
      return NextResponse.json({ message: "Frame tidak ditemukan" }, { status: 404 });
    }

    await query("DELETE FROM frames WHERE id = ?", [id]);
    await deletePublicFile(existingRow.frame_png);
    if (existingRow.thumbnail !== existingRow.frame_png) {
      await deletePublicFile(existingRow.thumbnail);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menghapus frame" }, { status: 500 });
  }
}
