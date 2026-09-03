# LikeHome

LikeHome is a friendly, full-stack academic hotel-booking application. It demonstrates search, availability, server-side pricing, authentication-ready account flows, reservations, cancellation rules, rewards, and safe simulated payment without processing real money.

## Features

- Browse 12 sample hotels across multiple destinations
- Search by hotel name or location, filter by price/rating/room type/capacity, and sort results
- Select dates and guests while keeping travel context through the flow
- Create, view, change, and cancel reservations
- Server-side overlap and inventory checks
- Demo Payment Mode with a visible safety banner
- Rewards balance and transaction history
- Responsive, accessible UI with loading, empty, error, and success states

## Stack

React, TypeScript, Vite, Tailwind CSS, Express, OpenAPI-generated React Query hooks, Supabase Auth/PostgreSQL migration files, and Stripe Test Mode integration points.

## Run locally in Replit

```bash
pnpm install
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/likehome run typecheck
```

Use the Replit Preview to run the configured API and LikeHome web workflows.

## Supabase setup

1. Create a Supabase project.
2. Add the variables in `.env.example` to Replit Secrets.
3. Run `supabase/migrations/001_likehome.sql`, then load `supabase/seed.sql` with the sample rows from `artifacts/api-server/src/routes/likehome-data.ts`.
4. Replace the demo store service with Supabase queries while keeping the same API contract and server-side booking checks.

## Stripe Test Mode

Add Stripe test-mode keys from `.env.example` only through Replit Secrets. The current Preview safely uses Demo Payment Mode when Stripe is not configured. Never store card numbers, CVCs, or complete payment details.

## Demo

Follow `docs/demo-script.md`. Manual acceptance scenarios are in `tests/manual-qa.md`.

## Team workflow

Create branch → implement feature → manually test → open pull request → code review → merge. Use names such as `feature/login`, `feature/hotel-search`, `feature/create-booking`, `feature/rewards`, and `fix/booking-conflict`. Do not push directly to `main`.

## Repository map

`artifacts/likehome` is the web client, `artifacts/api-server` contains the API, `lib/api-spec` is the OpenAPI source of truth, `lib/api-client-react` and `lib/api-zod` are generated helpers, `supabase` holds database setup, and `docs`/`tests` hold project documentation.

## Known limitations

Preview currently uses a process-local demo store and demo session so the customer journey works without external accounts. Restarting the API resets demo users and reservations. Supabase Auth, Supabase persistence, Stripe Test Mode, webhook idempotency, and production-grade transaction locking are prepared in the contract/migration/docs but need credentials and the service-layer replacement before production use.