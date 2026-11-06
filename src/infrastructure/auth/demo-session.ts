import { DEMO_SESSION_AGE_SECONDS } from "@/src/infrastructure/auth/demo-auth";

type DemoClaims = { v: 1; sub: string; exp: number };

function signingKey(): string | null {
  const key = process.env.DEMO_SESSION_SECRET;
  return key && new TextEncoder().encode(key).length >= 32 ? key : null;
}

async function importKey(raw: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(raw),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encode(input: Uint8Array): string {
  let binary = "";
  for (const b of input) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function createDemoSessionToken(): Promise<string> {
  const secret = signingKey();
  if (!secret) throw new Error("DEMO_SESSION_SECRET must have at least 32 UTF-8 bytes");
  const claims: DemoClaims = {
    v: 1,
    sub: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + DEMO_SESSION_AGE_SECONDS,
  };
  const payload = encode(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), new TextEncoder().encode(payload));
  return payload + "." + encode(new Uint8Array(signature));
}

/** Validated, unforgeable per-browser identity; safe on Node and Edge runtimes. */
export async function verifyDemoSessionToken(token: string | undefined): Promise<string | null> {
  const secret = signingKey();
  if (!secret || !token || token.length > 1000) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) return null;
  try {
    const payload = parts[0]!;
    const verified = await crypto.subtle.verify(
      "HMAC", await importKey(secret), decode(parts[1]!),
      new TextEncoder().encode(payload),
    );
    if (!verified) return null;
    const claims: DemoClaims = JSON.parse(new TextDecoder().decode(decode(payload)));
    const now = Math.floor(Date.now() / 1000);
    if (claims.v !== 1 || typeof claims.sub !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(claims.sub) ||
        !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
        claims.exp > now + DEMO_SESSION_AGE_SECONDS) return null;
    return "demo_" + claims.sub;
  } catch {
    return null;
  }
}
