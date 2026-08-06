export const DEMO_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.DEMO_MODE === "true";

export const DEMO_COOKIE = "rs_demo_session";

export const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@resumescreener.local",
  fullName: "Demo Recruiter",
};

export const DEMO_CREDENTIALS = {
  email: "demo@resumescreener.local",
  password: "demo1234",
};

export function isDemoCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
