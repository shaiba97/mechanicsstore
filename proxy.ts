import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "store_session";

function hasValidSessionCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return false;
  const expiresAt = Number(raw);
  return (
    Number.isFinite(expiresAt) && expiresAt > Date.now() && expiresAt < Number.MAX_SAFE_INTEGER
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!hasValidSessionCookie(request)) {
    const loginUrl = new URL("/auth/login", request.url);
    const next = `${pathname}${request.nextUrl.search}`;
    if (next !== "/") {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
