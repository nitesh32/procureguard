# Dashboard design system

The one-screen dashboard (`dashboard/`). Tokens live in `dashboard/src/index.css`; this file is the rulebook. Change the rules here before changing the UI.

## 1. Atmosphere

A calm financial-operations tool, in the family of Linear, the Stripe dashboard and Ramp. White surfaces, one grey family, ink-black type, and colour only where ArmorIQ made a decision. Density is "daily app, balanced": readable at a glance in a 90-second video, never cramped.

The screen has one job: make "the agent was fooled, the boundary held" obvious in one look. The held or blocked card is always the #1 focal point. Everything else is quiet.

## 2. Colour

Zinc neutrals only (no slate, no mixing grey families), no pure black. 70/20/10: about 70% white surface, 20% zinc structure and text, 10% verdict colour.

| Token | Hex | Role |
|---|---|---|
| `panel` | `#FFFFFF` | Every surface: header, chat, rail, cards |
| `panel-2` | `#F4F4F5` | Background shift: hover, selected row, code and args blocks, avatar |
| `line` | `#E4E4E7` | 1px borders and dividers |
| `muted` | `#71717A` | Secondary text, labels, meta (4.8:1 on white) |
| `ink` | `#18181B` | Body text, headings, primary buttons, user bubble, focus ring |
| `allowed` | `#2E7D4F` | ArmorIQ allowed or approved |
| `held` | `#B45309` | ArmorIQ held, waiting for the owner |
| `blocked` | `#B42318` | ArmorIQ blocked; also "check failed" text |
| `checking` | `#71717A` | Waiting on ArmorIQ (same as muted) |
| ArmorIQ orange | `#D97D55` | Only inside the ArmorIQ logo mark. Never a UI colour. |

Verdict tints are the verdict colour at 10% (`bg-held/10`) for pills, 5% for a row or card background. No indigo, violet or any brand hue. No gradients anywhere.

## 3. Typography

Inter Variable for UI, JetBrains Mono Variable for tool names, ids, args and account numbers. Both are bundled (works offline).

| Use | Size / line | Weight |
|---|---|---|
| Product name | 16 / 24 | 600 |
| Card title | 15 / 22 | 600 |
| Body, chat, rows | 14 / 20 | 400 (500 for labels that matter) |
| Meta, captions, pills, key labels | 12 / 16 | 500 |
| Mono (tool, args, accounts) | 12 / 16 | 400 |
| Welcome heading | 20 / 28 | 600 |

Money, counts, timers and account numbers use `tabular-nums`. Sentence case for text, Title Case for button labels. Use "…" not "...". Active voice: "ArmorIQ blocked it", not "it was blocked".

## 4. Space, radius, elevation

- 4px grid. Common steps: 4, 8, 12, 16, 24. Page gutters 16 (mobile) and 24 (desktop).
- Radius: **6px** for controls (buttons, inputs, pills, tabs, chips); **8px** for panels and cards (`rounded-lg`). Full circles only for avatars, status dots and the voice orb. No `rounded-2xl`.
- Flat. A surface separates itself with a border **or** a background shift, never both. No shadows (a 1px border does that job).

## 5. Layout

- Header (full width, bottom border), then two columns at `lg` and up: chat (flexible) and a 400px rail, split by a 1px border. The rail stacks: ArmorIQ decisions, then shop tabs.
- Below `lg`: one column, chat first, then the rail. The page scrolls; no horizontal scroll at 375px.

## 6. Components

**Header.** "Procureguard", a persistent `SANDBOX` tag (mono, 11px, uppercase, 1px border, 6px radius), "Acting as Shop manager" (role only, never an email), and "Protected by" with the ArmorIQ mark and wordmark. No icon tile, no pulsing dot.

**Buttons.**
- Primary: solid ink, white text, 6px radius, 40px tall, 14/500, Title Case. Hover `#27272A`. No gradient, no glow.
- Secondary: white, 1px `line` border, ink text, hover `panel-2`.
- Icon buttons: 40×40, `aria-label`, icon `aria-hidden`.
- Disabled: 40% opacity, `not-allowed` cursor.

**Verdict pill.** 6px radius, 12/500, icon plus word (colour is never the only signal), verdict text on a 10% tint: allowed, approved, held, blocked, not approved. Neutral `panel-2` pills: checking (spinner), tool error, no verdict. "check failed" (ArmorIQ unreachable, fails closed) is red text on a neutral pill so it never reads as a block.

**Approval request card (held).** White, 1px border in `held` at 40%, 8px radius, 16px padding. Top: held pill, title "Approval needed", one line of context. Then key/value rows (`<dl>`, 12px muted keys, 14px ink values): Item, Supplier (when known), Amount (600, tabular), Requested by, Why held, Time left (live mm:ss). Actions: primary "Approve in ArmorIQ Console" (external link), secondary "Ask Owner by Voice". The UI never approves; approval happens in the ArmorIQ console. After the voice call it shows what the owner said and asks for confirmation in the console. Settled states collapse to one line: approved, or "Not approved in time · nothing was ordered".

**Blocked attempt card.** Same shape with the border in `blocked` at 40%, `role="alert"`. For a bank change: title "Bank change blocked", the plain sentence of what the agent tried, then rows Supplier, "Payments still go to ••••0033 (unchanged)", "Requested ••••0099 — not applied", "Decided by ArmorIQ policy (tool_denied)". Other blocked calls: one line, "The agent tried to …. ArmorIQ blocked it before it ran. Nothing changed."

**ArmorIQ decisions (rail).** One section, no tiles: a single row of three counts (icon + number + word, tabular), and the latest decision as one line: pill, tool name in mono, and a plain outcome ("Not run — blocked before it reached the shop"). `aria-live="polite"`.

**Tabs (Orders, Suppliers, Inventory).** Text tabs with a count; the selected tab has ink text and a 2px ink underline. `role="tablist"`, each tab has an id and `aria-controls`, the panel `aria-labelledby`. Rows are plain lists split by `line` dividers. A supplier under attack shows the static note "Bank change blocked · account unchanged" on a 5% red row.

**Chat.** User bubble: ink background, white text, 8px radius, right aligned, max 80% wide. Agent: a solid `panel-2` avatar circle with the bot icon, name, then the action trace (collapsible, 1px border, one row per call, args on demand) and the answer as plain prose. Welcome screen: the three scenario choices, each a secondary-style row with a small verdict-coloured icon and its hint.

**Input.** 1px `line` border, 8px radius, 40px send button (primary). Focus: the border turns ink. Placeholder ends with "…".

**Voice call.** Inline in the approval card: a solid circle that scales with the live audio level, ink while the assistant speaks and `allowed` green while the owner speaks. No gradient, no blur halo. End call is a 40px icon button.

## 7. Motion

Allowed, and nothing else:
- a spinner on "checking";
- one pulsing dot for "running" (agent avatar, voice "calling");
- 150–200 ms colour transitions on hover and focus (`transition-colors`, never `transition: all`);
- the voice orb following the audio level.

No entrance animations on rows or cards, no shake, no flash, no shimmer text, no count-up numbers, no hover lift. `prefers-reduced-motion: reduce` turns all of it off.

## 8. Accessibility (Web Interface Guidelines)

- Visible `:focus-visible` ring: 2px ink, 2px offset, on every interactive element.
- `aria-label` on icon-only buttons; decorative icons `aria-hidden`.
- `aria-live="polite"` for async status (latest decision, voice call state).
- Flex children that hold text get `min-w-0` and `truncate`.
- Errors say what happened and what to do next ("… Start it with `make up`, then Retry").
- Touch targets on primary controls are at least 40px.
- `<meta name="theme-color">` and a description in `index.html`.

## 9. Banned

Gradients (backgrounds, text, borders), purple or indigo, glows and drop shadows, glassmorphism, icons inside rounded squares (avatars excepted), emojis, gradient or shimmer text, `rounded-2xl` everywhere, stat tiles, entrance or attention animations, `transition: all`, pure black `#000`, a second grey family, any UI that looks like it can approve a held action.
