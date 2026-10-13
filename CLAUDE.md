# Clerk — CLAUDE.md

## What This Is
Clerk is an AI-native business infrastructure platform for the PayPal AI Hackathon (deadline Nov 12, 2026). Small businesses connect their PayPal account and get a team of specialized AI agents — fraud detection, cash flow forecasting, dispute resolution, growth intelligence, infrastructure management — configured in plain English, running 24/7. Tenants can also provision their own private cloud resources (services, workers, cron jobs, Postgres, key-value, static sites) on Render through Clerk, managed by the Infra agent.

## Tech Stack
- **Backend:** Node.js 20+ / TypeScript, Fastify, Drizzle ORM, PostgreSQL 16, Redis (pub/sub event bus), Elasticsearch 8
- **Frontend:** React 18 + Vite, Tailwind CSS, AG Grid (data grids), Bryntum (Gantt/scheduler), Zustand, Socket.IO client, Recharts
- **Agents:** Custom TypeScript agent framework, Astropods (deploy/monitor), KERNEL SDK (browser-as-a-service), Channel3 SDK (product catalog), LangChain.js or direct OpenAI/Anthropic API
- **Infra:** Render (hosting via Blueprint; Render REST API for tenant resource provisioning), GitHub Actions CI, pnpm workspaces monorepo
- **Auth:** JWT + tenant-scoped API keys
- **License:** MIT

## Monorepo Structure
```
packages/
  api/          → Fastify backend (routes, services, db, events, integrations, websocket)
  agents/       → AI agent workers (sentinel, treasury, commerce, growth, infra + base agent + orchestrator)
  web/          → React dashboard (AG Grid, Bryntum, Agent Studio, onboarding)
  shared/       → Shared types, schemas, utils (imported by api, agents, web)
infra/          → render.yaml, Dockerfiles, seed scripts
docs/           → openapi.yaml, Postman collection
```

## Commands
```bash
pnpm install                  # install all deps
pnpm dev                      # run all packages in dev mode
pnpm --filter api dev         # run just the API
pnpm --filter web dev         # run just the frontend
pnpm --filter agents dev      # run agent workers
pnpm lint                     # ESLint + Prettier check
pnpm test                     # Vitest unit tests
pnpm build                    # build all packages
```

## Database
- PostgreSQL via Drizzle ORM. Schema in `packages/api/src/db/schema.ts`.
- Tables: `tenants`, `agents`, `rules`, `transactions`, `agent_actions`, `resources`, `deployments`, `secrets`, `infra_events`.
- Postgres enums mirror the shared TypeScript enums (`agent_type`, `resource_type`, `resource_status`, `deploy_status`) — change both together.
- Migrations in `packages/api/src/db/migrations/`.
- Multi-tenant: every query scopes by `tenant_id`. Never query without it.

## Elasticsearch
- Per-tenant prefixed indices: `{tenantId}-transactions`, `{tenantId}-agent-events`, `{tenantId}-audit-log`.
- Client config in `packages/api/src/config/elastic.ts`.
- Index helpers in `packages/api/src/integrations/elastic.ts`.

## Agents
Five specialized agents, all extend `BaseAgent`:
- **Sentinel** — fraud detection, transaction risk scoring, anomaly detection
- **Treasury** — cash flow forecasting, payment scheduling
- **Commerce** — refund handling, dispute resolution
- **Growth** — revenue patterns, product intelligence (Channel3), supplier discovery
- **Infra** — provisions and tears down tenant resources on Render, runs deploys, monitors health, tracks hosting cost against the cash forecast

Agents communicate via Redis pub/sub event bus (`packages/api/src/events/bus.ts`). Each agent runs as an independent worker process.

## Infrastructure (Render API)
- **Client:** `packages/api/src/integrations/render.ts` — typed `fetch` client for `https://api.render.com/v1` (services, deploys, env vars, Postgres, key-value). Errors surface as `RenderApiError`. The app-wide `renderClient` is `null` when `RENDER_API_KEY` is unset.
- **Naming:** every Render resource is named `clerk-tenant-{tenantId}-{name}` via `renderResourceName()`.
- **Routes:** `/api/tenants/:tenantId/resources` (CRUD, `/:resourceId/deployments`, `/:resourceId/deploy`, `/:resourceId/secrets`) in `packages/api/src/modules/resources/`. The `:tenantId` path param must equal the caller's JWT tenant, otherwise 403.
- **Lifecycle:** `requested → provisioning → active ⇄ updating`, `active | failed → destroying → destroyed`, with a `failed` branch. The transition table is in `packages/shared/src/utils/resource-state.ts`. Both the API and the Infra agent use it.
- **Flow:** the API writes the row and an `infra_events` audit entry, then publishes `resource.requested`, `resource.destroyed` (a teardown request), or `deployment.triggered`. The Infra agent (`packages/agents/src/infra/`) does the Render work, advances the status with guarded, idempotent updates, and publishes `resource.provisioned | resource.failed | deployment.completed | deployment.failed`. On `forecast.updated` it compares hosting cost with the projected balance and may publish `resource.cost.alert`.
- **Secrets:** stored AES-256-GCM encrypted (`SECRETS_ENCRYPTION_KEY`) in `secrets`. The API never returns decrypted values, and `GET …/secrets` lists keys only.
- **Pricing:** Render plan prices are in `packages/shared/src/utils/render-pricing.ts`. They're used for `monthlyCostCents` and the Infra agent's cost tracker. Re-verify them against render.com/pricing.

## PayPal Integration
- Sandbox only (no live credentials).
- OAuth flow for tenant onboarding (`packages/api/src/modules/paypal/`).
- APIs used: Orders, Payouts, Subscriptions, Webhooks.
- Webhook receiver at `/api/paypal/webhooks`.

## Sponsor Integrations
| Sponsor | Package | What it does |
|---|---|---|
| AG Grid | `ag-grid-react` | Transaction + agent activity grids in dashboard |
| Bryntum | `@bryntum/gantt-react-thin` | Cash flow timeline, payment scheduler |
| Channel3 | `@channel3/sdk` | Growth agent product catalog queries |
| KERNEL | KERNEL SDK | Browser-as-a-service for agent web actions |
| Elastic | `@elastic/elasticsearch` | Transaction search, agent event indexing |
| Astropods | `astropods.yml` | Agent deployment + monitoring |
| APIMatic | external | Auto-generate SDK from `docs/openapi.yaml` |
| Postman | external | API collection at `docs/postman/` |
| Render | `infra/render.yaml`, Render REST API | Blueprint deployment of Clerk itself + tenant resource provisioning (Infra agent) |
| Zapier | webhook triggers | Slack alerts, email receipts, CRM syncs |

## Branching & PRs
- **`main` is protected.** No direct pushes. All changes go through pull requests.
- **Ruleset:** Require PR before merging, 1 approval required, block force pushes.
- **Branch naming:** `dev/<author>/<ticket-or-slug>` (e.g. `dev/dev/dashboard-grid`, `dev/friend/paypal-oauth`).
- **Merge strategy:** Squash merge into `main`.
- **One feature per PR.** PR description references the relevant agent or module.

## Conventions
- TypeScript strict mode everywhere.
- Fastify route files: `*.routes.ts`. Service files: `*.service.ts`. Type files: `*.types.ts`.
- All API responses follow `{ success: boolean, data?: T, error?: string }`.
- Environment variables in `.env` (gitignored). Schema in `packages/api/src/config/env.ts`.
- Every agent action logged to Elasticsearch and emitted via Socket.IO.
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).

## Environment Variables
```
DATABASE_URL=            # Postgres connection string
REDIS_URL=               # Redis connection string
ELASTICSEARCH_URL=       # Elasticsearch endpoint
PAYPAL_CLIENT_ID=        # PayPal sandbox app client ID
PAYPAL_CLIENT_SECRET=    # PayPal sandbox app secret
OPENAI_API_KEY=          # LLM provider key
JWT_SECRET=              # Auth token signing
CHANNEL3_API_KEY=        # Channel3 product catalog
KERNEL_API_KEY=          # KERNEL browser-as-a-service
ZAPIER_WEBHOOK_URL=      # Zapier trigger endpoint
RENDER_API_KEY=          # Render API key (tenant resource provisioning)
RENDER_OWNER_ID=         # Render workspace id that tenant resources are created under
SECRETS_ENCRYPTION_KEY=  # 32 bytes, base64 — encrypts tenant secrets at rest
```

## .reports/
After every coding session, write a report in `.reports/` following the template in `.reports/TEMPLATE.md`. Reports track what changed, current state, and next steps. Name format: `YYYY-MM-DD_HH-MM_<slug>.md`. These get committed and pushed so both contributors can see session history.
