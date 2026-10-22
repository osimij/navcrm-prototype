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
