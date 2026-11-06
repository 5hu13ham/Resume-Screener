const base = process.env.APP_URL ?? "http://localhost:3000";
const origin = new URL(base).origin;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openDemoSession() {
  const response = await fetch(base + "/api/demo/session", {
    method: "POST", headers: { Origin: origin },
  });
  assert(response.status === 200, "Failed to open signed demo session (" + response.status + ")");
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert(cookie?.startsWith("rs_demo_session="), "Missing signed HttpOnly demo cookie");
  return cookie;
}

const cookie = await openDemoSession();
async function request(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("Cookie", cookie);
  if (!["GET", "HEAD"].includes(init.method ?? "GET")) headers.set("Origin", origin);
  const response = await fetch(base + path, { ...init, headers, redirect: "manual" });
  const data = await response.json();
  return { response, data };
}

console.log("Starting synthetic resume screening…");
const startedAt = Date.now();
const first = await request("/api/demo/run", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
assert(first.response.ok, "Demo run failed: " + JSON.stringify(first.data));
assert(first.data.session?.isDemo === true, "Session must be tagged demo");
assert(first.data.session?.title === "Demo Screening", "Wrong demo title");
assert(first.data.candidates?.length === 9, "Exactly nine bundled resumes expected");
assert(first.data.candidates.every((c) => c.status === "ready" &&
  c.evaluation?.provenance?.engine === "heuristic"), "Synthetic demo must be deterministic");
const ranks = first.data.candidates.map((c) => c.rank);
assert(new Set(ranks).size === ranks.length && ranks.includes(1), "Bad ranking order");

const reused = await request("/api/demo/run", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ forceRefresh: true }),
});
assert(reused.response.ok && reused.data.reusedExisting &&
  reused.data.session?.id === first.data.session.id, "Should reuse demo, not force refresh");

const report = await fetch(base + "/api/sessions/" + first.data.session.id + "/report", {
  headers: { Cookie: cookie },
});
assert(report.ok && (await report.arrayBuffer()).byteLength > 500, "PDF report unavailable");

const reset = await request("/api/demo/reset", { method: "POST" });
assert(reset.response.ok && reset.data.deletedSessionCount >= 1, "Reset failed");
console.log("Signed instant demo verified in", Date.now() - startedAt, "ms");
