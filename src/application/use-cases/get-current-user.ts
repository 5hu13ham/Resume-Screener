import { cookies } from "next/headers";

import {
  DEMO_COOKIE,
  DEMO_MODE_ENABLED,
  DEMO_USER,
} from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";
import { createClient } from "@/src/infrastructure/auth/supabase-server";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  isDemo: boolean;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const demoSession = cookieStore.get(DEMO_COOKIE)?.value;

  if (DEMO_MODE_ENABLED && demoSession === "1") {
    return { ...DEMO_USER, isDemo: true };
  }

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "unknown@user.local",
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User",
    isDemo: false,
  };
}
