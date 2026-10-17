# Deploy on Railway

Two services built from the existing Dockerfiles, uploaded from this folder with the Railway CLI. No GitHub connection and no code changes. `railway up` honours `.gitignore`, so `.env` and `node_modules` are never uploaded.

Run everything from the repo root.

## 1. Set up
```sh
brew install railway        # or: npm i -g @railway/cli
railway login               # opens the browser; the trial credit covers a week
railway init -n procureguard
railway add -s mcp-server
railway add -s agent-service
```

## 2. mcp-server
```sh
railway variables -s mcp-server \
  --set RAILWAY_DOCKERFILE_PATH=mcp-server/Dockerfile \
  --set MCP_PORT=8788 \
  --set RESET_SECRET=<same as your .env> \
  --set LOG_LEVEL=info
railway domain -s mcp-server -p 8788      # prints the mcp domain
railway up -s mcp-server --detach
```
Check: `https://<mcp-domain>/health` returns OK.

## 3. agent-service
Paste your `.env` into **agent-service → Variables → Raw Editor** in the Railway web UI, without `NGROK_AUTHTOKEN` and `NGROK_DOMAIN`. Then:
```sh
railway variables -s agent-service \
  --set RAILWAY_DOCKERFILE_PATH=agent-service/Dockerfile \
  --set AGENT_PORT=8787 \
  --set MCP_URL=https://<mcp-domain>/mcp
railway domain -s agent-service -p 8787   # the URL for judges
railway up -s agent-service --detach
```
Build logs: `railway logs -s <service> --build`.

## 4. ArmorIQ
In the ArmorIQ console, change the `procurement-mcp` server URL to `https://<mcp-domain>/mcp`.

## 5. Guard rails
- Keep **Replicas = 1** on both services. The store is in memory.
- **Usage → set a hard limit** so the trial credit can't be overrun.
- After the week, delete the project.

## Redeploy
Run `railway up -s <service> --detach` again after a change. To get a fresh store without a redeploy, use the dashboard's reset.
