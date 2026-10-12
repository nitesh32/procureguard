FROM node:22-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY shared ./shared
COPY mcp-server ./mcp-server
COPY seed ./seed
RUN pnpm install --frozen-lockfile --prod --filter mcp-server...
EXPOSE 8788
CMD ["pnpm", "--filter", "mcp-server", "start"]
