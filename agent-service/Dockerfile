# Stage 1: build the dashboard
FROM node:22-slim AS dashboard
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY dashboard ./dashboard
RUN pnpm install --frozen-lockfile --filter dashboard... && pnpm --filter dashboard build

# Stage 2: agent-service, serving the API and the built dashboard
FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared ./shared
COPY agent-service ./agent-service
COPY --from=dashboard /app/dashboard/dist ./dashboard/dist
RUN pnpm install --frozen-lockfile --prod --filter agent-service...
EXPOSE 8787
CMD ["pnpm", "--filter", "agent-service", "start"]
