FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared ./shared
COPY agent-service ./agent-service
RUN pnpm install --frozen-lockfile --prod --filter agent-service...
EXPOSE 8787
CMD ["pnpm", "--filter", "agent-service", "start"]
