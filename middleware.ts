import { type NextRequest, NextResponse } from "next/server";

import { DEMO_COOKIE, DEMO_MODE_ENABLED } from "@/src/infrastructure/auth/demo-auth";
import { verifyDemoSessionToken } from "@/src/infrastructure/auth/demo-session";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { updateSession } from "@/src/infrastructure/auth/supabase-middleware";

function isAuthRoute(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/auth");
}
function isProtectedPage(pathname: string) {
  return ["/dashboard", "/upload", "/candidates", "/reports", "/settings", "/screenings"]
    .some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
function isProtectedApi(pathname: string) {
  return ["/api/sessions", "/api/candidates", "/api/demo"]
    .some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Demo mutations must originate from this application. Never rely on SameSite alone.
  if (DEMO_MODE_ENABLED && pathname.startsWith("/api/") &&
      !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Cross-origin request denied", code: "FORBIDDEN" },
        { status: 403 },
      );
    }
  }

  // Public only for minting a separate, signed demo identity.
  if (DEMO_MODE_ENABLED && pathname === "/api/demo/session" && request.method === "POST") {
    return NextResponse.next();
  }

  const identity = DEMO_MODE_ENABLED
    ? await verifyDemoSessionToken(request.cookies.get(DEMO_COOKIE)?.value)
    : null;

  if (identity) {
    if (isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (hasSupabaseEnv()) return updateSession(request);

  if (isProtectedApi(pathname)) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  if (isProtectedPage(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
