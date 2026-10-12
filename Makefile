-include .env
export

.PHONY: install build dev up down logs test test-live typecheck check scene reset

install: ## Install workspace dependencies
	pnpm install

build: ## Build the dashboard (served by agent-service on :8787)
	pnpm build

dev: ## Run mcp-server, agent-service and dashboard (http://localhost:5173) with hot reload
	pnpm dev

up: ## Run everything in Docker (incl. ngrok tunnel)
	docker compose up --build -d

down: ## Stop Docker services
	docker compose down

logs: ## Follow Docker logs
	docker compose logs -f

test: ## Unit, contract and guard tests (no network)
	pnpm test

test-live: ## Real ArmorIQ + LLM scenes 1 and 3 (costs credits)
	LIVE=1 pnpm vitest run agent-service/test/scenes.live.test.ts

typecheck: ## Typecheck every package
	pnpm typecheck

check: ## Verify .env, MCP reachability and ArmorIQ registration
	pnpm --filter agent-service check

scene: ## Run one scene headless: make scene N=3 [OFF=1] [AS=owner]
	pnpm --filter agent-service scenario $(N) $(if $(OFF),--off,) $(if $(AS),--as=$(AS),)

reset: ## Restore the sandbox shop data
	curl -s -X POST -H "x-reset-secret: $(RESET_SECRET)" http://localhost:$(MCP_PORT)/reset > /dev/null && echo "shop reset"
