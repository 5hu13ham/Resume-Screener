# AI Resume Screener — Architecture

Production-ready SaaS for screening resumes against a job description using AI scoring, ranking, and interview prep.

## Goals

- Clean Architecture with clear dependency direction
- Supabase Auth + PostgreSQL as the system of record
- OpenAI-compatible LLM for scoring and interview questions
- Next.js App Router for UI and BFF API routes
- Deployable on Vercel and via Docker

## High-Level System

```text
┌─────────────────────────────────────────────────────────────┐
│  Presentation (Next.js App Router + React)                  │
│  Pages · Server Actions · API Routes · UI Components        │
└────────────────────────────┬────────────────────────────────┘
                             │ depends on
┌────────────────────────────▼────────────────────────────────┐
│  Application (Use Cases / Orchestration)                    │
│  Upload · Extract · Screen · Rank · Questions · Reports     │
└────────────────────────────┬────────────────────────────────┘
                             │ depends on
┌────────────────────────────▼────────────────────────────────┐
│  Domain (Entities · Ports · Rules)                          │
│  Candidate · Job · Screening · Score · InterviewQuestion    │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │ implements ports
┌────────────────────────────┴────────────────────────────────┐
│  Infrastructure                                             │
│  Supabase Auth/DB/Storage · OpenAI client · PDF/DOCX parsers│
└─────────────────────────────────────────────────────────────┘
```

**Dependency rule:** outer layers depend inward. Domain has no framework imports. Infrastructure implements domain ports. Presentation/application never import concrete DB/LLM clients directly — only ports/factories wired in composition roots.

## Layers

### 1. Domain (`src/domain`)

Pure business concepts and contracts.

| Area | Responsibility |
|------|----------------|
| `entities/` | `Candidate`, `JobDescription`, `ScreeningResult`, `ScoreBreakdown`, `InterviewQuestion`, `ScreeningJob` |
| `value-objects/` | `Email`, `Score (0–100)`, `FileType`, `Rank` |
| `ports/` | Repository & service interfaces (`ICandidateRepository`, `ILlmScoringService`, `IResumeParser`, `IStorageService`, `IAuthService`) |
| `errors/` | Domain errors (`NotFoundError`, `ValidationError`, `UnauthorizedError`) |

No Next.js, Supabase, or OpenAI imports here.

### 2. Application (`src/application`)

Use cases that orchestrate domain logic.

| Use case | Description |
|----------|-------------|
| `AuthenticateUser` | Session/login flows via auth port |
| `CreateScreeningSession` | Create a screening with pasted JD |
| `UploadResumes` | Accept multi-file upload, store blobs, create candidates |
| `ExtractResumeText` | PDF/DOCX → plain text |
| `ScoreCandidates` | JD + resume text → AI scores + rationale |
| `RankCandidates` | Sort/persist ranking |
| `GetCandidateDetail` | Candidate + scores + questions |
| `GenerateInterviewQuestions` | Role-specific questions from JD + resume gaps |
| `GenerateReport` | Downloadable screening report (PDF/JSON) |
| `ListDashboardData` | Sessions, counts, recent rankings |

DTOs live under `src/application/dto`.

### 3. Infrastructure (`src/infrastructure`)

Adapters that implement ports.

| Adapter | Tech |
|---------|------|
| `auth/supabase-auth.ts` | Supabase Auth |
| `db/supabase-repositories.ts` | PostgreSQL via Supabase client |
| `storage/supabase-storage.ts` | Resume file storage |
| `llm/openai-compatible-client.ts` | OpenAI-compatible chat completions |
| `parsers/pdf-parser.ts` | PDF text extraction |
| `parsers/docx-parser.ts` | DOCX text extraction |
| `reports/report-generator.ts` | Report export |

Composition/wiring: `src/infrastructure/di/` (factories used by API routes / server actions).

### 4. Presentation (`src/presentation` + `app/`)

| Area | Responsibility |
|------|----------------|
| `app/(auth)/` | Login / callback routes |
| `app/(dashboard)/` | Dashboard, upload, screening, candidate detail |
| `app/api/` | Thin HTTP adapters calling use cases |
| `src/presentation/components/` | UI components |
| `src/presentation/hooks/` | Client hooks |
| `src/presentation/lib/` | UI helpers (formatters, cn) |

## Core User Flows

### Screening flow

```text
Login → Dashboard → New Screening
  → Paste Job Description
  → Upload resumes (PDF/DOCX, multi)
  → Extract text
  → AI score each candidate
  → Rank list
  → Candidate detail (score, strengths/gaps, interview Qs)
  → Download report
```

### Sequence (simplified)

```text
Browser → API/Server Action → Use Case → Ports
                              ├→ Storage (files)
                              ├→ Parser (text)
                              ├→ LLM (score / questions)
                              └→ Repository (persist)
```

## Data Model (PostgreSQL / Supabase)

```text
profiles
  id (uuid, fk auth.users)
  full_name, avatar_url, created_at

screening_sessions
  id, user_id, title, job_description, status, created_at, updated_at

candidates
  id, session_id, full_name, email, source_filename
  storage_path, extracted_text, created_at

screening_results
  id, candidate_id, session_id
  overall_score, skills_score, experience_score, education_score
  summary, strengths jsonb, gaps jsonb, raw_llm jsonb
  rank, created_at

interview_questions
  id, candidate_id, session_id
  questions jsonb, created_at
```

RLS: users can only read/write their own rows (`auth.uid() = user_id` / via session ownership).

## API Surface (planned)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/callback` | Auth callback helper |
| GET | `/api/sessions` | List screening sessions |
| POST | `/api/sessions` | Create session + JD |
| POST | `/api/sessions/:id/uploads` | Multi-file upload |
| POST | `/api/sessions/:id/screen` | Extract + score + rank |
| GET | `/api/sessions/:id/candidates` | Ranked candidates |
| GET | `/api/candidates/:id` | Detail |
| POST | `/api/candidates/:id/questions` | Generate interview questions |
| GET | `/api/sessions/:id/report` | Download report |

Exact shapes will be finalized when API routes are implemented.

## AI Scoring Contract

Input: job description + extracted resume text  
Output (JSON from LLM):

```json
{
  "overall_score": 0-100,
  "skills_score": 0-100,
  "experience_score": 0-100,
  "education_score": 0-100,
  "summary": "string",
  "strengths": ["string"],
  "gaps": ["string"]
}
```

Provider: Gemini via Google’s OpenAI-compatible endpoint by default
(`OPENAI_API_BASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`). Heuristic fallback when the key is unset.

## Auth

- Supabase email/password (and optional OAuth later)
- Middleware protects dashboard routes
- Server components/actions use Supabase server client
- Client components use browser client

## File Upload

- Accept `.pdf`, `.docx`
- Max size configurable (`MAX_UPLOAD_BYTES`)
- Multi-file per session
- Store in Supabase Storage bucket `resumes`
- Persist metadata + extracted text in PostgreSQL

## Frontend IA

| Route | Purpose |
|-------|---------|
| `/login` | Auth |
| `/dashboard` | Sessions overview |
| `/screenings/new` | JD + uploads |
| `/screenings/[id]` | Ranked results |
| `/candidates/[id]` | Detail + interview questions |
| `/screenings/[id]/report` | Report download trigger |

Responsive: mobile-first Tailwind layouts; primary workflows usable on small screens.

## Configuration

Environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `OPENAI_API_KEY` (Gemini API key; never commit)
- `OPENAI_API_BASE` (default: `https://generativelanguage.googleapis.com/v1beta/openai`)
- `OPENAI_MODEL` (default: `gemini-flash-latest`)
- `MAX_UPLOAD_BYTES`
- `NEXT_PUBLIC_APP_URL`

## Deployment

| Target | Notes |
|--------|-------|
| **Vercel** | App Router; set env vars; Supabase external |
| **Docker** | Multi-stage `Dockerfile` + `docker-compose.yml` for local/prod-like runs |

## Milestone Plan

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Folder structure + architecture | **Done** |
| 2 | Next.js + Tailwind + tooling bootstrap | **Done** |
| 3 | AI Recruiter Copilot workflow | **Done** |
| 4 | Docker + Vercel config + README polish | Pending |

## Coding Conventions

- TypeScript strict mode
- Named exports preferred for domain/application
- API routes stay thin; business logic in use cases
- No secrets in client bundles
- Prefer server components; client only for interactivity
- Keep UI focused and responsive; avoid dashboard clutter on marketing surfaces (product UI may use cards for interactive lists)
