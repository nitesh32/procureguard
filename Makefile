-include .env
export

.PHONY: install dev up down logs test typecheck reset

install: ## Install workspace dependencies
	pnpm install

dev: ## Run services locally with hot reload
	pnpm dev

up: ## Run everything in Docker (incl. ngrok tunnel)
	docker compose up --build -d

down: ## Stop Docker services
	docker compose down

logs: ## Follow Docker logs
	docker compose logs -f

test: ## Run unit, contract and guard tests
	pnpm test

typecheck: ## Typecheck every package
	pnpm typecheck

reset: ## Restore the sandbox shop data
	curl -s -X POST -H "x-reset-secret: $(RESET_SECRET)" http://localhost:$(MCP_PORT)/reset > /dev/null && echo "shop reset"
