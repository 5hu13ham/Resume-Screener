import { NextResponse } from "next/server";
import { DEMO_COOKIE, DEMO_MODE_ENABLED, DEMO_SESSION_AGE_SECONDS } from "@/src/infrastructure/auth/demo-auth";
import { createDemoSessionToken, verifyDemoSessionToken } from "@/src/infrastructure/auth/demo-session";
import { jsonError } from "@/src/presentation/lib/api";

export const runtime = "nodejs";

/** Public sandbox entry point; never grants access to real resume uploads. */
export async function POST(request: Request) {
  if (!DEMO_MODE_ENABLED) {
    return NextResponse.json({ error: "Demo is disabled" }, { status: 404 });
  }
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  }

  try {
    const current = request.headers.get("cookie")?.match(/(?:^|;\s*)rs_demo_session=([^;]+)/)?.[1];
    const valid = await verifyDemoSessionToken(current);
    const response = NextResponse.json({ ok: true });
    if (!valid) {
      response.cookies.set(DEMO_COOKIE, await createDemoSessionToken(), {
        httpOnly: true, sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: DEMO_SESSION_AGE_SECONDS,
      });
    }
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
