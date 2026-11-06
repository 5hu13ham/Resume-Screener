# Portfolio demo — engineering decisions

## Boundaries

- Public visitors receive a unique signed HMAC-SHA256 session cookie with a two-hour expiry. Cookies are HttpOnly, SameSite Strict and Secure on HTTPS.
- The demo is a **synthetic-only sandbox**. Real uploads, arbitrary session creation, renaming, deleting, manual re-screening and retries are blocked at the API boundary.
- The only demo mutations allowed are creating/resetting one's **own** synthetic demo run; browser IDs are scoped to individual visitor cookies.
- The demo always uses deterministic heuristic scoring; optional Gemini processing is reserved for a private authenticated environment.
- Resumes contain personal details; never upload real candidate data to the public demo.

## Backend choices and future SaaS path

- Domain ports and DI container stay unchanged to support replacing file repository with a transactional multi-tenant database and object storage.
- JSON repository uses a process-local serialized queue and atomic file replacement. It is **not** appropriate for multi-instance/serverless persistent storage.
- Gemini responses are validated with Zod and provenance identifies the model or fallback and rubric version.
- Screening has capped parallelism to avoid bursting upstream LLM requests.
- UI/report suggestions are for **human review only**; screening scores are uncalibrated and cannot automatically reject applicants.
- Not production-ready: no multi-instance locks, credential rotation, rate limiting, abuse protection, retention jobs or security audit.

## Prioritized future work (not required for portfolio release)

1. Replace JSON and local blobs with tenant-scoped PostgreSQL and object storage.
2. Add durable asynchronous job queue, idempotency and bounded worker concurrency.
3. Add rate limiting, audit logs, retention/deletion controls and privacy notices.
4. Calibrate job-fit scores on representative synthetic datasets, evaluate bias and create appeal paths.
5. Build role and team account management, billing and comprehensive abuse protections.

## Interview concepts

- **HMAC and cookie claims:** integrity and expiration without a global shared demo account.
- **Tenant isolation:** each API request derives user identity from signed server-side claims.
- **Dependency inversion:** the application depends on storage/LLM interfaces, not their implementations.
- **Provenance:** persisted AI output specifies model, fallback reason and rubric version.
- **Bounded concurrency and atomic writes:** avoid request fan-out and lost updates in a single process.
- **Human-in-the-loop:** AI suggestions support an interviewer; they do not make hiring decisions.
