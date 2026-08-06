"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_COOKIE } from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { createClient } from "@/src/infrastructure/auth/supabase-server";

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
