import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

const PROTECTED_PREFIXES = ["/admin/dashboard", "/admin/frames", "/admin/photos"];

/**
 * Lightweight gate: only checks that the admin cookie is present.
 * (jsonwebtoken needs Node's crypto module, which the default Middleware
 * Edge runtime doesn't fully support, so full signature verification is
 * done server-side in API routes via requireAdmin — see src/lib/requireAdmin.ts.
 * Every admin API call is independently authorized, so a forged/expired
 * cookie only grants access to the page shell, not to any real data.)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/frames/:path*", "/admin/photos/:path*"],
};
