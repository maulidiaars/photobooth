import { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken, type AdminTokenPayload } from "@/lib/auth";

export function requireAdmin(request: NextRequest): AdminTokenPayload | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
