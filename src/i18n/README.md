# Interface languages

English and Russian share the same application state. `useLanguage()` subscribes
without remounting the page; the preference persists as `navcrm-language` and
sets the document language. The sign-in header, profile menu and profile settings
use the same preference.

`ru.json` contains reviewed English-to-Russian presentation text, including
whole sentences and interpolated messages. Brand names, API identifiers and
personal names can deliberately retain their spelling. `ru-context.json` resolves
terms whose meaning changes by section (for example a cash-register receipt vs
an inventory receipt).

The Vite pre-transform in `scripts/i18n-transform.mjs` instruments TSX in memory.
It translates rendered text and display attributes, subscribes components to
language changes, and localizes toast content and text search. It does not rewrite
existing source components, IDs, routing, event handlers, stored objects or input
values. Inline React elements remain intact in translated sentences. Use
`translate="no"` on an element when its content must keep its original language.
Seeded editable text is localized explicitly at initialization; client-language
fields keep the language selected in their own editor.

Number/date/duration/count formatting lives in `src/lib/format.ts`. Russian
one/few/many counts use `Intl.PluralRules`. A translated sentence can use a slot
such as `{0|# день|# дня|# дней}`; `#` retains the original interpolated value.

Run `npm run check:i18n` after changing interface text. It extracts TSX text,
display attributes, sentence templates, data labels and user-facing conditional
branches, then reports missing catalog entries in
`/tmp/navcrm-missing-translations.json`. Run `npm run test:i18n` for rendering,
interpolation, context, search, formatting and source-transform checks.

Pereval is self-hosted in WOFF2 with optical sizing and the weight/width axes
preserved. Its typography overrides live separately in `styles/typography.css`.
