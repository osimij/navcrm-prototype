# NavCRM landing page

Local route: `/landing` (the existing CRM routes retain their behavior).

## Direction

A warm editorial page about the daily rhythm of a service business. Off-white paper, ink, muted olive and a pale green section; large Sadaf headings; a human photograph beside a working schedule preview. The page is authored in Russian and stays Russian independently of the CRM language setting. Sign-in and sign-up links select Russian in the existing prototype.

## References reviewed with Mobbin MCP

- [Altitude: quiet hierarchy and generous space](https://mobbin.com/sites/sections/55360ea6-42d4-4647-8988-184af2b11aa6)
- [Beside: practical product demonstration](https://mobbin.com/sites/sections/03f765e3-3432-4ac7-ab08-a240654f65db)
- [Beside: a whole system explained simply](https://mobbin.com/sites/sections/f343155a-ddb6-4225-b3fd-34179e696fb7)
- [Fresha: making the business calendar tangible](https://mobbin.com/sites/sections/1a5caa74-32a8-4a3b-93ab-99d14109ee2f)
- [Square: real-world context for business software](https://mobbin.com/sites/sections/45beb57e-8a4e-433d-a570-0f915672d6b5)
- [Zipline: selectable feature explanations](https://mobbin.com/sites/sections/9fff6104-d098-4039-a6c5-5f8521058cad)

These guided composition and pacing; no reference artwork was embedded.

## Typography

The supplied SadafGrotesk-VF.ttf was losslessly converted to `public/fonts/SadafGrotesk-VF.woff2` for web delivery.

- Headings: wdth 105, wght 500, opsz 72.
- Body: wdth 115, wght 450, opsz 48.
- Small illustrative UI uses the same font with smaller optical size for readability.

## Asset

`public/landing/salon-editorial.webp` was generated with the built-in ImageGen tool and encoded as WebP. The original generated image remains in the Codex image library.

Final prompt:

> Use case: photorealistic-natural. Asset type: editorial photograph for a thoughtful CRM landing page for small service businesses. Create a premium candid architectural lifestyle photograph of a working modern hair salon in Dushanbe, warm late morning sunlight, one Central Asian female hairstylist with dark hair wearing a simple oatmeal linen shirt working on the long dark hair of a seated female customer, viewed from behind and slightly to the side, human hands natural and realistic, no one looking at camera. Interior of light oak cabinetry, large rectangular mirror, off-white plaster walls, warm tobacco brown leather salon chair, a small leafy branch in ceramic vase. Composition: wide landscape 3:2 frame, subjects grouped slightly right of center, beautifully composed quiet airy interior, cropped cinematic detail, honest film photography not a stock photo, fine organic film grain, soft shadows and sun-washed golden olive tones, refined independent lifestyle magazine art direction. No text, no logos, no watermarks, no devices, no fake UI. Avoid pink, purple, excessive luxury, shiny plastic, staged smiles.

## Content and interaction

Product capabilities and tariff limits are based on DESIGN.md and the current settings/billing page. The page uses illustrative records and does not invent customer testimonials or performance statistics. All displayed metrics are labeled as example data. Calendar entries open a native accessible dialog; tabs support arrow keys; FAQ uses native disclosure controls; pricing expands to show all existing plans.

The page loads separately from the main CRM code. No new signup or payment backend was added.

## Validation

- Production TypeScript and Vite build.
- Existing localization catalog check and 16 localization tests.
- Existing 4 workspace tests.
- Browser checks of desktop layout, 390px mobile layout, menu, appointment details, feature tabs, pricing, FAQ, and Russian sign-up navigation.

## Private preview

Published URL: https://navcrm-rhythm.alisherfullh16k.chatgpt.site

Site project: `appgprj_6ad95c7d997481919d1af31d7aa206f0`

The deployment export and hosting manifest are retained at:
`/Users/osimij/.codex/visualizations/2026/10/22/01a1610a-d39f-79c1-825c-b9ea85e5908b/navcrm-site`.

This is a separate static export, so the original prototype repository and its Git history were not used as the hosted source repository. Refresh this export from a new production build for future publications, preserving its project ID. Its root opens the landing page for signed-out visitors.
