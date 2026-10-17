# Dashboard design system

The one-screen dashboard (`dashboard/`). Tokens live in `dashboard/src/index.css`; this file is the rulebook. Change the rules here before changing the UI. The approved reference is the Google Stitch pass (welcome, scene 1, held, blocked).

## 1. Atmosphere

Calm, spacious and typographic. A warm off-white canvas, ink type, hairlines, and colour only where ArmorIQ made a decision. The screen has one job: make "the agent was fooled, the boundary held" obvious in one look. The held or blocked card is the only white focal surface; everything else is plain text on the canvas.

## 2. Colour

One warm grey family, no pure black.

| Token | Hex | Role |
|---|---|---|
| `canvas` | `#FBFBFA` | Page background |
| `panel` | `#FFFFFF` | Header, focal cards, input, answer tables |
| `panel-2` | `#F1F0EC` | Chips, Sandbox pill, args block, hover |
| `line` | `#ECEBE9` | Hairline dividers |
| `line-strong` | `#E2E2DF` | Input and neutral card borders |
| `ink` | `#18181B` | Body text, user bubble, primary button, focus ring |
| `muted` | `#71716E` | Secondary text, labels |
| `faint` | `#A1A19D` | Times, tool names, section labels, footnotes |
| `allowed` | `#15803D` | ArmorIQ allowed or approved |
| `held` | `#B45309` | ArmorIQ held, waiting for the owner |
| `blocked` | `#B91C1C` | ArmorIQ blocked; also "check failed" text |

Washes (verdict colour at 6–8%) only on the welcome verdict tags and the countdown pill. Card borders are the verdict colour at 25%. No gradients, no brand hues.

## 3. Typography

Geist Variable for UI, JetBrains Mono Variable for times, tool names, ids, accounts and amounts. Both bundled (works offline).

| Use | Size | Weight |
|---|---|---|
| Welcome heading | 40px (30px mobile) | 500 |
| Card title | 18px | 500 |
| Step rows, answer, card rows | 15–16px | 400 |
| Section labels, summary line, footnotes | 13–14px, `faint` | 400 |
| Mono (times, tools, verdict words) | 12–13px | 400–500 |

Sentence case everywhere; the only uppercase is the small grey "Procurement agent" kicker. Money, counts, timers and accounts use `tabular-nums`. "…" not "...".

## 4. Space, radius, elevation

- Generous spacing: the conversation column is 760px max, centred; the side panel is 380px on `lg`+.
- Radius: 8px controls, 12px (`rounded-xl`) cards, input and answer tables, full for chips, pills and dots. The user bubble is `rounded-2xl`.
- Flat: hairline borders only. No shadows, no boxes inside boxes.

## 5. Layout

- Top bar (white, hairline below): "Procureguard", "Sandbox" pill, grey "Acting as Shop manager"; right, a green dot and "Protected by ArmorIQ".
- `lg`+: conversation column (composer pinned at the bottom, hairline above it) and the side panel, each scrolling on its own.
- Below `lg`: one column, conversation then side panel; the page scrolls. No horizontal scroll at 375px (wide answer tables scroll inside their card).

## 6. Components

**Welcome.** Kicker, heading "What should the agent buy today?", one grey sentence, then the three scenarios as button rows split by hairlines: "N · Title", a grey hint, a small mono verdict tag on the right; scene 3 also carries a grey "attack" tag.

**Turn.** Right-aligned ink bubble with the prompt. A grey summary line ("4 actions · 12s · ArmorIQ checked each one before it ran"; while running "Working · ArmorIQ is checking every action · Ns", `role="status"`). Then the step list, always open: mono time, glyph (grey ✓ allowed, red ✕ blocked, amber pause held, spinner checking), plain sentence (red when blocked, amber when held), grey mono tool name and a coloured verdict word. A row is a button that reveals "Decided by …" and the args.

**Held card.** White, `held` border at 25%, amber dot, "Waiting for owner approval", mono countdown pill ("0:42 left"). Rows Item, Amount, Supplier quote, Requested by, Why held. Hairline, "Nothing is ordered until the owner approves.", primary "Approve in ArmorIQ Console ↗" and outline "Ask Owner by Voice". Footnote "ArmorIQ reason: … · time". The UI never approves. Settled: same card with a neutral border: "Not approved in time · nothing was ordered" (Amount, Held at, Window, console link) or "Approved by the owner · the order went ahead".

**Blocked card.** `role="alert"`, `blocked` border at 25%, red dot. Bank change: "Bank change blocked by ArmorIQ", "Payments still go to ••••0033", "Requested ~~••••0099~~ not applied", the IFSC line, then the footnote "ArmorIQ reason: tool_denied · time · nothing reached the shop" and "Open in ArmorIQ console ↗". Other tools: "Blocked by ArmorIQ" and the plain sentence. Only for `blocked`, never for "check failed".

**Answer.** Plain body text from Markdown (raw HTML off). Tables sit in a white hairline card with thin row dividers, grey header, mono right-aligned numbers. While a hold is pending: grey italic "Agent is waiting…".

**Composer.** Scenario chips (`panel-2` pills), then a white `rounded-xl` input "Ask the purchasing agent…" with an arrow button. Disabled while the agent runs.

**Side panel.** Plain text sections with grey sentence-case labels, no cards: This session (counts), Decision log (newest 12, mono "time · tool" plus verdict word, one line), Suppliers (masked account; a red "Bank change blocked, unchanged" under an attacked one), Low stock (mono "stock / reorder" and a thin grey bar), Flagged for review (only when present), Orders (placed, and amber "Pending approval" for holds).

**Voice call.** Inline in the held card: a solid circle that scales with the audio level, ink for the assistant, green for the owner. End call is a 40px icon button.

## 7. Motion

Only: the "checking" spinner, the voice orb (and its "calling" pulse), and 150–200 ms colour transitions on hover and focus. No entrance animations. `prefers-reduced-motion` turns it all off.

## 8. Accessibility

- 2px ink `:focus-visible` ring with 2px offset on every interactive element.
- `aria-label` on icon-only buttons; decorative icons `aria-hidden`; colour is never the only signal (glyph plus word).
- `aria-live` / `role="status"` for the run summary and session counts.
- Text in flex rows gets `min-w-0` and `truncate`; touch targets on primary controls are at least 40px.
- Errors say what happened and what to do next.

## 9. Banned

Gradients, shadows, glows, glassmorphism, sidebars, badges on every row, uppercase mono labels (except the kicker), boxes inside boxes, icon tiles, emojis, entrance animations, `transition: all`, pure black, a second grey family, any UI that looks like it can approve a held action.
