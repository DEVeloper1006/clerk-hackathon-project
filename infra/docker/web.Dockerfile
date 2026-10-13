# Build from the repo root: docker build -f infra/docker/web.Dockerfile --build-arg VITE_API_URL=https://api.example.com .
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @clerk/web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
# SPA fallback so client-side routes resolve to index.html.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
