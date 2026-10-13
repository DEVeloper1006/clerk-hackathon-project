# Report: monorepo-scaffold
**Date:** 2026-10-13 14:34
**Author:** dev
**Session goal:** Scaffold the full Clerk pnpm monorepo (shared, api, agents, web, infra, docs, CI) so `pnpm dev` runs all three services and both contributors can start building features.

## What changed
- **Root config** (created): `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.dockerignore`, `.env.example`, `LICENSE`, `pnpm-lock.yaml`
  - Scripts: `dev`, `build`, `lint` (eslint + prettier --check), `test`, `typecheck`, `format`, `seed:elastic`, `seed:demo`.
  - `dev` builds `@clerk/shared` once, then runs all packages in parallel (shared in `tsc -w`).
  - *Why:* The ticket's root config list.
  - **Deviation 1:** the ticket said "`.eslintrc.cjs` — flat config". Those two don't go together, so I used ESLint 9 flat config in `eslint.config.mjs`.
  - **Deviation 2:** I left `paths` aliases out of `tsconfig.base.json`. They make tsc pull `shared/src` into each package's `rootDir` (TS6059). `@clerk/shared` resolves through the pnpm workspace link instead: `exports.types` → `src/index.ts`, `default` → `dist/index.js`.
  - `.env.example` adds `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `PAYPAL_API_BASE`, `PAYPAL_REDIRECT_URI`, `LLM_PROVIDER`, `OPENAI_MODEL` and `VITE_API_URL` on top of the CLAUDE.md list.
- **`packages/shared`** (created):
  - Types: `Tenant`, `Agent` (with the `AgentType` enum), `Transaction`, `Rule` (+ `CompiledPolicy`).
  - `events.ts`: an `EventType` enum, an `EventPayloads` map, the discriminated `ClerkEvent` union, and channel helpers `clerk:{tenantId}:{type}`.
  - Utils: `formatCurrency` and zod schemas (`tenantSchema`, `agentSchema`, `ruleSchema`).
  - One test: `currency.test.ts`.
  - *Why:* Single source of truth for types across api, agents and web.
- **`packages/api`** (created): everything from the ticket's list.
  - Fastify 5 with CORS, JWT and `GET /health`; routes mounted at `/api/{auth,tenants,paypal,agents,rules,transactions,templates}`.
  - Socket.IO with tenant rooms `tenant:{tenantId}`, joined after JWT verification on the handshake.
  - Drizzle schema for all 5 tables, each with a `tenant_id` index; `drizzle.config.ts` plus `db:generate` and `db:migrate` scripts.
  - Redis event bus with a separate pub and sub connection; tenant-prefixed ES helpers (`tenantIndex()` is the only way to build an index name).
  - Stubs for Zapier and Channel3.
  - Extra files:
    - `src/lib.ts`: `ok` / `fail` response envelope helpers.
    - `auth.types.ts`: the `JwtUser` type, plus the `@fastify/jwt` type augmentation.
  - Tenant scoping: every service takes `tenantId` first, and routes always pass `request.user.tenantId`. Tenant routes are `/me`-style, so a user can never address another tenant.
  - *Why:* Runnable API skeleton. Stub routes return `{ success: true, data: [] | null }`.
- **`packages/agents`** (created):
  - `BaseAgent` subscribes to events, loads tenant context, calls the LLM, and logs to ES `{tenantId}-agent-events` while publishing `agent.action`. It catches every error so the worker never crashes.
  - The four agents (sentinel, treasury, commerce, growth) each have the stub helpers the ticket asked for.
  - `llm.ts` supports OpenAI, an Anthropic stub selected by `LLM_PROVIDER`, and a no-op fallback when there's no key.
  - Also: `context.ts` (raw `pg`, 30s cache), `policy-engine.ts`, and `astropods.yml` (one pod per agent through the `AGENTS` env var).
  - Extra files:
    - `src/config/env.ts`: the worker is its own process, so it gets its own zod env.
    - `src/core/bus.ts`: the worker-side mirror of the API bus, using the same channel helpers from shared.
  - *Why:* The ticket's agent list. Agents talk only through the bus.
- **`packages/web`** (created):
  - Vite 6, React 18, Tailwind 3, React Router 6 and Zustand 5.
  - Layout, Sidebar, Header, Badge, Card, Spinner and the five pages.
  - Hooks: `useSocket` (pushes `agent.action` into the agents store), `useTransactions` and `useAgents`.
  - `lib/api.ts` is a fetch wrapper that adds the bearer token and logs out on 401.
  - Vite aliases `@clerk/shared` to its source and reads `VITE_*` from the root `.env`.
  - *Why:* The dashboard shell.
- **`infra/`** (created):
  - `render.yaml`: API web service, agents worker, static web, Redis and Postgres.
  - Three multi-stage Dockerfiles (`pnpm deploy --prod`; web served by nginx).
  - `scripts/seed-elastic.ts`: creates the three tenant indices with mappings.
  - `scripts/seed-demo.ts`: a demo tenant, 4 agents and 25 transactions.
- **`docs/`** (created):
  - `openapi.yaml`: OpenAPI 3.1 with every route, the shared schemas and the response envelope.
  - `postman/clerk.postman_collection.json`: 8 folders, `{{baseUrl}}` and `{{token}}` variables, collection-level bearer auth.
- **`.github/workflows/`** (created):
  - `ci.yml`: install, lint, test and build on every PR.
  - `deploy.yml`: the same checks, then POSTs Render deploy hooks from secrets `RENDER_DEPLOY_HOOK_{API,WEB,AGENTS}`.

## Current State
- **Build:** SUCCEEDED (`pnpm build`; `pnpm -r typecheck` reports 0 errors)
- **Lint:** clean (`eslint .` and `prettier --check .`)
- **Tests:** 2 passing, 0 failing (shared/currency); api, agents and web have no tests yet
- **Runnable:** Yes. I smoke-tested `pnpm dev` with inline env vars and no Postgres, Redis or ES running:
  - `/health` → `{"success":true,"data":{"status":"ok"}}`
  - Authed `/api/transactions` → `{ success: true, data: [] }`
  - Unauthed routes → 401 envelope
  - `/api/templates` returns all 3 presets; the PayPal webhook returns `received: true`
  - Vite serves on 5173
  - The agents worker logs `starting agents: sentinel, treasury, commerce, growth`
  - Redis/ES connections are lazy and retry in the background with one warning; nothing crashes.
- Required env to boot: `DATABASE_URL`, `REDIS_URL`, `ELASTICSEARCH_URL`, `JWT_SECRET` (≥16 chars). All sponsor keys are optional for now.
- **Dependencies:**
  - Not installed:
    - Bryntum (private registry, needs a license; `components/gantt/` is a `.gitkeep`)
    - `@channel3/sdk`, KERNEL SDK
    - `@anthropic-ai/sdk`
  - Extra deps beyond the ticket:
    - web: `@types/react*`, `autoprefixer`, `postcss`
    - agents: `pg` (context loader)
    - root: `pg`, `drizzle-orm` and `@elastic/elasticsearch` as devDeps, for the seed scripts
- Pinned majors: Fastify 5, `@fastify/jwt` 9, Zustand 5, Vite 6, React Router 6, Tailwind 3, AG Grid 32.
- `TODO(dev)`: `paypal.routes.ts`: the OAuth `state` is currently the raw tenantId. It should be signed to prevent CSRF and tenant spoofing.

## Next Steps
1. Add `docker-compose.yml` for local Postgres, Redis and ES. Then run `pnpm --filter @clerk/api db:generate`, apply the first migration, and run `pnpm seed:demo` and `pnpm seed:elastic <tenantId>`.
2. Real auth: add a `users` table, password hashing, and register → create tenant → issue JWT. Then implement the tenants, agents and rules services with Drizzle (scoped by `tenant_id`).
3. PayPal sandbox: client-credentials token, OAuth connect, webhook signature verification, then webhook → `transactions` insert → `transaction.created` on the bus so Sentinel scores it end to end.
4. Install the sponsor SDKs (Channel3, KERNEL, Bryntum once there's a license) and build the AG Grid transactions grid.

## Suggested Commit Message
```
chore: scaffold pnpm monorepo with api, agents, web, shared, infra, and docs
```
