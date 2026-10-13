# Clerk — AGENTS.md

Guidelines for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repo.

## Before You Start
1. Read `CLAUDE.md` for tech stack, structure, and conventions.
2. Check `.reports/` for the latest session report — it tells you current state and what's next.
3. Run `pnpm install` if `node_modules/` is missing.
4. Run `pnpm lint` and `pnpm test` before and after changes.

## How We Work
- **`main` is protected.** Never push directly to `main` — it will be rejected.
- **Branch for every task:** Create `dev/<author>/<ticket-or-slug>` off `main`, push the branch, open a PR. One approval required to merge.
- **Squash merge** into `main` after approval.
- AI agents write `.reports/` after every session (see format below).
- Use conventional commits on your feature branch.
- If you're unsure about a design decision, leave a `// TODO(agent): <question>` comment and note it in the report.

## Coding Rules
1. **TypeScript strict mode.** No `any` unless absolutely necessary — use `unknown` and narrow.
2. **Multi-tenant isolation.** Every DB query, Elasticsearch query, and Redis key MUST scope by `tenant_id`. This is non-negotiable. If you're writing a query and it doesn't filter by tenant, stop and fix it.
3. **Error handling.** Fastify routes return `{ success: false, error: "message" }` on failure, never throw unhandled. Agents catch and log to Elasticsearch, never crash the worker.
4. **No hardcoded secrets.** Everything goes through `packages/api/src/config/env.ts`.
5. **Imports from `shared`.** Types and utils shared across packages come from `@clerk/shared` (workspace alias). Don't duplicate types.
6. **Agent architecture.** All agents extend `BaseAgent`. Each agent has its own directory under `packages/agents/src/`. Agent-specific logic stays in that directory. Shared agent infra goes in `packages/agents/src/core/`.
7. **Event bus.** Agents communicate through Redis pub/sub, not direct function calls. Events are typed in `packages/shared/src/types/events.ts`.
8. **Socket.IO.** Dashboard updates go through the WebSocket server in `packages/api/src/ws/socket.ts`. Agents publish events → API server relays to connected clients. New event types that the dashboard needs must be added to `RELAYED_EVENTS`.
9. **Tenant path params.** Routes with `:tenantId` in the path must check that it equals `request.user.tenantId` and return 403 if it doesn't. Never trust a tenant id from the URL or body on its own.
10. **Secrets.** Tenant secrets are encrypted at rest (`packages/api/src/utils/crypto.ts`). Never return, log, or publish a decrypted secret value.
11. **Render.** Call the Render API only through `packages/api/src/integrations/render.ts`, and name resources with `renderResourceName()`. Resource status changes must follow the shared transition table (`canTransition` / `assertTransition` in `@clerk/shared`).

## Commit Messages
Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
Scopes: `api`, `agents`, `web`, `shared`, `infra`, `sentinel`, `treasury`, `commerce`, `growth`, `infra-agent`

(`infra` = the `infra/` folder: Blueprint, Dockerfiles, seed scripts. `infra-agent` = the Infra agent and the tenant resource provisioning layer.)

Examples:
```
feat(sentinel): add transaction risk scoring with anomaly detection
fix(api): scope webhook handler by tenant_id
refactor(web): extract AG Grid column definitions to shared config
docs: update README with setup instructions
```

## Session Reports
After every coding session, create a report in `.reports/`:

**Filename:** `YYYY-MM-DD_HH-MM_<slug>.md`
**Template:** see `.reports/TEMPLATE.md`

The report must include:
- Session goal (what you set out to do)
- What changed (files modified/created, with reasons)
- Current state (does it build? does it run? what works?)
- Next steps (what should the next session pick up)
- Suggested commit message

Commit the report alongside your code changes.

## Don't
- Don't install new major dependencies without noting it in the report and explaining why.
- Don't refactor file structure without updating `CLAUDE.md`.
- Don't write agent logic that calls other agents directly — use the event bus.
- Don't skip the report. It's how the other contributor knows what happened.
- Don't touch `.env` or any credentials file.
- Don't write tests that depend on live external services — mock PayPal, Channel3, KERNEL, etc.
