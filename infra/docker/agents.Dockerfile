# Build from the repo root: docker build -f infra/docker/agents.Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @clerk/shared build && pnpm --filter @clerk/agents build
RUN pnpm --filter @clerk/agents deploy --prod /out

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
CMD ["node", "dist/index.js"]
