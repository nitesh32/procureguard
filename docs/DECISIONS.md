# Decisions

Answers to open questions and trade-offs, newest first.

## 2026-10-10

### Stack
TypeScript and pnpm, with LangChain.js and the ArmorIQ LangChain adapter. The MCP server runs on Hono with an in-memory store. Docker Compose and a Makefile run everything; tests use Vitest; ngrok gives the public URL for now. Full detail is in `STACK.md`.
- **Why LangChain:** the ArmorIQ docs list only LangChain and Strands as reporting live enforcement events, which the dashboard feed and the voice trigger need. Google ADK doesn't. CrewAI has no holds and no per-user scoping.
- **Why no database:** one long-running process holds the state, and every demo take starts from `reset` anyway.
- **Hosting:** decided later.

### Product direction
We compared our idea against the organisers' 13 suggested ideas and **kept the procurement agent**. It already combines ideas 5 (invoice autopilot), 6 (per-user) and 8 (injection, with/without ArmorIQ), plus ElevenLabs. On top of that we add:
- **Voice approval through `await_approval()`** (from idea 3), if our code can submit the decision.
- **A receipt panel** (from idea 9): the plan hash and the verdicts for each run, if the export API is simple.
- **A split-screen video ending** (from idea 8): ArmorIQ OFF next to ON for the same scam.
- **A `delegate()` split as a stretch goal** (from idea 1): an orchestrator plus a Quote Reader (read-only) and a Buyer (`place_order` only). **Cut-off is Oct 15.** If it isn't working by then, we ship the single-agent version.

### Verified in the ArmorIQ docs
- `delegate()` is a core SDK method. In TypeScript: `client.delegate(intentToken, delegatePublicKey, validitySeconds?, allowedActions?, targetAgent?)` returns `{ delegationId, delegatedToken, … }`. It is **not** part of the LangChain adapter; the sub-agent needs an Ed25519 key pair and `client.invoke(...)`.
- On a hold, the adapter "waits asynchronously for the delegation decision" and polls every 5 s (`approval_poll_interval`).

### Still open
- Can our code **submit** an approval decision, or must a human approve in the console?
- Can a user record carry an order limit that a policy reads, or do we need one policy per user?
- Do approvers have to be real platform accounts?
- What time and timezone does the deadline close, and what are the judging criteria?
