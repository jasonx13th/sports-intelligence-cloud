import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "sic_access_token";

export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/home",
    "/teams",
    "/teams/:path*",
    "/sessions",
    "/sessions/:path*",
    "/equipment",
    "/equipment/:path*",
    "/methodology",
    "/methodology/:path*"
  ]
};
