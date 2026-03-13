import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED  = ["/dashboard", "/admin", "/upload", "/profile", "/create-profile", "/requests/post"];
const GUEST_ONLY = ["/login", "/signup", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token =
    req.cookies.get("__session")?.value ??
    req.cookies.get("token")?.value;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY.some(p => pathname.startsWith(p));

  if (isProtected && !token) return NextResponse.redirect(new URL("/login", req.url));
  if (isGuestOnly && token)  return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)"],
};