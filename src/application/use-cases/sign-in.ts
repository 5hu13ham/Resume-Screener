"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  DEMO_COOKIE,
  DEMO_MODE_ENABLED,
  isDemoCredentials,
} from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { createClient } from "@/src/infrastructure/auth/supabase-server";

export type SignInState = {
  error?: string;
};

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (DEMO_MODE_ENABLED && isDemoCredentials(email, password)) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect(next.startsWith("/") ? next : "/dashboard");
  }

  if (!hasSupabaseEnv()) {
    return {
      error: DEMO_MODE_ENABLED
        ? "Use demo@resumescreener.local / demo1234 for demo login."
        : "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
