# NavCRM — interface design notes

A working prototype of the NavCRM web app (signed-out and signed-in), built to be
shown in a presentation and then iterated in Figma. Visual direction: Sweatpals'
dark mode (pure black canvas, #111 cards, outlined pills), Revolut's light mode
(pale canvas, white cards, lavender soft pills), Linear for structure and the AI
assistant (foldable sections, display options, a panel you can open anywhere),
with Mercury kept in mind for financial figures. Motion follows Emil Kowalski's
skills. Reference decisions and verification are recorded in `docs/redesign.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5180
```

Sign in with any 9-digit phone and any password. In code screens any 6 digits
work; `000000` shows the error state. Sample data: a Dushanbe beauty clinic
("Sitora Beauty") with 6 masters, 18 services and 520 clients. The prototype runs on a fixed clock:
**today at 14:20**, so the calendar and dashboard always show a business day in
progress, whatever day you present.

## What's in it

| Area | Routes | Highlights |
| --- | --- | --- |
| Signed out | `/signin`, `/signup` | Phone + password or Telegram code, password reset, one-question-per-screen sign-up with business spheres (max 4) and team invites |
| Home | `/` | Action pills, scrubbable revenue chart with its period switch on the card, arrivals, actionable "Needs attention", foldable sections and a Customize menu to hide what you don't use |
| Calendar | `/calendar` | Day (masters as columns), Week, List, Rooms; drag to reschedule with rule checks; visit sheet with one next step through to checkout; waiting list |
| Clients | `/clients`, `/segments`, `/import` | Count cards that filter by category, debt and birthday chips, a Display menu for ordering and columns, centered selection bar, client profile sheet, segment builder with live count, import with migration guides |
| Register | `/pos/*` | Sale with gray item tiles and animated total, promo codes, bonuses, split payment; receipts and refunds; shift close by banknote count; debts, memberships, certificates, expenses, printer |
| Inbox | `/inbox` | Telegram / WhatsApp / Instagram in one list, assistant hand-off, client context drawer on demand |
| Tasks | `/tasks` | Grouped by due date, auto-created tasks labelled by source |
| Inventory | `/inventory/*` | Products, stock, documents (receipt, write-off, transfer, stocktake), tech cards, supplier orders |
| Laboratory | `/lab/*` | Orders with result entry and range flags, new order page, test catalog, templates, partner labs, reports |
| Campaigns | `/campaigns/*` | List judged by "came back within 14 days", 4-step builder with live Telegram preview, discount offers and cards |
| Instagram & maps | `/channels/*` | Where bookings come from, platform setup, review replies, portfolio |
| Assistant | `/assistant` and every page (⌘J) | A floating panel that keeps the conversation while you move around, page-aware suggestions, reasoning trace, client chips, copy and feedback, stop; full page with dismissible examples and history grouped by day |
| Reports | `/reports/*` | Expandable hub topics, revenue, cash & profit, receivables, load heatmap, clients, report builder |
| Payroll, Sublease | `/payroll/*`, `/sublease` | Periods with locked approval, rule-based schemes, timesheet; tenant rent and money held for tenants |
| My earnings | `/me` | Time clock, preliminary accruals, payslips |
| Settings | `/settings/*` | 29 pages in Mercury's settings layout |

Global: ⌘K search (clients by name or phone digits, pages, actions, ask the
assistant), ⌘J the assistant panel, `[` folds the sidebar, notifications, sync
status, hide amounts, light/dark/system theme.

**Prototype limits:** English and Russian are supported, including live switching;
Tajik is not yet available. Demo business data, conversations, and drafts live in
memory and reset on reload. Theme, sign-in, hide amounts, sidebar size, folded
sections, Home's shown parts, list columns and ordering persist. A few outward actions (printing, sending, exports)
confirm with a toast instead of doing it.

## Principles

1. **Every element earns its place.** For each block we asked: would a salon
   owner or front-desk admin in Dushanbe miss it? If not, it's gone.
2. **One way to do a thing.** One primary action per page, one place for each
   setting, one assistant, one pattern per kind of task.
3. **Quiet by default, loud when it matters.** Neutral surfaces; the accent marks
   the next action; red and amber only for things that need attention.
4. **Local first.** +992 phones, TJS, Telegram before SMS, local banks and QR
   payments, Tajik holidays, offline sync you can trust.

## What changed from the current product (and why)

| Current product | Prototype | Why |
| --- | --- | --- |
| 16 sidebar items in 5 groups, Settings below the fold | Daily screens at the top; labelled Operations, Growth, Money sections that start open and fold away (Linear); Settings and your account pinned at the bottom; an icon rail that still shows every destination | Every destination is visible; what you don't use folds away and stays folded |
| A full-width top bar repeating the page name | No top bar: search, Ask AI and notifications live in the sidebar; page titles are compact and nested pages name their parent ("‹ Segments") | More room for the work, and one clear "where am I" |
| Settings is a second sidebar inside the page | Settings **replaces** the sidebar (Mercury) with "‹ Settings" to go back | Full content width, no two-level sidebar |
| "My earnings" among company money tools | Moved to the profile menu | It's personal, not company money |
| Ask AI as a dashboard modal, a page, and a button on every report | One assistant: a panel you open from any page (⌘J) that keeps the conversation as you move, and expands to a full page | Ask in context without losing your place |
| Every table shows every column | A Display menu per list (ordering, columns, archived) with sensible defaults | Dense data without showing everything at once |
| "Reports" in the sidebar and as a dashboard button | Only in the sidebar | No duplicate entry points |
| "Connect Telegram" offered in 4 places | Lives in Settings → Telegram bot; elsewhere it's a status line | Less nagging |
| Modal vs drawer vs full page chosen ad hoc | Modal for quick create/edit, Sheet for a record's details, full page for long or multi-step work | Predictable |
| Dashboard tiles partly clickable | Every KPI tile is a link, same affordance (↗) | Consistency |
| Staff without a name shown as a phone number | "Invited · +992 …" with "Resend invite" | Reads as a person, not a bug |
| Separate sync page | Sync status next to your name in the sidebar, details in a popover | Visible trust without a page |
| Service dialog closes when switching tabs | Tabs inside the dialog keep it open | Bug fixed |
| Language switch on every form field | Language lives in the profile menu; multilingual fields switch inside the one field | Calmer forms |

New, because the job needs it:

- **Hide amounts** (eye icon): front-desk screens face clients.
- **Free time slots** in "New visit" instead of a time dropdown: you see where the
  client fits.
- **Duplicate check** when creating a client by phone.
- **"Needs attention"** on Home is actionable: each row has the one button that resolves it.
- **Sublease revenue is excluded** from salon revenue everywhere, with a note.

## Tokens

All colors are CSS variables in `src/styles/index.css` (`:root` for light,
`[data-theme='dark']` for dark). Names are semantic and map 1:1 to Figma variables.
Dark values were sampled from Sweatpals screens and light values from Revolut's
web app; the accent is NavCRM's own.

| Token | Light (Revolut) | Dark (Sweatpals) | Use |
| --- | --- | --- | --- |
| `--bg` | #F7F7F7 | #000000 | Page |
| `--bg-sidebar` | #F7F7F7 (no divider) | #000000 (hairline divider) | Sidebar |
| `--surface` | #FFFFFF | #111111 | Cards |
| `--surface-raised` | #FFFFFF | #161616 | Popovers, modals, sheets, the assistant panel |
| `--fill` | #EDEEF2 | #1C1C1C | Inputs, tracks, tiles |
| `--fill-hover` / `--fill-active` | #E6E7EC / #DEDFE5 | #242424 / #2C2C2C | States |
| `--border` / `--border-strong` | black 7% / 13% | white 8% / 14% | Hairlines, outlines |
| `--fg` | #121316 | #F5F5F5 | Primary text |
| `--muted` | #60626B | #A3A3A3 | Secondary text |
| `--faint` | #7B7D86 | #767676 | Tertiary text, placeholders |
| `--accent` | **#0011FF** | **#4F5DFF** | Primary buttons, focus, selection |
| `--accent-fg` | #0011FF | #808BFF | Accent text and icons |
| `--accent-soft` | #ECEDFF | accent 16% | Selected backgrounds, soft action pills |
| `--chart` / `--chart-soft` | #4C5AFF / #C9CDFF | #5866FF / 32% | Bars, lines, meters |
| `--positive` / `--negative` / `--warning` | #0F8A4F / #D92D20 / #B25E09 | #3CCB7F / #FF6B5E / #F5A524 | Status |

Roles that change shape by theme rather than value:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--segment-active` | white with a soft shadow | white with black text | The selected segment (Revolut's tab, Sweatpals' toggle) |
| `--button-secondary` | filled gray pill | outlined pill | Secondary buttons, filter chips, pill selects |
| `--nav-active` | white pill | white 8% | Current sidebar item |
| `--row-hover` | black 2.5% | white 3% | Table and list rows |

Dark accent: `#0011FF` on black fails contrast, so dark mode keeps the same
hue but lighter: `#4F5DFF` for filled buttons (4.8:1 with white text) and
`#808BFF` for accent text (over 6:1 on the background).

Staff and calendar labels: `--c-indigo, sky, teal, green, amber, orange, rose,
violet, slate`; soft fills are mixed per theme (`.label-soft`). Avatars are
gradient initials in the person's color (`.avatar`), as on Sweatpals.

**Type:** Inter (variable, optical sizing on; self-hosted, works offline).

| Token | Size / line | Letter-spacing | Use |
| --- | --- | --- | --- |
| `text-2xs` | 11/14 | 0 | Tiny badges |
| `text-xs` | 12/16 | 0 | Labels, table headers |
| `text-sm` | 13/18 | 0 | Secondary text, sidebar items |
| `text-base` | 14/20 | 0 | Body, tables, buttons |
| `text-md` | 15/22 | 0 | Large inputs |
| `text-lg` | 16/24 | 0 | Card and section titles |
| `text-xl` | 20/28 | −0.01em | Small figures, modal titles |
| `text-2xl` | 24/32 | −0.02em | Page titles (semibold) |
| `text-3xl`–`text-6xl` | 28–64 | −0.015em | Big numbers (regular weight, Mercury) |

Weights: 600 for page, modal and section titles (Sweatpals), 500 for emphasis,
400 for big figures.

**Radius:** inputs 12, tiles 12, cards 20, sheets and the assistant panel 22,
modals 24, buttons, chips and search pill.

## Patterns

- **Shell:** no top bar. The sidebar holds the business switcher, notifications,
  Search (⌘K), Ask AI (⌘J), the daily screens, labelled sections that fold
  (Linear), Settings and your account with sync status and hide amounts. A round
  handle on its edge, or `[`, folds it to an icon rail that still shows every
  destination. Phones get a slim bar with the menu, the page name, search and
  notifications.
- **Page:** `PageHeader` (compact semibold title, subtitle, actions; nested pages
  show "‹ Parent" above the title) → optional `LinkTabs` (each tab is a URL) → content.
  The browser tab carries the page name too.
- **Foldable sections:** `SectionCard` is a card that folds to its title and count
  (Home, Tasks groups); `Disclosure` folds supporting detail (Reports). Choices are
  remembered; a section opens for the current route without saving that.
- **Customize:** Home lists its parts in a Customize menu so each person hides
  what they don't use.
- **Lists:** count cards double as filters (Sweatpals); quick toggles are chips
  with counts; a **Display** menu holds ordering, visible columns and rarely used
  switches (Linear). Selecting rows shows a centered bar with bulk actions.
- **Tables:** hairline rows, readable header, whole row opens the record's Sheet.
  People lists may show gradient avatars; other tables use text identities.
- **Badges and label chips:** tinted with their status color, medium weight, no
  outline (Sweatpals).
- **Stat cards and strips:** `StatCard` for figures you click (an arrow means it
  opens a page; filter cards carry none); `StatStrip` for supporting figures side by
  side with hairlines, no boxes (Sweatpals overview).
- **Buttons:** one primary per area; `soft` lavender pills for quick actions next to
  the content (Revolut); `secondary` is gray-filled in light and outlined in dark.
- **Assistant:** a floating panel on every page (bottom right, ⌘J) with the
  conversation title, history, new chat, expand and close. It starts with three
  questions that fit the current page, shows "Thinking…" with the step it is on,
  then "Worked for N seconds" you can expand. Answers are plain text with tables,
  charts, client chips and action pills; copy and feedback sit under each answer.
  Expanding opens `/assistant` (Linear's layout); actions that leave the page keep
  the conversation in the panel.
- **Sheet:** right panel inset 8px from the edges, eyebrow + title, actions, details as label/value rows.
- **Settings:** Settings replaces the sidebar with a searchable list of sections;
  rounded section cards with label and description on the left, value on the right, "Edit ›";
  a save bar appears only when something changed.
- **Small screens:** navigation drawer, wrapping actions and segmented controls, stacked client details, contained table scrolling, the assistant as a near-full-screen panel, and bounded modal/sheet widths.
- **Empty states:** one glyph, a plain sentence, the one action that fills it.

## Motion

Following Emil Kowalski's skills (`emil-design-eng`, `animate`, `review-animations`):

- Ask first: should it animate? ⌘K, ⌘J, `[`, navigation and tab switches: **no
  animation**. They happen dozens of times a day, and keyboard actions are
  always instant (including closing the assistant with Escape).
- Curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for enter/exit,
  `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement,
  `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for sheets, `linear` only for
  constant motion (the "Thinking…" sweep). Never `ease-in`.
- Durations: press 160ms, tooltips 125ms, popovers 180ms, folding sections
  180ms in / 140ms out, the assistant panel 220ms in / 150ms out, modals 220ms,
  sheets 260ms in / 240ms out. Exits faster than entrances.
- Press feedback `scale(0.97)` on everything pressable (`.press`).
- Popovers grow from their trigger (`transform-origin: var(--transform-origin)`);
  the assistant panel grows from the launcher in the bottom-right corner; modals
  scale from center from 0.96, never from 0.
- Folding a short list (sidebar sections, Home cards, Tasks groups, the reasoning
  trace) animates height and opacity, Base UI's `--collapsible-panel-height`; heavy
  report disclosures stay instant.
- A new answer arrives as a short cascade (6px rise, 50ms apart, at most 4 steps);
  reopening an old conversation shows it as it is.
- Tooltips: delay on the first, instant for neighbors.
- Numbers that change in place use NumberFlow (Home revenue scrub, totals).
- Charts don't animate in; a new dataset fades (200ms).
- Delight only for rare moments: sign-up steps slide in, the success check draws once.
- `prefers-reduced-motion`: movement removed, fades kept; folding is instant; the
  shimmer stops; busy pulses stop. No animated sidebar width.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4 (tokens via `@theme`), Base UI
primitives (accessible dialogs, menus, selects, tabs, collapsibles), cmdk (⌘K),
Sonner (toasts), NumberFlow (animated numbers), Motion (the assistant panel's
enter and exit), Hugeicons (stroke rounded), Zustand (state).

## Taking it to Figma

- Token names match Figma variable names one to one (`bg`, `surface`, `fill`,
  `fg`, `muted`, `accent`…), with Light and Dark modes.
- Screens can be captured from the running prototype into editable Figma layers
  with Figma's HTML-to-design capture (the Figma connector can do this per route).
- Components in `src/components/ui` are the component list to build in Figma.
