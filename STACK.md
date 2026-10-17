# Stack

The stack decided for the Guarded Procurement Agent. The blueprint is in [docs/BLUEPRINT.md](docs/BLUEPRINT.md). Ask before adding dependencies that aren't listed here.

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript on Node 22 | One pnpm workspace with three packages: `mcp-server`, `agent-service`, `dashboard` |
| Agent framework | LangChain.js (`langchain` `createAgent`, `@langchain/core`, `@langchain/openai`) + `@armoriq/sdk` (`ArmorIQLangChain`) | Full allow, hold and block, per-user `forUser(email)`, and live enforcement events. Google ADK has no live events, so it's out. Fallback if the adapter misbehaves: Strands TypeScript. |
| MCP tool loading | `@langchain/mcp-adapters` | Tools are loaded from the server, never hand-written |
| LLM | OpenRouter (OpenAI-compatible) via `@langchain/openai` | Set by `LLM_MODEL_DEV` and `LLM_MODEL_DEMO`. Swappable so we can find a model that reproduces scene 3. |
| MCP server | `@modelcontextprotocol/sdk` (Streamable HTTP) on Hono | `/mcp` and `GET /health`. Stateless tools; no permission logic. |
| Data store | In-memory store seeded from `seed/shop.json` | `POST /reset` reloads the seed. Needs one long-running process (no serverless). |
| Agent API | Hono + Server-Sent Events | `POST /runs`, `GET /runs/:id/events`, `POST /approvals/:id`, `POST /reset` |
| Dashboard | Vite + React + Tailwind CSS, `lucide-react` icons, Geist and JetBrains Mono fonts (`@fontsource-variable`) | The build is served by the agent service. Design rules in [docs/DESIGN.md](docs/DESIGN.md). |
| Voice | `@elevenlabs/react` in-browser conversation with a client tool | Bonus feature: the first thing cut if time is short |
| Config | `zod` schema over `process.env`, validated at startup | Fails fast when a variable is missing |
| Tests | Vitest | Unit, contract and guard tests on every run; real-ArmorIQ integration tests in a tagged suite run manually |
| Scripts | `tsx` | Runs `check-setup` and `run-scenario` |
| Public URL | ngrok fixed domain, run as a container in Compose. **Production hosting is decided later.** | ArmorIQ's cloud proxy must reach `/mcp` over public HTTPS |
| Containers | Docker + Docker Compose | `docker compose up` starts `mcp-server`, `agent-service` (which also serves the dashboard) and `ngrok`. The same Dockerfiles are reused when we pick a host. |
| Task runner | Makefile | `make up`, `make dev`, `make down`, `make reset`, `make check`, `make scene N=…`, `make test`, `make logs` |

## Running locally

- **While coding:** `make dev` runs the packages directly with pnpm, with hot reload.
- **For the demo and for judges:** `make up` runs everything in Docker Compose.

Quickstart:

```
cp .env.example .env    # fill in keys
make up
open http://localhost:8787
```
