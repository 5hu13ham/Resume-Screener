# AI Resume Screener — Portfolio Demo

**Next.js 15 · React 19 · TypeScript · Clean Architecture · Gemini-compatible AI**

An engineering portfolio project for **AI-assisted resume evidence review and interview preparation**. It parses sample résumés, compares evidence to a job description, organizes candidates and generates interview-preparation reports. **It does not make hiring decisions.**

> This repository is a portfolio demonstration, not a production hiring system. The public sandbox uses **synthetic candidates only**, and ranking scores are uncalibrated indicators.

## What works

- Responsive dashboard with screening sessions and ranked candidates.
- PDF/DOCX parsing with `unpdf` and `mammoth`.
- Gemini model integration via the OpenAI-compatible API (private mode only).
- Deterministic heuristic engine with tracked AI/fallback provenance.
- Evidence-oriented interview suggestions, candidate pages and PDF reports.
- **Instant Demo:** nine bundled synthetic résumés and one sample Java backend job description.
- Per-visitor signed demo sessions, isolation and read-only restrictions for personal uploads.
- Retrying failed candidates in private mode, bounded processing and local JSON persistence.
- CI: TypeScript, ESLint, Next.js build, signed-session security and synthetic workflow smoke tests.

## Start the public demo locally

Node.js 22+ recommended.

```bash
git clone https://github.com/5hu13ham/Resume-Screener.git
cd Resume-Screener
git switch feature/portfolio-safe-demo-ai-reliability-2026-11-06
npm ci
cp .env.example .env.local
```

Generate a **new secret** for `DEMO_SESSION_SECRET` in `.env.local`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not paste the secret into Git or share it publicly.

```bash
npm run dev
```

Open **http://localhost:3000/login**, select **Explore synthetic-data demo**, then press **Try Demo** on the dashboard. No shared username/password or Gemini key is necessary. The demo uses an expiring, signed HttpOnly cookie for each browser.

For automated verification, with the server running:

```bash
npm run verify:demo
node scripts/verify-demo-security.mjs
```

Production build checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Public demo safety boundary

- Demo visitors are isolated by unique HMAC-signed sessions, not a static `rs_demo_session=1` cookie.
- **Personal resume uploads are disabled** for demo users.
- Demo users cannot create arbitrary sessions, rename, delete or re-screen uploaded candidates. They can run/reset **their own** synthetic screening.
- Same-origin restrictions protect demo mutation routes, alongside Strict SameSite cookies.
- Demo results use deterministic heuristics; the product labels the evaluation engine and rubric version.
- Synthetic sample files and local stores are **not** a cloud service or production persistence strategy.

## Architecture

```text
React / Next.js App Router
       │  authenticated routes and server actions
       ▼
Application use cases (screen / upload / report / session lifecycle)
       │
       ▼
Domain entities and interfaces (ports)
       ▲
       │ implementations
       ├─ LocalFileStorage / JSON repository
       ├─ PDF / DOCX parsers
       ├─ Heuristic recruiter (public sandbox)
       ├─ Gemini OpenAI-compatible recruiter (private, opt-in)
       └─ PDFKit report generator
```

More detail: [ARCHITECTURE.md](ARCHITECTURE.md).

## Key API routes

| Path | Purpose |
|---|---|
| `POST /api/demo/session` | Create an isolated signed demo identity |
| `POST /api/demo/run` | Run the synthetic nine-resume demo |
| `POST /api/demo/reset` | Remove only that visitor's demo records |
| `GET /api/sessions` | List the current visitor's sessions |
| `GET /api/sessions/:id` | Retrieve an owned screening session |
| `GET /api/candidates/:id` | Retrieve an owned candidate |
| `GET /api/sessions/:id/report` | Download screening PDF |
| `GET /api/candidates/:id/report` | Download candidate PDF |

Private-mode write endpoints also exist but require a **real authenticated account**. See the architecture notes for restrictions.

## Gemini configuration (optional)

For private authentication and experimental real-data workflows, configure a Supabase account and the optional server-side variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL=gemini-flash-latest
```

The public demo never needs `OPENAI_API_KEY` and doesn't send uploaded personal résumés to an LLM. Private mode still uses **local files/JSON** and is not appropriate for multi-instance hosting or real recruiting data without further privacy, storage and operational work.

## AI result interpretation

Candidate records may include engine/model provenance, a fallback reason and rubric version. Gemini responses are schema-validated, and the heuristic path uses transparent keyword and résumé/JD overlap signals. Scores are not scientifically calibrated or fair-hiring certified; a low score never justifies automatic rejection.

**Future SaaS:** replace local storage adapters with tenant-aware database/object storage, introduce durable background screening workers, audit/retention controls, rate limiting and evaluation calibration.

## Documentation

- [Architecture, trust boundary and trade-offs](ARCHITECTURE.md)
- [Portfolio-first release decisions](docs/PORTFOLIO_RELEASE_PLAN.md)
- [Step-by-step interview changelog](docs/PORTFOLIO_INTERVIEW_NOTES.md)

**Created by Shubham Kumar — software engineering portfolio.**
