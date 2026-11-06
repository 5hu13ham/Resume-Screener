const base = process.env.APP_URL ?? "http://localhost:3000";
const origin = new URL(base).origin;
function assert(ok, msg) { if (!ok) throw new Error(msg); }

async function auth() {
  const response = await fetch(base + "/api/demo/session", {
    method: "POST", headers: { Origin: origin },
  });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert(response.ok && cookie?.startsWith("rs_demo_session="), "Demo session could not be issued");
  return cookie;
}
async function call(path, cookie, method = "GET", body) {
  const headers = { Cookie: cookie, Origin: origin };
  if (body) headers["Content-Type"] = "application/json";
  return fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

const forged = await fetch(base + "/api/sessions", { headers: { Cookie: "rs_demo_session=1" } });
assert(forged.status === 401, "Forged fixed-value cookie should not authenticate");

const crossSite = await fetch(base + "/api/demo/session", {
  method: "POST", headers: { Origin: "https://example.net" },
});
assert(crossSite.status === 403, "Cross-origin session request must be denied");

const browserA = await auth();
const browserB = await auth();
assert(browserA !== browserB, "Visitors must receive independent identities");

const manualUpload = await call("/api/sessions", browserA, "POST", {
  title: "Not allowed", jobDescription: "Role ".repeat(20),
});
assert(manualUpload.status === 403, "Public demo must not create arbitrary screening sessions");

const run = await call("/api/demo/run", browserA, "POST", {});
const data = await run.json();
assert(run.ok && data.session?.isDemo, "Synthetic demo should be available");
const sessionId = data.session.id;

const isolated = await call("/api/sessions/" + sessionId, browserB);
assert(isolated.status === 404, "Another visitor must not access this screening");

const blockedWrite = await call("/api/sessions/" + sessionId, browserA, "DELETE");
assert(blockedWrite.status === 403, "Demo cannot modify sessions outside reset");

const unrelatedReset = await call("/api/demo/reset", browserB, "POST");
assert(unrelatedReset.ok, "Other user's reset should succeed");
const stillVisible = await call("/api/sessions/" + sessionId, browserA);
assert(stillVisible.ok, "Other visitor's reset must not erase this session");

const cleanup = await call("/api/demo/reset", browserA, "POST");
assert(cleanup.ok, "Demo cleanup failed");
console.log("Demo cookie forgery, cross-origin, read-only and isolation checks passed");
