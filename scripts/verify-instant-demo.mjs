const base = process.env.APP_URL ?? "http://localhost:3000";
const cookie = "rs_demo_session=1";

async function request(pathname, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("cookie", cookie);
  const response = await fetch(`${base}${pathname}`, { ...init, headers });
  const json = await response.json();
  return { response, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log("Resetting any prior demo…");
const reset = await request("/api/demo/reset", { method: "POST" });
assert(reset.response.ok, `reset failed: ${JSON.stringify(reset.json)}`);

console.log("Running instant demo…");
const started = Date.now();
const run = await request("/api/demo/run", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
const elapsedMs = Date.now() - started;
assert(run.response.ok, `demo run failed: ${JSON.stringify(run.json)}`);
assert(run.json.session?.isDemo === true, "session should be marked demo");
assert(run.json.session?.title === "Demo Screening", "unexpected session title");
assert(run.json.candidates?.length >= 8, "expected 8+ candidates");
assert(
  run.json.candidates.every((c) => c.evaluation),
  "all candidates should be evaluated",
);
const ranks = run.json.candidates.map((c) => c.rank);
assert(new Set(ranks).size === ranks.length, "ranks should be unique");
assert(run.json.candidates[0].rank === 1, "first candidate should be rank 1");

console.log("Re-run should reuse existing demo…");
const reuse = await request("/api/demo/run", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
assert(reuse.response.ok, "reuse failed");
assert(reuse.json.reusedExisting === true, "expected reuse of completed demo");
assert(reuse.json.session.id === run.json.session.id, "session id mismatch on reuse");

console.log("Reset demo again…");
const reset2 = await request("/api/demo/reset", { method: "POST" });
assert(reset2.response.ok, "second reset failed");
assert(reset2.json.deletedSessionCount >= 1, "expected demo session deletion");

console.log(
  `\nInstant demo verification passed in ${elapsedMs}ms (first run). Top candidate:`,
  {
    name: run.json.candidates[0].extraction?.name,
    score: run.json.candidates[0].evaluation?.overallMatchScore,
  },
);
