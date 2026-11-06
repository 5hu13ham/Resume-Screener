"use server";

import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { createClient } from "@/src/infrastructure/auth/supabase-server";

export type SignInState = { error?: string };

export async function signIn(
  _prev: SignInState, formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  if (!email || !password) return { error: "Email and password are required." };

  if (!hasSupabaseEnv()) {
    return { error: "Private authentication is not configured. Use the portfolio demo instead." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  // Prevent protocol-relative or backslash-based open redirects.
  redirect(next.startsWith("/") && !next.startsWith("//") &&
    !next.includes("\\") ? next : "/dashboard");
}
