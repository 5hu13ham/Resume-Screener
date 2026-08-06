# Source layout

```text
src/
├── domain/           # Entities, value objects, ports, domain errors
├── application/      # Use cases + DTOs
├── infrastructure/   # Supabase, LLM, parsers, reports, DI wiring
└── presentation/     # Shared UI components, hooks, helpers
```

Route entrypoints live under `/app` (Next.js App Router).  
SQL migrations live under `/supabase/migrations`.
