# AI Resume Screener

AI Recruiter Copilot that helps recruiters decide **who to interview**.

## Features

- Login (demo auth + optional Supabase)
- Protected dashboard
- Job description intake + multi PDF/DOCX upload
- Resume parsing (PDF/DOCX)
- AI extraction (name, contact, experience, skills, projects, education, certifications)
- AI evaluation with structured scores, gaps, interview questions, hiring recommendation
- Candidate ranking + detail pages
- Downloadable PDF reports
- Loading states, error handling, AI retry
- Gemini (OpenAI-compatible) by default, with heuristic fallback

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

- Email: `demo@resumescreener.local`
- Password: `demo1234`

### Instant Demo (under 60 seconds)

1. Sign in
2. On the dashboard, click **Try Demo**
3. The app creates a `Demo Screening` session (Java Backend Engineer JD + 9 sample resumes)
4. It runs the **same** production screening pipeline and redirects to ranked candidates
5. Use **Reset Demo** to delete only demo sessions/files (never real user screenings)

Regenerate bundled demo PDFs if needed:

```bash
npm run fixtures:demo
```

### Workflow

1. Go to **Upload / JD**
2. Paste a job description
3. Upload one or more PDF/DOCX resumes
4. Run AI screening
5. Review ranked candidates
6. Open a candidate detail page
7. Download PDF report

### Verify end-to-end

```bash
npm run fixtures:resumes
npm run dev
# in another terminal
npm run verify:workflow
```

## Gemini / LLM configuration

The app uses the OpenAI SDK against Google’s OpenAI-compatible Gemini endpoint.

### 1. Create local secrets file

```bash
cp .env.example .env.local
```

Edit `.env.local` only on your machine. Do **not** commit it.

### 2. Required variables for live Gemini

| Variable | Required for live LLM | Purpose |
|----------|----------------------|---------|
| `OPENAI_API_KEY` | Yes | Gemini API key |
| `OPENAI_API_BASE` | No (has default) | OpenAI-compatible base URL |
| `OPENAI_MODEL` | No (has default) | Model id |

Defaults (when unset):

```env
OPENAI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL=gemini-flash-latest
```

Example `.env.local` (replace with your own key; never commit):

```env
OPENAI_API_KEY=your-gemini-api-key
OPENAI_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL=gemini-flash-latest
```

Without `OPENAI_API_KEY`, the app keeps working via the deterministic heuristic recruiter.

### 3. Obtain a Gemini API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Paste it into `.env.local` as `OPENAI_API_KEY`
4. Restart `npm run dev`

### 4. Confirm secrets are gitignored

`.gitignore` includes:

```gitignore
.env
.env.local
.env.*.local
.env*.local
```

Verify locally:

```bash
git check-ignore -v .env.local
```

### 5. Switch models

Change `OPENAI_MODEL` in `.env.local`, for example:

```env
OPENAI_MODEL=gemini-flash-latest
# or another Gemini model id supported by the OpenAI-compatible endpoint
```

Restart the dev server after changes.

### 6. Verify Gemini is active

1. Restart the app and check server logs for:

```text
---------------------------------------
LLM Status

Provider: Gemini (OpenAI Compatible)
Model: gemini-flash-latest
Base URL: https://generativelanguage.googleapis.com/v1beta/openai

Status:
Live LLM
---------------------------------------
```

2. Open **Settings** in the app:
   - Live: `🟢 Live Gemini`
   - Fallback: `🟡 Heuristic Fallback` with reason `OPENAI_API_KEY not configured`

The Settings page never displays API keys.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run verify:workflow` | API/UI workflow smoke test |

## Architecture

Clean Architecture under `src/` — see [ARCHITECTURE.md](./ARCHITECTURE.md).

Local screening data is stored under `data/` (gitignored).
