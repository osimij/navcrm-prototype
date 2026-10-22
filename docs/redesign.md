# Interface redesign

## Requested outcome

Redesign the signed-in NavCRM prototype so it feels lighter and easier to navigate in English and Russian, with expandable detail instead of every panel being visible at once. Keep Inter and the existing blue accent. Preserve the prototype's working workflows.

## Reference decisions

- Sweatpals: near-black canvas, neutral charcoal cards, quiet dividers, distinct raised overlays. User image: member list, member profile, membership empty state, transaction list. Reference [profile](https://mobbin.com/screens/d3913d86-5569-4c67-9ad8-1be898fca86d), [overview](https://mobbin.com/screens/50fbe150-69d2-422f-8a9c-c2ce539afc4f), [date picker](https://mobbin.com/screens/719293ca-1a8e-4c05-a7bb-7e4d33b53258).
- Revolut: pale neutral canvas, white rounded cards, restrained secondary actions, clear detail hierarchy. Reference [accounts](https://mobbin.com/screens/1a949e12-a0cc-489e-b194-ca0a0787978f), [cards](https://mobbin.com/screens/fd272e80-ed27-4fcd-b643-5a1f66dee8ba), [detail panel](https://mobbin.com/screens/54386f9c-47e1-472f-a176-900358bda9f9), [confirmation](https://mobbin.com/screens/5c0d7356-c41f-4c45-8acf-301018241adc).
- Linear: collapsible navigation groups, compact contextual tools, centered chat composer, conversation history on demand, grouped data. Reference [chat start](https://mobbin.com/screens/d53cf5b8-48f8-4e02-a278-ca45b2d9124a), [conversation](https://mobbin.com/screens/afa62cbe-083b-4234-ad90-8a689d8e28cd), [issues](https://mobbin.com/screens/46088879-314c-405c-88b5-eb7820c05efb).
- Mercury: retain readable financial figures, clear tables, contextual detail sheets, and purposeful actions. Reference [dashboard](https://mobbin.com/screens/a0539f69-cca9-4645-8f3d-aa59048efdd1), [transaction](https://mobbin.com/screens/b315af47-c926-4be0-8e5f-182a270d2430).
- Emil Kowalski: reuse Base UI and existing motion tokens; frequent navigation is instant, overlay motion uses transform/opacity, reduced motion and keyboard behavior are verified.

These are visual and interaction references, not copied product flows. Marketing and onboarding screens are outside this redesign.

## Implementation and verification checklist

- [x] Theme tokens and shared surfaces: pale light canvas and white cards; neutral near-black dark theme with raised overlays. Existing light/dark blue accent tokens match the starting commit exactly.
- [x] Navigation: saved 248px/72px expanded/compact sidebar, expandable groups and compact flyouts, contextual breadcrumbs, mobile drawer, searchable settings in both languages. Automatic opening of the current route's group does not overwrite saved preferences.
- [x] Home: revenue and next arrivals first; four upcoming visits, three attention items with an expansion control, supporting business metrics in a saved disclosure.
- [x] Assistant: centered starting composer, three suggested intents, additional ideas on demand, focused conversation, searchable history sheet, individual drafts preserved while switching conversations.
- [x] Dense workspaces: inbox client context moved into a sheet; reports grouped by purpose; client filters consolidated into a select; mobile client rows stack category/debt details; shared headers, segmented controls and footers wrap long labels.
- [x] Russian and English: 4,598/4,598 extracted translation keys covered. Live language changes preserve entered chat text and update displayed replies. Russian search, labels, counts and narrow layouts checked.
- [x] Interaction review: keyboard focus and Escape return checked in navigation, the visit modal and inbox context sheet; collapse choices checked after reload. Reduced motion verified in source. Responsive controls checked in the browser; no physical-device touch test is claimed.
- [x] Verification: production build, 20 automated tests, translation coverage, three complete route passes, targeted behavior checks and saved screenshots.

## Current evidence

Initial working tree clean at `7a856e4`. Existing app verified running at `http://127.0.0.1:5180`. The reference study includes dashboards, lists, member/transaction details, overlays, empty states, and AI conversations across the four products; it does not claim an exhaustive review of every Mobbin screen.

The study covered approximately 31 screenshots. Additional close comparisons included Sweatpals [member list](https://mobbin.com/screens/606b7479-114b-4608-894a-17ca55a5ad3a), [status filter](https://mobbin.com/screens/0e134470-6887-49ce-8e9c-9a773caf7eca), and [check-in list](https://mobbin.com/screens/e30ab761-7c33-40a0-948a-e241b8ea9412); Revolut [language settings](https://mobbin.com/screens/e7353e93-13c6-4426-ad3d-b2db53a5b311), [date modal](https://mobbin.com/screens/ddf26e21-30a3-4d5e-b27e-ff767db0bc40), and [expiry modal](https://mobbin.com/screens/03bb423e-cbf1-443e-8b4e-d6d0355dcb1b).

## Motion review

Reviewed the changed motion against Emil Kowalski's [review skill](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/SKILL.md) and [standards](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md).

| Before | After | Why |
| --- | --- | --- |
| Sheet entry 420ms | 260ms entry / 240ms exit (`src/styles/index.css:324`) | Keeps an occasional overlay responsive. |
| Figure transitions 520ms | 240ms movement / 160ms opacity (`src/components/ui/misc.tsx:79`) | Faster feedback; keyboard changes are instant. |
| Moving tab indicators, printer width animation, smooth chat scrolling | Instant selection, progress sizing and chat positioning | Removes repeated movement from frequent work. |
| Keyboard-triggered overlay and message movement | Transition suppression (`src/styles/index.css:439`) and keyboard checks in figure/message rendering | Keyboard actions should respond immediately. |
| Position changes under reduced motion | Opacity-only overlays; no switch, checkbox or choice movement (`src/styles/index.css:399`, `src/components/ui/controls.tsx:38`) | Retains state feedback with less movement. |

Performance: sidebar and disclosures change layout once, without a width/height animation. New overlay movement uses transform/opacity. Existing small color feedback remains. No real-device frame-rate recording was performed; this review does not establish a 60/120fps performance result.

Accessibility: shared Base UI overlays retain focus management and Escape behavior. Popovers retain trigger-relative origins; centered modals keep their centered origin. Keyboard overlay checks observed zero transition duration. Reduced-motion behavior was checked in source, not with an operating-system preference change.

**Approve — the changed motion meets the reviewed timing, frequency, origin and reduced-motion criteria.** This verdict covers this diff, not every pre-existing animation or a physical-device performance audit.

## Verification results

Verified 22 October 2026. The viewport widths below are actual CSS widths, measured in the page after compensating for the preview's zoom.

| Theme / language | Width | Routes | Remaining layout issues |
| --- | ---: | ---: | ---: |
| Dark / Russian | 389px | 87 | 0 |
| Light / English | 389px | 87 | 0 |
| Dark / Russian | 1280px | 87 | 0 |

Each pass checked that the page rendered, main content stayed within the viewport, and visible headers, sections and stat cards did not overflow. Six Russian phone-layout issues were corrected and rechecked. These checks do not exercise every form state. Route list and results: [redesign-verification.json](redesign-verification.json).

Targeted browser checks:

- Sidebar and dashboard expansion choices survive reload; route-driven navigation openings stay temporary.
- Settings search finds Russian payment settings inside otherwise collapsed groups.
- Assistant sends a question, displays the answer, opens history, and restores each conversation's draft. A completed answer stays in its original conversation after switching chats.
- The new-visit modal and inbox context sheet fit a 389px viewport; Escape closes them and returns focus to their triggers.
- Client category filtering returns the matching rows; mobile client details remain readable.
- Russian and English can be switched live without losing typed text. No browser errors or warnings were captured in the final preview.

Final commands passed: `npm run build`, `npm run test:workspace` (4 tests), `npm run test:i18n` (16 tests), `npm run check:i18n` (4,598 keys), and `git diff --check`. The build still reports the existing large-JavaScript-chunk warning; bundle splitting was outside this design change.

## Previews

- [Dark dashboard](screenshots/home-dark.png)
- [Light dashboard](screenshots/home-light.png)
- [Dark Assistant](screenshots/assistant-dark.png)

Inter and the previous sessions' committed fixes are retained.


## Follow-up review — 22 October 2026

The redesign draft was already present at the start of this follow-up. It was preserved and checked against a fresh sample of Sweatpals, Revolut, Linear and Mercury screens. This pass does not repeat or replace the 87-route audits above.

Additional fixes:

- Multiline user questions preserve line breaks. Long reference numbers and URLs wrap inside the message without widening the conversation. At 390px, the conversation remains 390px wide; wider data tables scroll within their own containers.
- Conversation titles use the first line, capped at 72 Unicode characters. History rows use at most two lines. The full question remains intact in the conversation.
- Typed questions and their titles keep their original wording when the interface language changes. Suggested prompts and report questions start in the current language. Replies continue to follow the interface language.
- The conversation is exposed as a live log, marked busy while a reply is pending. Screen-reader announcements have not been tested with a physical assistive-technology session.

Additional motion review:

| Before | After | Why |
| --- | --- | --- |
| Sidebar setup progress animated width for 500ms | Instant progress update (`src/shell/sidebar.tsx:135`) | Removes unnecessary layout animation from persistent navigation. |
| Import and holiday chevrons rotated under reduced motion | Rotation transitions disabled for reduced motion (`src/pages/clients/import.tsx:165`, `src/pages/settings/pages/holidays.tsx:123`) | Keeps the open/closed state clear without movement. |

**Approve — the additional motion changes remove unnecessary movement and respect reduced-motion preferences.** No device frame-rate measurement is claimed.

Fresh browser checks: a 240-digit reference and multiline Russian question at desktop and 390px widths; compact history; Escape focus return from history and the new-visit modal; literal English user wording inside the Russian interface; live English/Russian switching; localized suggested questions; compact-sidebar flyout navigation to Reports; both dashboard themes. The temporary viewport override was cleared and the original language, theme and sidebar size restored.

Fresh command checks: production build, 4 workspace tests, 16 localization tests, 4,598 translated keys, and diff whitespace validation passed. The pre-existing bundle-size warning remains.

Additional screenshots: [light with compact navigation](screenshots/home-light-compact.png), [dark with compact navigation](screenshots/home-dark-compact.png).


## Redesign round 2 — Sweatpals, Revolut, Linear — 22 October 2026

### Requested outcome

The interface still felt heavy and directionless: too much on screen at once, no
clear sense of where you are or where to go. This round takes Sweatpals' dark
mode (canvas, cards, pills) and Revolut's light mode (canvas, cards, modals) as
the visual system, keeps the NavCRM accent, and takes Linear as the model for
structure and for the AI assistant. Mercury stays in mind for figures. Motion
follows Emil Kowalski's skills ([repository](https://github.com/emilkowalski/skills)).
Onboarding and marketing screens are out of scope.

### What the references contributed

| Reference | Taken | Where it shows |
| --- | --- | --- |
| Sweatpals ([overview](https://mobbin.com/screens/50fbe150-69d2-422f-8a9c-c2ce539afc4f), [date picker](https://mobbin.com/screens/1be58c08-c534-4160-b488-56f22983d027), [create menu](https://mobbin.com/screens/42de3d5a-e6f2-4b4c-91dd-10e01b5dd1ae), the member screens you sent) | Sampled colors: #000 canvas and sidebar with a hairline, #111 cards, #1C–#23 pills and inputs, white for the selected toggle; outlined secondary pills; tinted status pills; gradient initials; count cards that filter; figures split by hairlines; a round handle on the sidebar edge | Dark theme tokens, buttons, badges, avatars, Clients count cards, `StatStrip`, sidebar handle |
| Revolut ([home](https://mobbin.com/screens/1a949e12-a0cc-489e-b194-ca0a0787978f), [transaction sheet](https://mobbin.com/screens/cc6213e1-c3bd-4197-b8ab-b6686ff9c553), [note modal](https://mobbin.com/screens/b71f73a6-0a06-4e4e-9390-5aef7cd8f3e7), [confirm dialog](https://mobbin.com/screens/eaf49a08-f55d-46a5-835a-f19beac2e6d9)) | Sampled colors: #F7F7F7 canvas shared by the sidebar, white borderless cards, #EBECF2-family filled inputs, lavender soft pills, white pill for the current nav item and tab | Light theme tokens, `soft` buttons, Home action pills, modal surfaces |
| Linear ([chat start](https://mobbin.com/screens/d53cf5b8-48f8-4e02-a278-ca45b2d9124a), [floating chat](https://mobbin.com/screens/51c2bd60-f22d-4879-8c28-c5800ac1f4b6), [thinking](https://mobbin.com/screens/b56b197d-7ef0-41b7-9e56-cc23460ffdc8), [history](https://mobbin.com/screens/d97ce080-3de7-49f3-aaff-44120e6f5620), [grouped list](https://mobbin.com/screens/be6c4ee4-aa93-42b4-89b3-dcfc8386f022), [display options](https://mobbin.com/screens/94bb4d3b-a8e3-41e8-b8f1-b82d1f904b03)) | Labelled sidebar sections that fold; search and the assistant at the top of the sidebar; a chat you can open anywhere and expand; "Thinking…" with the current step, then "Worked for N seconds"; history grouped by day with ages; dismissible examples; groups that fold to a title and count; a Display menu; a centered selection bar | Sidebar, assistant panel and page, Tasks groups, Home sections, Clients Display menu |
| Mercury ([dashboard](https://mobbin.com/screens/dbbf7fd1-24e8-4494-9c0c-27007652c7e5), [conversation panel](https://mobbin.com/screens/44e81214-fd5e-4ac0-acfa-17ac94a9455c)) | Regular-weight big figures, a soft area under the balance chart, Customize on the dashboard, the AI as a bottom-right panel | Home revenue figure and chart, Customize |

### Information architecture

- **No top bar.** It repeated the page name and held five icons. Search (⌘K),
  Ask AI (⌘J) and notifications moved to the top of the sidebar; your account,
  sync status and hide amounts moved to its bottom. Phones get a slim bar.
- **Every destination is visible.** Operations, Growth and Money are labelled
  sections that start open; fold any of them and it stays folded. The icon rail
  (64px, via the edge handle or `[`) lists every destination with separators
  instead of hiding groups behind flyouts.
- **Where am I.** Compact semibold page titles, "‹ Parent" above nested pages,
  the current item as a white pill (light) or a tint (dark), and the page name in
  the browser tab.
- **The assistant is a panel, not a destination.** It opens over any page,
  keeps the conversation as you move (answer actions that open a report keep the
  panel), and expands to `/assistant`. ⌘K and the report "Ask AI" buttons ask in
  the panel instead of navigating away.
- **Show less by default.** Home: actions first, period switch on the revenue
  card, Needs attention and Coming up fold, Business performance starts folded,
  Customize hides parts. Clients: five columns by default, the rest in Display.
  Tasks: due-date groups fold.

### Motion review

Reviewed against Emil Kowalski's [review standards](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/STANDARDS.md)
and [recipes](https://github.com/emilkowalski/skills/blob/main/skills/animate/RECIPES.md).

| Before | After | Why |
| --- | --- | --- |
| Folding panels snapped (`display: none`) | Height + opacity 180ms in / 140ms out, `--ease-out`, content riding the bottom edge (`src/styles/index.css:486`) | Accordion recipe: state indication for short lists; height is the one sanctioned layout property and stays short. Heavy report disclosures keep the instant snap. |
| Assistant page only, no panel | Panel enters 220ms / exits 150ms from `translateY(10px) scale(0.97)`, full transform string, origin at the launcher (`src/pages/assistant/dock.tsx:104`, `:142`) | Occasional overlay, origin-aware, hardware-accelerated in Motion, exit faster than entry. |
| Exit animation decided at open time | `AnimatePresence custom` passes the current input to the exit (`src/pages/assistant/dock.tsx:130`) | ⌘J opens and Escape closes instantly: keyboard actions never animate. |
| Answers appeared all at once | 6px rise + fade, 260ms, 50ms apart, capped at four steps (`src/styles/index.css:502`) | Stagger 30–80ms for an occasional group entrance; never blocks interaction. |
| Every reopened conversation replayed the cascade | Only answers that arrived in the last 1.5s animate (`src/pages/assistant/chat.tsx:124`, `:292`) | Browsing history is frequent; old content should not move. |
| Three pulsing dots while waiting | "Thinking…" with a 1.6s linear light sweep and the current step (`src/styles/index.css:509`) | Constant motion uses `linear`; the step text explains the wait. |
| Selected segment changed color instantly with a shadow ring | 150ms `ease` color change, no movement (`src/components/ui/tabs.tsx:94`) | Hover/color changes use `ease`; frequent controls get near-imperceptible motion only. |
| — | Caret rotation 150ms `--ease-out` in sync with the panel it controls (`src/shell/sidebar.tsx:202`) | Same curve as the height change, so the two read as one motion. |
| Bulk bar used the shared `rise` keyframe | `@starting-style` transition on `transform`, leaving Tailwind's `translate` free for centering (`src/styles/index.css:526`) | Transitions retarget when the bar re-renders; keyframes restart. |
| — | Sidebar width changes instantly (`src/shell/app-shell.tsx:71`) | Animating width would re-lay out the whole page every frame. |
| — | Reduced motion: no height animation, shimmer stops, entries fade only (`src/styles/index.css:555`) | Fewer and gentler, not zero. |

Performance notes: the dock and answer entrances animate `transform` and `opacity`
only. The shimmer animates `background-position` on one short line of text (a
small paint per frame). Collapsing animates `height` on short lists. No real-device
frame recording was made, so no 60/120fps claim is made.

**Approve — the new motion is justified by state change, origin or feedback, stays
under 300ms for UI, respects keyboard and reduced-motion preferences, and avoids
animating frequent navigation.**

### Verification

- `npm run build` passed (the existing large-chunk warning remains);
  `npm run typecheck` passed.
- `npm run test:workspace` 4/4 and `npm run test:i18n` 16/16 passed;
  `npm run check:i18n` covers 4,648/4,648 keys (72 new Russian strings, plus a
  Russian plural for "second").
- Route audits on the production build (`vite preview`), 87 routes each,
  measuring page overflow and header/section/stat-card overflow outside
  intentional horizontal scrollers, with screenshots: dark/English 1440px,
  light/English 1440px, dark/Russian 390px, light/English 390px. Remaining layout
  issues: 0 in each. No console errors.
- Browser interaction checks (19/19): folding a sidebar section survives reload;
  `[` collapses to a 64px rail that still lists Laboratory and expands back; Ctrl+J
  opens the panel with focus in the composer and Escape closes it; Escape inside
  the history popover closes only the popover; closing the panel returns focus to
  the launcher; Customize hides the revenue card; Display hides the Next visit
  column; the VIP count card filters and shows as selected; selecting a row shows
  the selection bar centered on the content area.
- Accessibility fixes found in review: the history delete button is reachable from
  the keyboard (revealed by opacity, not `display: none`); shortcut hints are hidden
  from button names; focus returns to where it was when the panel closes.
- Assistant: asked from the Reports page, saw the reasoning step, the answer with
  a table and actions, expanded to the full page, and opened grouped history.

Screenshots (Russian interface) were replaced with this round's design:
[Home, dark](screenshots/home-dark.png), [Home, light](screenshots/home-light.png),
[compact sidebar, dark](screenshots/home-dark-compact.png),
[compact sidebar, light](screenshots/home-light-compact.png),
[Clients, dark](screenshots/clients-dark.png), [Clients, light](screenshots/clients-light.png),
[Tasks, light](screenshots/tasks-light.png), [Assistant page](screenshots/assistant-dark.png),
[Assistant panel over Reports](screenshots/assistant-panel-dark.png).
