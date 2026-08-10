import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { deletePublicFile } from "@/lib/fileStorage";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Photo } from "@/types/photo";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = (await request.json()) as { status?: "pending" | "printed"; notified?: boolean };
    const { status, notified } = body;

    if (status !== undefined && !["pending", "printed"].includes(status)) {
      return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
    }

    const [existing] = await query<Photo[]>("SELECT * FROM photos WHERE id = ?", [id]);
    if (!existing) {
      return NextResponse.json({ message: "Foto tidak ditemukan" }, { status: 404 });
    }

    if (status !== undefined) {
      await query("UPDATE photos SET status = ? WHERE id = ?", [status, id]);
    }
    if (notified !== undefined) {
      await query("UPDATE photos SET notified = ? WHERE id = ?", [notified ? 1 : 0, id]);
    }
    const [updated] = await query<Photo[]>("SELECT * FROM photos WHERE id = ?", [id]);
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memperbarui status foto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const [existing] = await query<Photo[]>("SELECT * FROM photos WHERE id = ?", [id]);
    if (!existing) {
      return NextResponse.json({ message: "Foto tidak ditemukan" }, { status: 404 });
    }

    await query("DELETE FROM photos WHERE id = ?", [id]);
    await deletePublicFile(existing.image_result);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menghapus foto" }, { status: 500 });
  }
}
