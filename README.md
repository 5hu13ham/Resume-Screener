# AI Resume Screener

Demo-ready MVP for AI-assisted resume screening.

## Milestone status

- [x] Milestone 1 — Architecture + folder structure
- [x] Milestone 2 — Next.js bootstrap, auth, protected dashboard
- [ ] Later — Upload, extraction, AI scoring, ranking, reports

## Stack

- Next.js (App Router) + TypeScript + TailwindCSS
- ESLint + Prettier
- Supabase Auth client (optional) + demo auth for local MVP
- Clean Architecture layout under `src/`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

With `NEXT_PUBLIC_DEMO_MODE=true` (default in `.env.example`):

- Email: `demo@resumescreener.local`
- Password: `demo1234`

### Supabase auth

Set these in `.env.local` to enable real email/password auth:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier write |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).
