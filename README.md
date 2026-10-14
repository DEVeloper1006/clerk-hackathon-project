# Clerk

**AI-native back office for small businesses.** Connect your PayPal account and get a team of AI agents that read your transactions, chase your invoices, pay your suppliers, and host your storefront. You configure them in plain English, and they run 24/7.

Built for the **PayPal AI Hackathon** (submission deadline: November 12, 2026).

> **Status:** early development. The repo is currently an empty monorepo scaffold. See [`.reports/`](.reports/) for the latest progress.

---

## Who it's for

Startups and small e-commerce shops whose owners would rather spend their time selling than managing platforms, chasing invoices, or reading PayPal dashboards.

## What it does

Clerk gives each business (tenant) four agents, each built on a specific API:

| Agent            | Powered by                   | What it does                                                                                                                       |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Transactions** | PayPal Transaction Search v1 | Pulls transaction history and summarizes revenue, fees, and top products. Answers questions like _"How did my shop do this week?"_ |
| **Invoicing**    | PayPal Invoicing v2          | Creates, sends, and tracks invoices, chases overdue ones, and handles recurring billing.                                           |
| **Payouts**      | PayPal Payouts v1            | Sends batch payments to contractors and suppliers, with scheduling and confirmation.                                               |
| **Infra**        | Render REST API              | Provisions a private web app and Postgres database for the tenant, then deploys updates and monitors health.                       |

Tenants can use their own OpenAI or Anthropic API key, which is stored encrypted. If they don't, agents use the platform default.

## Architecture

```
Tenant owner → Dashboard (React) → Clerk API (Fastify) → Redis event bus
                                         ↓                      ↓
                                    PostgreSQL            Agents (Astropods)
                                         ↓                      ↓
                                  Render API ←──────── Infra agent
                                         ↓                      ↓
                                  Tenant web app      PayPal APIs
                                  Tenant database     Elasticsearch
```

- **Clerk platform** (deployed with a Render Blueprint): Fastify API, React dashboard, PostgreSQL, Redis, and Elasticsearch.
- **Agent runtime** (Astropods): all agents run centrally, scoped by `tenant_id`, and reach the API over HTTP. They talk to each other through Redis pub/sub events.
- **Per-tenant infrastructure** (provisioned dynamically through the Render API): one web service and one PostgreSQL database per tenant, each named `clerk-tenant-{tenantId}-{name}`.

Every database query, search index, and Redis key is scoped by tenant. Secrets (PayPal tokens, LLM keys) are encrypted at rest with AES-256-GCM, and the API never returns them decrypted.

## Tech stack

| Layer    | Tools                                                               |
| -------- | ------------------------------------------------------------------- |
| Backend  | Node.js 20+, TypeScript, Fastify, Drizzle ORM, PostgreSQL 16, Redis |
| Frontend | React 18, Vite, Tailwind CSS, AG Grid, Zustand, Socket.IO, Recharts |
| Search   | Elasticsearch 8 (tenant transaction search)                         |
| Agents   | Custom TypeScript agent framework on Astropods, OpenAI / Anthropic  |
| Infra    | Render (Blueprint and REST API), GitHub Actions, pnpm workspaces    |
| Auth     | JWT and tenant-scoped API keys                                      |

## Repository layout

```
packages/
  api/        Fastify backend: routes, services, db, events, integrations
  agents/     AI agents: transactions, invoicing, payouts, infra, plus the base agent
  web/        React dashboard: AG Grid, agent builder, onboarding
  shared/     Types, schemas, and utils shared by api, agents, and web
infra/        render.yaml, Dockerfiles, seed scripts
docs/         openapi.yaml, Postman collection
.reports/     Session reports
```

## Getting started

> These commands will work once the workspace packages are in place.

**Prerequisites:** Node.js 20+, pnpm, PostgreSQL 16, Redis, Elasticsearch 8, a PayPal sandbox app, and a Render API key.

```bash
git clone https://github.com/DEVeloper1006/clerk-hackathon-project.git
cd clerk-hackathon-project
pnpm install
cp .env.example .env    # then fill in the values below
pnpm dev
```

| Command                    | What it does                 |
| -------------------------- | ---------------------------- |
| `pnpm dev`                 | Run all packages in dev mode |
| `pnpm --filter api dev`    | Run only the API             |
| `pnpm --filter web dev`    | Run only the dashboard       |
| `pnpm --filter agents dev` | Run agent workers locally    |
| `pnpm lint`                | ESLint and Prettier check    |
| `pnpm test`                | Vitest unit tests            |
| `pnpm build`               | Build all packages           |

### Environment variables

| Variable                                    | Purpose                                                  |
| ------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`                              | Postgres connection string                               |
| `REDIS_URL`                                 | Redis connection string                                  |
| `ELASTICSEARCH_URL`                         | Elasticsearch endpoint                                   |
| `JWT_SECRET`                                | Auth token signing                                       |
| `SECRETS_ENCRYPTION_KEY`                    | 32 bytes, base64. Encrypts tenant secrets at rest        |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal sandbox app credentials                           |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`      | Platform default LLM keys                                |
| `RENDER_API_KEY` / `RENDER_OWNER_ID`        | Render API access and the workspace for tenant resources |
| `ASTROPODS_API_KEY`                         | Astropods platform key (if needed beyond CLI auth)       |

PayPal integration is **sandbox only**.

## Sponsor integrations

- **Render**: Blueprint deployment of Clerk and per-tenant provisioning through the API
- **Astropods**: agent runtime, observability, and AI Gateway
- **PayPal**: Transaction Search, Invoicing, Payouts, and Webhooks
- **AG Grid**: transaction data grids in the dashboard
- **Elastic**: tenant transaction search
- **Postman**: API collection in `docs/postman/`
- **APIMatic**: SDK generated from `docs/openapi.yaml`
- **Zapier** (stretch goal): webhook triggers for Slack alerts and email receipts

## Contributing

- `main` is protected. Every change goes through a pull request with one approval and is squash-merged.
- Branch names follow `dev/<author>/<slug>`, for example `dev/dev/dashboard-grid`.
- Commits use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Keep each PR to one feature.
- AI coding agents should read [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) first.

## License

[MIT](LICENSE)
