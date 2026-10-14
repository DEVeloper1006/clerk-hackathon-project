# Session Report: monorepo-scaffold
**Date:** 2026-10-14 10:25
**Author:** Dev Mody (Claude Code)
**Branch:** dev/dev/scaffold-monorepo

## Goal
Rebuild the pnpm monorepo skeleton from the empty post-reset scaffold, following CLAUDE.md. Each package should have a minimal entry point that compiles, and the root should have working lint, test and build tooling.

## What Changed
- `package.json`, `pnpm-workspace.yaml`: root workspace `clerk`. Plain `pnpm -r` scripts for `dev`, `build`, `lint` (ESLint + Prettier check), `format` and `test` (Vitest). No turbo.
- `tsconfig.json`: the shared base config (strict, ES2022, NodeNext). `paths` maps `@clerk/shared` to `packages/shared/src`. There's no `baseUrl` because TS 6 deprecates it.
- `eslint.config.mjs`: ESLint flat config with typescript-eslint, plus react-hooks and react-refresh scoped to `packages/web`, then eslint-config-prettier. Unused vars and args prefixed with `_` are allowed.
- `.prettierrc`, `.prettierignore`, `vitest.config.ts`: Vitest uses `passWithNoTests` and aliases `@clerk/shared` to its source.
- `.gitignore`: added `build`, `.render/`, `.ast/`, `.agent-cache/`.
- `packages/shared`: placeholder types `Tenant`, `Agent`, `AgentConfig`, `Resource`, `Secret` and `AgentType`; a `ClerkEvent` type and an empty `EventMap` in `types/events.ts`; empty `utils/` and `schemas/` barrels. Builds to `dist/` with `.d.ts` files.
- `packages/api`:
  - Fastify entry in `src/index.ts` with `GET /health`, listening on `PORT` (default 3001).
  - Typed env stub in `config/env.ts`.
  - Placeholders: `db/schema.ts`, `events/bus.ts` (`EventBus`), `ws/socket.ts` and `utils/crypto.ts` (stubs that throw).
  - `.gitkeep` files for `routes/`, `services/`, `integrations/` and `db/migrations/`.
- `packages/agents`: abstract `BaseAgent` (`name`, `execute`) in `src/core/base-agent.ts`, plus `.gitkeep` dirs for `transactions/`, `invoicing/`, `payouts/` and `infra/`.
- `packages/web`: hand-written Vite + React 18 + Tailwind v3 app (`vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `main.tsx`, an `App.tsx` with a "Clerk Dashboard" heading, `index.css`). Vite aliases `@clerk/shared` to its source, so `dev` doesn't need a shared build first.
- `.reports/TEMPLATE.md`: replaced with the new template.
- `README.md`, `LICENSE`: added in an earlier session; now formatted with Prettier and committed here.
- `CLAUDE.md`, `AGENTS.md`: removed from git tracking (`git rm --cached`) and gitignored. They are still on disk locally.

## Current State
- Does it build? Yes. `pnpm build` compiles shared, api and agents to `dist/`, and web produces a Vite bundle.
- Does it run? Yes. `node packages/api/dist/index.js` serves `GET /health` → `{"success":true,"data":{"status":"ok"}}`.
- What works end-to-end? `pnpm install`, `pnpm lint`, `pnpm build` and `pnpm test` all exit 0. There are no tests yet.
- What's broken or incomplete?
  - Everything beyond the health route is a placeholder: no DB schema, auth, event bus, PayPal or Render.
  - `api` and `agents` import the *built* `@clerk/shared` (from `dist`), so run `pnpm --filter @clerk/shared build`, or `pnpm dev`, which watches it, before type-checking them.

## Blockers
- TypeScript is pinned to `~6.0` because typescript-eslint 8.x doesn't support TS 7 yet (its peer range is `<6.1.0`). Bump it once typescript-eslint adds TS 7 support.
- Removing CLAUDE.md and AGENTS.md from git means the other contributor's copies get **deleted when they pull** this change. They should back them up first, or we keep the docs somewhere else that's shared.

## Next Steps
- Add the Drizzle schema in `packages/api/src/db/schema.ts` (`tenants`, `users`, `agents`, `agent_configs`, `agent_actions`, `resources`, `secrets`), with drizzle-kit and the first migration.
- Validate the environment in `packages/api/src/config/env.ts` (e.g. with zod), and add `.env.example`.
- Implement `EventBus` on ioredis in `packages/api/src/events/bus.ts`, with typed events in `packages/shared/src/types/events.ts`.
- Implement AES-256-GCM in `packages/api/src/utils/crypto.ts`, with Vitest tests.
- Add `infra/render.yaml` (Blueprint) and a GitHub Actions CI workflow that runs lint, build and test.

## Suggested Commit Message
chore: scaffold monorepo with package skeletons
