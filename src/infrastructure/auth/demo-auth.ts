/**
 * Public demonstration mode. Authentication is handled by signed, expiring
 * per-browser cookies, not a static boolean cookie or shared demo account.
 */
export const DEMO_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.DEMO_MODE === "true";

export const DEMO_COOKIE = "rs_demo_session";
export const DEMO_SESSION_AGE_SECONDS = 2 * 60 * 60;
