# procureguard: rules for coding sessions

Read these before writing any code here. The full plan is in `docs/BLUEPRINT.md`, the stack is in `STACK.md`, and decisions are in `docs/DECISIONS.md`.

## Code rules (strict)
1. **Clean and simple.** Write the plainest code that works. No over-engineering, and no speculative abstraction, option or config.
2. **No redundancy.** Write each piece of logic once. Shared code goes in `shared/` only when two packages actually use it.
3. **Composable, not tightly coupled.** Pass dependencies in as arguments (store, logger, config); no module-level globals. A function can be tested without starting a server.
4. **Only the layers we need.** No repository, service or controller layers by default. A layer exists only when it removes real duplication.
5. **Declarative, simple names**, e.g. `createStore`, `placeOrder`, `allTools`. No `utils`, `helpers`, `manager` or `handler2`.
6. **Log every meaningful step** with `createLogger` from `shared/src/log.ts`, following the logging pattern in `docs/BLUEPRINT.md` §13:
   - event names follow `area.action.outcome`, and each is logged from exactly one place
   - every line carries a `requestId` or `runId`
   - logging lives in wrappers, not scattered through every function
   - never log secrets or full document text

## Project rules
- **No permission logic in our code.** Every allow, hold and block decision comes from ArmorIQ. Never branch on a tool name to allow or deny.
- Sandbox data only. Every account number and IFSC carries a `FAKE` prefix.
- Don't add dependencies beyond `STACK.md` without asking.
- **Don't run `git commit`.** Hand the user a ready commit message instead.
- Update the docs before building anything that changes the plan.
