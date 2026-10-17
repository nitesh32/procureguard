# Flow State 2026 compliance checklist

Each row maps one hackathon requirement to where we meet it. Before submitting, fill in the **Evidence** column with a link to a commit, file, screenshot or video timestamp. Section numbers (§) refer to [BLUEPRINT.md](BLUEPRINT.md).

| # | Hackathon requirement | How we meet it | Evidence |
|---|---|---|---|
| 1 | AI agent (any model or framework) | The LLM makes the tool-calling decisions through an ArmorIQ adapter (§7) | |
| 2 | At least one MCP server performing real actions | `procurement-mcp` with 10 tools on the sandbox DB (§5) | |
| 3 | ArmorIQ: one action **allowed** | Scene 1: read tools allowed by `procurement-guard` (live-verified Oct 13) | |
| 4 | ArmorIQ: one action **blocked** | Scene 3: `update_payee_bank` blocked by `procurement-guard`, reason `tool_denied` (live-verified Oct 13) | |
| 5 | Real integration, not fake or hardcoded (rule 8) | No verdict logic in our code; the guard test passes (§12, §13.2) | |
| 6 | API key generated on platform.armoriq.ai | Key in `.env`, never committed; `check-setup` shows it as valid | |
| 7 | Agent **and** MCP onboarded on the platform | `procurement-agent` and `procurement-mcp` are registered; `check-setup` is all OK | |
| 8 | Intent and policy enforcement shown through the platform | Console trace shows the signed plan and the matched policy | |
| 9 | ElevenLabs is optional and never replaces ArmorIQ (rule 2) | Voice is only used to approve a hold (§8) | |
| 10 | At least one MCP server (rule 4) | Same as row 2 | |
| 11 | Core development inside Oct 10–17 (rule 5) | Small, frequent, unsquashed commits | |
| 12 | Disclose pre-existing code and assistants (rule 6) | Disclosure section in the README | |
| 13 | Sandbox only, no real data or payments (rule 7) | `FAKE`-prefixed accounts, demo user emails kept in `.env` (never committed), Sandbox label in the UI | |
| 14 | No attacks on ArmorIQ, others or third parties (rule 9) | The prompt injection targets only our own sandbox agent | |
| 15 | No misrepresentation (rule 10) | Approvals are never faked; the OFF run is labelled "comparison only"; the README states known limitations | |
| 16 | Submission: GitHub repo + README + setup steps | | |
| 17 | Submission: demo video ≤ 90 s | | |
| 18 | Submission: short description | | |
| 19 | Submission: proof that ArmorIQ blocked an action | Screenshot in `docs/screenshots/` | |

## Open questions for the hackathon channel
Record each answer in `docs/DECISIONS.md`.
- What time and timezone does the Oct 17 deadline close?
- What are the judging criteria?
- Can a held call be approved through an API?
- Do approver or test users have to be real platform accounts?
