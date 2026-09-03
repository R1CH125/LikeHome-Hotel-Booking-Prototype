# LikeHome

LikeHome is a mock hotel-booking web application for discovering stays, managing reservations, and earning rewards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/likehome` — React/Vite customer-facing web app and visual theme
- `artifacts/api-server/src/routes/likehome.ts` — demo hotel, auth, booking, cancellation, completion, and rewards API
- `artifacts/api-server/src/routes/likehome-data.ts` — sample hotels, rooms, and process-local demo state
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `supabase/migrations/001_likehome.sql` — production-oriented PostgreSQL schema and RLS policies
- `docs/` and `tests/manual-qa.md` — requirements, architecture, API reference, demo script, and QA scenarios

## Architecture decisions

- Preview uses a process-local demo store so the full customer flow works without external credentials.
- Payment is explicitly Demo Payment Mode until Stripe Test Mode is connected; card details are never sent to the demo API.
- React Query hooks and Zod validators are generated from the OpenAPI contract.
- Supabase migrations and environment documentation define the intended persistent production integration.

## Product

- Browse, search, filter, sort, and inspect a curated hotel collection.
- Select dates, guests, and available rooms, then create a reservation through a simulated payment flow.
- Sign up, sign in, sign out, view personal trips, change or cancel bookings, and see cancellation charges.
- Mark a demo stay completed to earn points and redeem a free night when the balance is sufficient.

## User preferences

No project-specific preferences recorded.

## Gotchas

- Demo users, sessions, bookings, and rewards reset when the API workflow restarts.
- Run API code generation after changing `lib/api-spec/openapi.yaml`; it rewrites the generated folders and may require restoring the intentional Zod barrel export fix.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
