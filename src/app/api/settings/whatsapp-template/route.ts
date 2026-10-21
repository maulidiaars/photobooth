
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/ensureSchema";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_TEMPLATE_KEY,
  WHATSAPP_TEMPLATE_MAX_LENGTH,
} from "@/lib/whatsappTemplate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json(
      { message: "Sesi admin tidak valid. Silakan login kembali." },
      { status: 401 }
    );
  }

  try {
    await ensureSchema();

    const rows = await query<{ setting_value: string }[]>(
      "SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1",
      [WHATSAPP_TEMPLATE_KEY]
    );

    const saved = rows[0]?.setting_value;

    return NextResponse.json({
      data: {
        template: saved ?? DEFAULT_WHATSAPP_TEMPLATE,
        isDefault: saved === undefined,
      },
    });
  } catch (error) {
    console.error("[WhatsApp Template GET]", error);

    return NextResponse.json(
      { message: "Gagal memuat template WhatsApp. Periksa koneksi database." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json(
      { message: "Sesi admin tidak valid. Silakan login kembali." },
      { status: 401 }
    );
  }

  try {
    await ensureSchema();

    const body = (await request.json()) as { template?: unknown };

    if (typeof body.template !== "string") {
      return NextResponse.json(
        { message: "Format pesan tidak valid." },
        { status: 400 }
      );
    }

    const template = body.template.replace(/\r\n/g, "\n");

    if (!template.trim()) {
      return NextResponse.json(
        { message: "Isi pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (template.length > WHATSAPP_TEMPLATE_MAX_LENGTH) {
      return NextResponse.json(
        {
          message: `Pesan terlalu panjang. Maksimal ${WHATSAPP_TEMPLATE_MAX_LENGTH} karakter.`,
        },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [WHATSAPP_TEMPLATE_KEY, template]
    );

    return NextResponse.json({
      data: {
        template,
        isDefault: false,
      },
    });
  } catch (error) {
    console.error("[WhatsApp Template PUT]", error);

    return NextResponse.json(
      { message: "Pesan gagal disimpan. Periksa database dan konfigurasi server." },
      { status: 500 }
    );
  }
}
