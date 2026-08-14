import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ADMIN_COOKIE_NAME, comparePassword, signAdminToken } from "@/lib/auth";
import type { LoginPayload } from "@/types/admin";

interface AdminRow {
  id: string;
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as LoginPayload;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const [admin] = await query<AdminRow[]>(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (!admin) {
      return NextResponse.json({ message: "Username atau password salah" }, { status: 401 });
    }

    const isValid = await comparePassword(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ message: "Username atau password salah" }, { status: 401 });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username });

    const response = NextResponse.json({
      data: { admin: { id: admin.id, username: admin.username }, token },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ data: { loggedOut: true } });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
