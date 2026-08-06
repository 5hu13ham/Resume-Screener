import { type NextRequest, NextResponse } from "next/server";

import {
  DEMO_COOKIE,
  DEMO_MODE_ENABLED,
} from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { updateSession } from "@/src/infrastructure/auth/supabase-middleware";

function isAuthRoute(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/auth");
}

function isProtectedPage(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/candidates") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/screenings")
  );
}

function isProtectedApi(pathname: string) {
  return (
    pathname.startsWith("/api/sessions") || pathname.startsWith("/api/candidates")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const demoSession = request.cookies.get(DEMO_COOKIE)?.value === "1";

  if (DEMO_MODE_ENABLED && demoSession) {
    if (isAuthRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (hasSupabaseEnv()) {
    return updateSession(request);
  }

  if (isProtectedApi(pathname)) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  if (isProtectedPage(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
