import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = process.env.APP_URL ?? "http://localhost:3000";
const cookie = "rs_demo_session=1";

async function request(pathname, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("cookie", cookie);
  const response = await fetch(`${base}${pathname}`, {
    ...init,
    headers,
    redirect: "manual",
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : Buffer.from(await response.arrayBuffer());
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const jd = `We are hiring a Senior Frontend Engineer with 5+ years experience.
Must have TypeScript, React, Next.js, Tailwind, GraphQL.
Nice to have AWS and leadership experience. Bachelor's degree preferred.`;

console.log("1) Creating session...");
const create = await request("/api/sessions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    title: "Frontend Cohort",
    jobDescription: jd,
  }),
});
assert(create.response.status === 201, `create failed: ${create.response.status}`);
const sessionId = create.body.session.id;
console.log("   session:", sessionId);

console.log("2) Uploading resumes...");
const form = new FormData();
form.append(
  "files",
  new Blob([fs.readFileSync(path.join(root, "fixtures/alice-frontend.pdf"))], {
    type: "application/pdf",
  }),
  "alice-frontend.pdf",
);
form.append(
  "files",
  new Blob([fs.readFileSync(path.join(root, "fixtures/bob-backend.pdf"))], {
    type: "application/pdf",
  }),
  "bob-backend.pdf",
);
const upload = await request(`/api/sessions/${sessionId}/uploads`, {
  method: "POST",
  body: form,
});
assert(upload.response.status === 201, `upload failed: ${JSON.stringify(upload.body)}`);
assert(upload.body.candidates?.length === 2, "expected 2 candidates");
console.log("   uploaded:", upload.body.candidates.length);

console.log("3) Running AI screening...");
const screen = await request(`/api/sessions/${sessionId}/screen`, {
  method: "POST",
});
assert(screen.response.status === 200, `screen failed: ${JSON.stringify(screen.body)}`);
assert(screen.body.candidates?.length === 2, "expected ranked candidates");
const ranked = screen.body.candidates;
console.log(
  "   ranks:",
  ranked.map((c) => ({
    rank: c.rank,
    name: c.extraction?.name,
    score: c.evaluation?.overallMatchScore,
    status: c.status,
  })),
);
assert(
  ranked.every((c) => c.status === "ready" && c.evaluation),
  "all candidates should be ready with evaluations",
);
assert(ranked[0].rank === 1, "first candidate should be rank 1");

console.log("4) Fetching candidate detail...");
const candidateId = ranked[0].id;
const detail = await request(`/api/candidates/${candidateId}`);
assert(detail.response.status === 200, "candidate detail failed");
assert(detail.body.candidate.evaluation.recommendedInterviewQuestions.length > 0, "missing questions");

console.log("5) Downloading reports...");
fs.mkdirSync(path.join(root, "data"), { recursive: true });
const sessionReport = await request(`/api/sessions/${sessionId}/report`);
assert(sessionReport.response.status === 200, "session report failed");
assert(sessionReport.body.byteLength > 500, "session report too small");
fs.writeFileSync(path.join(root, "data/test-session-report.pdf"), sessionReport.body);

const candidateReport = await request(`/api/candidates/${candidateId}/report`);
assert(candidateReport.response.status === 200, "candidate report failed");
assert(candidateReport.body.byteLength > 500, "candidate report too small");
fs.writeFileSync(path.join(root, "data/test-candidate-report.pdf"), candidateReport.body);

console.log("6) Checking pages...");
for (const route of [
  `/screenings/${sessionId}`,
  `/candidates/${candidateId}`,
  "/candidates",
  "/reports",
  "/upload",
]) {
  const page = await request(route);
  assert(page.response.status === 200, `${route} returned ${page.response.status}`);
}

console.log("\nWorkflow verification passed.");
