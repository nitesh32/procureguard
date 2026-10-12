# ArmorIQ, ngrok and ElevenLabs setup

These are the exact steps to connect procureguard to the real ArmorIQ platform. Do them in order, and run `make check` at the end.
Put screenshots in `docs/screenshots/` as you go; they're submission evidence.

> Names must match exactly. A mismatch fails silently.
> - Agent: **`procurement-agent`** (`ARMORIQ_AGENT_NAME`)
> - MCP server: **`procurement-mcp`** (`ARMORIQ_MCP_NAME`)

## 1. Keys in `.env`

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `ARMORIQ_API_KEY` | platform.armoriq.ai → API Keys → create (`ak_test_…` or `ak_live_…`) |
| `LLM_API_KEY` | openrouter.ai → Keys (add a few dollars of credit) |
| `LLM_MODEL_DEV` / `LLM_MODEL_DEMO` | Any OpenRouter tool-calling model ids, e.g. a cheap one for dev and a strong one for the demo |
| `NGROK_AUTHTOKEN` / `NGROK_DOMAIN` | dashboard.ngrok.com → Your Authtoken, and Domains → your free static domain |
| `MCP_URL` | `https://<NGROK_DOMAIN>/mcp` |
| `RESET_SECRET` | Any random string |
| `ELEVENLABS_AGENT_ID` | Step 6 (optional) |

## 2. Give the MCP server a public URL

ArmorIQ's cloud must reach `/mcp`, and localhost won't work.

```bash
make up          # mcp-server + agent-service + ngrok in Docker
curl https://<NGROK_DOMAIN>/health      # → {"ok":true}
```

Without Docker, run `make dev` and then `ngrok http --url=<NGROK_DOMAIN> 8788` in another terminal.

## 3. Register the MCP server
Console → **MCP Servers** → add:
- Name: `procurement-mcp`
- URL: `https://<NGROK_DOMAIN>/mcp`

The console should discover the 10 tools.
📸 `docs/screenshots/01-mcp-registered.png`

## 4. Register the agent and users
1. Console → **Agents** → add `procurement-agent`.
2. Add the two users (members):

   | User | Order limit | Role |
   |---|---|---|
   | `manager@shop.test` | ₹50,000 | requester |
   | `owner@shop.test` | ₹5,00,000 | approver |

   If the console needs real, loginable emails for the approver, use your own address (e.g. `you+owner@gmail.com`). Update `users` in `agent-service/src/scenarios.ts` to match, and record the change in `docs/DECISIONS.md`.

📸 `docs/screenshots/02-agent-and-users.png`

## 5. Policies (scoped to `procurement-mcp`)
Console → **Policies → + Create Policy**. In the builder, connect **User → Agent → MCP Server**, then set **Member Rules** (Allowed Tools, …) and save.
Create the policies in this order, and run `make check` after each.

| # | Policy | Verdict | Tools | Condition |
|---|---|---|---|---|
| 1 | `reads-allowed` | allow | `check_inventory`, `list_suppliers`, `get_quote`, `read_quote_document` | none |
| 2 | `notes-allowed` | allow | `add_note`, `flag_for_review` | none |
| 3 | `orders-within-limit` | allow, or hold above the limit | `place_order` | allow if `amount` ≤ the user's limit; **hold** for the owner's approval above it |
| 4 | `payee-and-destructive-denied` | block | `update_payee_bank`, `delete_supplier`, `export_supplier_list` | always |

Notes:
- ArmorIQ **fails closed**. Any tool without a matching policy returns `no_matching_policy`.
- Threshold rules only see argument fields named `amount`, `value`, `total`, `price` or `cost`. Our `place_order` uses `amount` (an integer number of rupees).
- **Still to confirm:** the docs don't name the exact console fields for the amount threshold and the hold. Find them in the policy's member rules when you get there. If limits can't be set per user, create one `orders-within-limit` policy per user (50000 for the manager, 500000 for the owner). Either way, record what you did in `docs/DECISIONS.md`.

📸 `docs/screenshots/03-policies.png`

## 6. ElevenLabs voice approval (optional)
In elevenlabs.io → **Conversational AI** → create an agent:
- **Visibility:** public (so the browser can connect with only the agent id).
- **First message:** `Hi, this is your purchasing assistant. I need your approval for an order.`
- **System prompt:**
  ```
  You call the shop owner to approve a held purchase.
  Say: "{{requested_by}} wants to place an order for {{amount}} (quote {{quote_id}}). Reason it was held: {{reason}}. Do you approve?"
  Wait for a clear yes or no. On yes, call recordDecision with decision "approve". On no, call recordDecision with decision "reject".
  Then tell the owner to confirm the same decision in the ArmorIQ console, and end the call.
  ```
- **Client tool:** `recordDecision`, with one required string parameter `decision` (enum `approve`, `reject`). Turn on "wait for response".
- **Dynamic variables:** `requested_by`, `amount`, `quote_id`, `reason`.

Put the agent id in `.env` as `ELEVENLABS_AGENT_ID` and restart. The approval card will then show **Ask the owner by voice**.

## 7. Verify

```bash
make check        # every line OK (policies: confirm in console)
make scene N=1    # expect: place_order … ALLOWED
make scene N=3    # expect: update_payee_bank … BLOCK
make test-live    # same two scenes as automated tests
```

📸 `docs/screenshots/04-block-trace.png`: the console's audit or observability view of the **blocked `update_payee_bank`**, showing the matched policy, the plan and the agent name. **This is the required proof for the submission.**
