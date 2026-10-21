# NavCRM — interface design notes

A working prototype of the NavCRM web app (signed-out and signed-in), built to be
shown in a presentation and then iterated in Figma. Visual direction: Mercury's
web app, plus the wallet card from the reference shot (gray action tiles, big
numbers that count between values, a chart you can scrub).

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
| Home | `/` | Scrubbable revenue chart where the number counts to each point, forecast from bookings, arrivals list, KPI tiles, actionable "Needs attention" |
| Calendar | `/calendar` | Day (masters as columns), Week, List, Rooms; drag to reschedule with rule checks; visit sheet with one next step through to checkout; waiting list |
| Clients | `/clients`, `/segments`, `/import` | Search by name or last 4 digits, filter chips, bulk actions, client profile sheet, segment builder with live count, import with migration guides |
| Register | `/pos/*` | Sale with gray item tiles and animated total, promo codes, bonuses, split payment; receipts and refunds; shift close by banknote count; debts, memberships, certificates, expenses, printer |
| Inbox | `/inbox` | Telegram / WhatsApp / Instagram in one list, assistant hand-off, client context panel |
| Tasks | `/tasks` | Grouped by due date, auto-created tasks labelled by source |
| Inventory | `/inventory/*` | Products, stock, documents (receipt, write-off, transfer, stocktake), tech cards, supplier orders |
| Laboratory | `/lab/*` | Orders with result entry and range flags, new order page, test catalog, templates, partner labs, reports |
| Campaigns | `/campaigns/*` | List judged by "came back within 14 days", 4-step builder with live Telegram preview, discount offers and cards |
| Instagram & maps | `/channels/*` | Where bookings come from, platform setup, review replies, portfolio |
| Assistant | `/assistant` | Answers from live data with actions that do something |
| Reports | `/reports/*` | Hub, revenue, cash & profit, receivables, load heatmap, clients, report builder |
| Payroll, Sublease | `/payroll/*`, `/sublease` | Periods with locked approval, rule-based schemes, timesheet; tenant rent and money held for tenants |
| My earnings | `/me` | Time clock, preliminary accruals, payslips |
| Settings | `/settings/*` | 29 pages in Mercury's settings layout |

Global: ⌘K search (clients by name or phone digits, pages, actions, ask the
assistant), notifications, sync status, hide amounts, light/dark/system theme.

**Prototype limits:** UI copy is English (the language switch is there; Tajik and
Russian aren't wired). Data lives in memory and resets on reload (theme, sign-in
and "hide amounts" persist). A few outward actions (printing, sending, exports)
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
| 16 sidebar items in 5 groups, Settings below the fold | Daily screens unlabeled at the top; Operations, Growth, Money groups; Settings pinned at the bottom | Shorter scan, nothing important hidden |
| Settings is a second sidebar inside the page | Settings **replaces** the sidebar (Mercury) with "‹ Settings" to go back | Full content width, no two-level sidebar |
| "My earnings" among company money tools | Moved to the profile menu | It's personal, not company money |
| Ask AI as a dashboard modal, a page, and a button on every report | One Assistant page; ⌘K and reports hand it the question | One mental model |
| "Reports" in the sidebar and as a dashboard button | Only in the sidebar | No duplicate entry points |
| "Connect Telegram" offered in 4 places | Lives in Settings → Telegram bot; elsewhere it's a status line | Less nagging |
| Modal vs drawer vs full page chosen ad hoc | Modal for quick create/edit, Sheet for a record's details, full page for long or multi-step work | Predictable |
| Dashboard tiles partly clickable | Every KPI tile is a link, same affordance (↗) | Consistency |
| Staff without a name shown as a phone number | "Invited · +992 …" with "Resend invite" | Reads as a person, not a bug |
| Separate sync page | Sync status in the top bar, details in a popover | Visible trust without a page |
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

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | #FFFFFF | #0F0F12 | Page |
| `--bg-sidebar` | #FAFAFB | #0B0B0E | Sidebar |
| `--surface` | #FFFFFF | #16161A | Cards |
| `--surface-raised` | #FFFFFF | #1C1C21 | Popovers, modals, sheets |
| `--fill` | #F4F4F6 | #1E1E23 | Tiles, inputs, secondary buttons |
| `--fill-hover` / `--fill-active` | #EDEDF0 / #E6E6EA | #26262C / #2D2D34 | States |
| `--border` / `--border-strong` | #EAEAEE / #D9D9DF | #25252B / #34343C | Hairlines |
| `--fg` | #0B0B10 | #F3F3F5 | Primary text |
| `--muted` | #5E5E68 | #A2A2AC | Secondary text |
| `--faint` | #787883 | #7C7C87 | Tertiary text, placeholders |
| `--accent` | **#0011FF** | **#4F5DFF** | Primary buttons, focus, selection |
| `--accent-fg` | #0011FF | #808BFF | Accent text and icons |
| `--accent-soft` | #EEF0FF | accent 16% | Selected backgrounds |
| `--positive` / `--negative` / `--warning` | #0F8A4F / #D92D20 / #B25E09 | #3CCB7F / #FF6B5E / #F5A524 | Status |

Dark accent: `#0011FF` on near-black fails contrast, so dark mode keeps the same
hue but lighter: `#4F5DFF` for filled buttons (4.8:1 with white text) and
`#808BFF` for accent text (over 6:1 on the background).

Staff and calendar labels: `--c-indigo, sky, teal, green, amber, orange, rose,
violet, slate`; soft fills are mixed per theme (`.label-soft`).

**Type:** Inter (variable, optical sizing on; self-hosted, works offline).

| Token | Size / line | Letter-spacing | Use |
| --- | --- | --- | --- |
| `text-2xs` | 11/14 | 0 | Tiny badges |
| `text-xs` | 12/16 | 0 | Labels, table headers |
| `text-sm` | 13/18 | 0 | Secondary text |
| `text-base` | 14/20 | 0 | Body, tables, buttons |
| `text-md` | 15/22 | 0 | Large inputs |
| `text-lg` | 16/24 | 0 | Card and section titles |
| `text-xl` | 20/28 | −0.01em | Small figures |
| `text-2xl`–`text-6xl` | 24–64 | −0.015em | Page titles (28, regular weight), big numbers |

Weights: 400 for titles and numbers (Mercury), 500 for emphasis. No 600/700
except initials.

**Radius:** inputs 10, tiles 12, cards 16, modals 24, buttons and chips pill.

## Patterns

- **Page:** `PageHeader` (title, subtitle, one primary action) → optional `LinkTabs`
  (each tab is a URL) → content.
- **Tables:** hairline rows, quiet header, whole row opens the record's Sheet.
- **Sheet:** right panel inset 8px from the edges, eyebrow + title, actions, details as label/value rows.
- **Settings:** label and description on the left, value on the right, "Edit ›";
  a save bar appears only when something changed.
- **Empty states:** say what will appear and offer the one action that fills it.

## Motion

Following Emil Kowalski's design-engineering rules:

- Ask first: should it animate? ⌘K, navigation, tab switches inside lists: **no
  animation**. They happen dozens of times a day.
- Curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for enter/exit,
  `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement,
  `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for sheets. Never `ease-in`.
- Durations: press 160ms, tooltips 125ms, popovers 180ms, modals 220ms, sheets
  420ms in / 240ms out. Exits faster than entrances.
- Press feedback `scale(0.97)` on everything pressable (`.press`).
- Popovers grow from their trigger (`transform-origin: var(--transform-origin)`);
  modals scale from center from 0.96, never from 0.
- Tooltips: delay on the first, instant for neighbors.
- Numbers that change in place use NumberFlow (Home revenue scrub, totals).
- Charts don't animate in; a new dataset fades (200ms).
- Delight only for rare moments: sign-up steps slide in, the success check draws once.
- `prefers-reduced-motion`: movement removed, fades kept.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4 (tokens via `@theme`), Base UI
primitives (accessible dialogs, menus, selects, tabs), cmdk (⌘K), Sonner (toasts),
NumberFlow (animated numbers), Hugeicons (stroke rounded), Zustand (state).

## Taking it to Figma

- Token names match Figma variable names one to one (`bg`, `surface`, `fill`,
  `fg`, `muted`, `accent`…), with Light and Dark modes.
- Screens can be captured from the running prototype into editable Figma layers
  with Figma's HTML-to-design capture (the Figma connector can do this per route).
- Components in `src/components/ui` are the component list to build in Figma.
