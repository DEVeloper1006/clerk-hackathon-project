# Clerk — CLAUDE.md

## What This Is
Clerk is an AI-native business infrastructure platform for the PayPal AI Hackathon (deadline Nov 12, 2026). Small businesses connect their PayPal account and get a team of specialized AI agents — fraud detection, cash flow forecasting, dispute resolution, growth intelligence — configured in plain English, running 24/7.

## Tech Stack
- **Backend:** Node.js 20+ / TypeScript, Fastify, Drizzle ORM, PostgreSQL 16, Redis (pub/sub event bus), Elasticsearch 8
- **Frontend:** React 18 + Vite, Tailwind CSS, AG Grid (data grids), Bryntum (Gantt/scheduler), Zustand, Socket.IO client, Recharts
- **Agents:** Custom TypeScript agent framework, Astropods (deploy/monitor), KERNEL SDK (browser-as-a-service), Channel3 SDK (product catalog), LangChain.js or direct OpenAI/Anthropic API
- **Infra:** Render (hosting via Blueprint), GitHub Actions CI, pnpm workspaces monorepo
- **Auth:** JWT + tenant-scoped API keys
- **License:** MIT

## Monorepo Structure
```
packages/
  api/          → Fastify backend (routes, services, db, events, integrations, websocket)
  agents/       → AI agent workers (sentinel, treasury, commerce, growth + base agent + orchestrator)
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
- Tables: `tenants`, `agents`, `rules`, `transactions`, `agent_actions`.
- Migrations in `packages/api/src/db/migrations/`.
- Multi-tenant: every query scopes by `tenant_id`. Never query without it.

## Elasticsearch
- Per-tenant prefixed indices: `{tenantId}-transactions`, `{tenantId}-agent-events`, `{tenantId}-audit-log`.
- Client config in `packages/api/src/config/elastic.ts`.
- Index helpers in `packages/api/src/integrations/elastic.ts`.

## Agents
Four specialized agents, all extend `BaseAgent`:
- **Sentinel** — fraud detection, transaction risk scoring, anomaly detection
- **Treasury** — cash flow forecasting, payment scheduling
- **Commerce** — refund handling, dispute resolution
- **Growth** — revenue patterns, product intelligence (Channel3), supplier discovery

Agents communicate via Redis pub/sub event bus (`packages/api/src/events/bus.ts`). Each agent runs as an independent worker process.

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
| Render | `infra/render.yaml` | Blueprint deployment |
| Zapier | webhook triggers | Slack alerts, email receipts, CRM syncs |

## Conventions
- TypeScript strict mode everywhere.
- Fastify route files: `*.routes.ts`. Service files: `*.service.ts`. Type files: `*.types.ts`.
- All API responses follow `{ success: boolean, data?: T, error?: string }`.
- Environment variables in `.env` (gitignored). Schema in `packages/api/src/config/env.ts`.
- Every agent action logged to Elasticsearch and emitted via Socket.IO.
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- PRs: one feature per PR, description references the relevant agent or module.

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
```

## .reports/
After every coding session, write a report in `.reports/` following the template in `.reports/TEMPLATE.md`. Reports track what changed, current state, and next steps. Name format: `YYYY-MM-DD_HH-MM_<slug>.md`. These get committed and pushed so both contributors can see session history.
