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

**Agent:** go to **Inventory → Agents → + Add Agent**.
- **Method:** **Custom (manual)**. "Attached to MCP server" fails on Register with "url should not be empty", even though it shows no URL field.
- **Name:** `procurement-agent`. **Type:** Automation. **Owner:** your email.
- **Agent URL:** must be `https://`. Use the GitHub repo URL; nothing calls our agent from outside.
- **Policy step:** **Skip for now**. Never pick *Observe-only*, because it blocks nothing.

**Users:** go to **Team**. The run's user (`forUser(email)`) must be an **accepted member** of the org, so `.test` addresses don't work: invites stay pending forever.
- Owner / approver: your own account (org admin).
- Manager / requester: a second real email, invited as **Viewer**, with the invite accepted.
- Put both emails in `.env` as `DEMO_OWNER_EMAIL` and `DEMO_MANAGER_EMAIL`. They stay out of the repo.

📸 `docs/screenshots/02-agent-and-users.png`

## 5. Policy: one policy on `procurement-mcp`
Go to **Policies → + Create Policy**.
- **Target:** MCP server `procurement-mcp`. The agent target lists no tools.
- **Applies to:** members.
- **Default action:** block.

Set all 10 tools explicitly. If the form leaves extra tools on Hold, use the YAML view.

| Action | Tools |
|---|---|
| allow | `check_inventory`, `list_suppliers`, `get_quote`, `read_quote_document`, `add_note`, `flag_for_review` |
| hold | `place_order` |
| block | `update_payee_bank`, `delete_supplier`, `export_supplier_list` |

Name it `procurement-guard`, and make sure it's the **only active** policy. "Replace" on activation may leave older policies active, so deactivate those yourself. Note that a lower priority number wins.

Held calls appear under **Intent → Held Actions**. Approve with the button or the `a` key.

Notes:
- ArmorIQ **fails closed**. With no matching policy, every call returns `no_matching_policy`.
- **What didn't work in our org (Oct 12):**
  - The per-tool "Parameter limits" (`amount <= 50000`) and the per-person scope (`scope.people`) were dropped on save, so holds can't depend on the amount or the user.
  - The ArmorPay studio (`/dashboard/armorpay/studio`) redirected to sign-in.
  - So `place_order` is held for everyone. See `docs/DECISIONS.md`.

📸 `docs/screenshots/03-policy.png`

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
make scene N=1    # expect: check_inventory, get_quote … ALLOWED
make scene N=2    # expect: place_order … HOLD (approve in Intent → Held Actions within ARMORIQ_APPROVAL_WAIT_SECONDS)
make scene N=3    # expect: update_payee_bank … BLOCK
make test-live    # same two scenes as automated tests
```

📸 `docs/screenshots/04-block-trace.png`: the console's audit or observability view of the **blocked `update_payee_bank`**, showing the matched policy, the plan and the agent name. **This is the required proof for the submission.**
