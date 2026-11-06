# AI Resume Screener — Current architecture

## Scope and status

This is a **synthetic-data, portfolio-first demonstration**, not a production recruitment SaaS. Code on `feature/portfolio-safe-demo-ai-reliability-2026-11-06` is based on `cursor/ai-recruiter-copilot-gemini`. Current persistence uses a local JSON repository and local uploaded files—not PostgreSQL, Supabase Storage or durable serverless storage.

## Layers and dependency rule

```text
app/ + src/presentation/        Next.js routes / React UI / auth controls
                   │
src/application/               Upload, screen, rank, report, reset use cases
                   │
src/domain/                    Candidate, session, evaluation, interfaces
                   ▲
src/infrastructure/            File repository and storage; parsers; AI; PDF generator
                   │
             runtime DI container
```

Domain/application code uses interfaces such as `ScreeningRepository`, `FileStorage`, `ResumeParser` and `AiRecruiterService`. The container selects concrete adapters. This makes a later SaaS migration possible without rewriting core use cases.

## Public sandbox trust boundaries

1. A browser POST to `/api/demo/session` receives an HMAC-SHA256 signed, two-hour HttpOnly cookie (SameSite Strict, HTTPS Secure).
2. Edge middleware verifies the signature, expiry and same-origin mutation requests.
3. The server derives a distinct demo user ID from each signed session; neither user ID nor storage path is accepted from the client as authority.
4. Public demo users may see their own synthetic sessions, candidates, reports and run/reset sample data; write APIs for real uploads and arbitrary records require a non-demo authenticated user.
5. Demo screening uses nine bundled **synthetic** PDFs. The heuristic engine is used even if a private Gemini API key is configured.
6. No public credentials or shared fixed-value session cookie grant access.

## Screening

```text
Bundled sample PDFs → per-session upload → PDF parser → text extraction
→ heuristic extraction → heuristic evaluation + model/rubric provenance
→ rank by illustrative alignment indicator → candidate summary / PDF report
```

Private authenticated mode can use Gemini via the OpenAI SDK against Google's compatible endpoint. Gemini response JSON is validated with Zod; exceptions trigger a heuristic fallback with a recorded reason. This private workflow is **not** a production data-processing service.

`screenSession` limits processing to two candidates in parallel. Failed candidate evaluations are not included among ranked-ready candidates. Retrying a private candidate replaces stale evaluation metadata.

## Storage consistency

`FileScreeningRepository` has a process-local write queue and uses atomic temporary-file rename to reduce lost updates in one Node process. Candidate access filters on server-derived user IDs. `LocalFileStorage` scopes file paths under the upload root and uses randomized names.

**Not suitable for multiple server replicas/serverless:** no inter-process locking, durable queue, backup/restore or lifecycle retention. A real deployment needs transactional SQL/NoSQL storage, object storage and asynchronous workers.

## Screening limitations

Scores measure heuristic text/skills overlap, not candidate merit or hiring performance. Employment history, career gaps and educational details must not be used as unreviewed exclusion signals. All evaluations require human review. Prompt injection defenses are best-effort; uploaded résumés and job descriptions are untrusted inputs. Even Gemini output validated against a schema can still be factually incorrect.

## Deployment and controls

Local Next.js development is supported. GitHub Actions runs TypeScript/ESLint/build checks, then boots the app and runs synthetic-demo and security boundary smoke tests. A persistent cloud deployment, rate limiting, advanced telemetry, secure multi-user database and GDPR/DPDP data processing controls are not claimed.

See [portfolio release plan](docs/PORTFOLIO_RELEASE_PLAN.md) for the SaaS roadmap.
