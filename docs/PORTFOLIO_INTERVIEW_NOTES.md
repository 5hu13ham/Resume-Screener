# Portfolio-first changes — Interview one-liners

| Step | Change | Why it matters / connection to the system | Technical concept |
|---|---|---|---|
| 1 | Replaced `rs_demo_session=1` with signed tokens | Stops forged demo login and creates a distinct visitor identity. | HMAC-SHA256, integrity, expiring claims |
| 2 | Used Strict HttpOnly demo cookies | Keeps credentials away from JavaScript and reduces cross-site request exposure. | Cookie security, XSS/CSRF risk reduction |
| 3 | Restricted demo write endpoints | Anonymous visitors can explore synthetic results but cannot upload personal résumés. | Authorization, least privilege |
| 4 | Scoped data to server-verified user IDs | A visitor cannot fetch another visitor's screening by guessing its ID. | Tenant isolation, IDOR prevention |
| 5 | Kept interfaces unchanged | Replacing JSON/local files with PostgreSQL/object storage won't change application use cases. | Clean Architecture, dependency inversion |
| 6 | Serialized JSON writes | Parallel screening updates do not overwrite each other in one Node process. | Async mutex/queue, atomic rename |
| 7 | Limited screening to two candidates at once | Reduces LLM request spikes and file I/O contention. | Bounded concurrency, backpressure |
| 8 | Cleared stale evaluations before retries | A failed retry won't leave an old ranking attached to a failed candidate. | State-machine correctness |
| 9 | Recorded AI provenance | Each score identifies heuristic/Gemini engine, version, model and fallback reason. | Observability, provenance, auditability |
| 10 | Improved text skill matching | Avoids matching tiny skill names inside unrelated words. | Regex boundaries, false positives |
| 11 | Treated resume and JD as untrusted inputs | Reduces chance of following prompt-injection instructions embedded in documents. | Prompt injection defense-in-depth |
| 12 | Validated file signatures and batch limits | Stops renamed non-PDF/DOCX files and limits resource usage. | MIME/magic bytes, input validation |
| 13 | Hardened local file paths | Keeps files within an intended storage root and avoids filename collisions. | Path traversal prevention, UUID |
| 14 | Labeled results as uncalibrated guidance | Hiring stays a human decision, not an automatic AI rejection. | Human-in-the-loop AI, evaluation calibration |
| 15 | Added repeatable CI demo/security tests | Verifies fake cookies fail, visitors are isolated and sample reports generate. | CI, integration tests, regression prevention |

**Interview explanation:** "I strengthened a Next.js AI screening demo using signed per-user sessions, server-side authorization, process-safe file persistence, bounded candidate processing, model/fallback provenance, schema-validated LLM outputs and GitHub Actions security/workflow tests. I kept storage and AI behind domain ports for a future SaaS migration."
