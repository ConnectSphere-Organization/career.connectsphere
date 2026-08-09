# 10 — UI Parity Map

The active visual source is the rendered MERN application, not JSX class names alone.

## Foundations

- Fonts: DM Sans body and Outfit headings, dynamically loaded in `src/main.jsx`.
- Primary: emerald `#059669`; hover `#047857`; soft `#ecfdf5`.
- Heading `#0f172a`; body `#475569`; muted `#64748b`; border `#e2e8f0`; canvas `#f8fafc`; white surfaces.
- Active primitives in `src/index.css`: page/content containers, headers, cards, buttons, inputs, table shell, modal panel/backdrop and empty states.
- Radius/shadow/spacing must be captured from computed rendering.

## Critical styling caveat

Many pages retain dark/lime classes, but `src/index.css` applies broad `!important` compatibility selectors and Tailwind aliases map semantic “black/yellow/lime” names to white/emerald. Therefore class-level translation is insufficient. Capture computed styles and screenshots before rebuilding. `src/App.css` is mostly legacy/unrouted and should not be treated as active without runtime proof.

## Layout map

| Surface           | Desktop                                      | Mobile/tablet                                              | Required states                                              |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Global navigation | Fixed top, desktop links, user menu/badge    | Fixed top plus bottom nav below `md`, More menu, safe-area | Anonymous and each role/permission combination               |
| Home              | Wide hero and multi-column sections          | Stacked sections/cards                                     | Reviews loading/error/empty/carousel                         |
| Jobs              | Inline search/filter/sort and staff controls | Bottom-sheet filters and stacked cards                     | Skeleton, empty, applied/status, delete modal                |
| Apply             | Four-step form/grids                         | Single-column inputs; stepper can become cramped           | Parsing/upload/loading/errors/CAPTCHA/questions              |
| Admin pages       | Cards plus wide tables                       | Horizontal-scroll tables; several modal risks              | Empty/loading/error/page/filter/actions                      |
| Offer acceptance  | Multi-step summary/forms                     | Single-column fields                                       | Initial loading currently blank; accept/reject/error/success |
| Documents         | Tabbed forms/lists/modal details             | Stacked forms, scroll-safe tables/dialogs                  | PDF/download/email/upload/extension states                   |

## Responsive validation widths

- 375px: bottom navigation, mobile filter sheet, no clipped stepper/dialog/table actions, keyboard-safe forms.
- 768px: exact nav breakpoint, tablet forms/tables/modals.
- 1024px: small desktop dashboard and admin workflows.
- 1440px: max-width alignment, grid density and large-data behavior.

## Animation parity

Existing CSS/Framer Motion includes fade/scale/slide, review carousel, viewport reveal, card stagger and hover transforms. Preserve meaningful timings/interactions with Motion; do not add decoration. Honor `prefers-reduced-motion` as source CSS does.

## Component replacement guidance

- Radix/shadcn Dialog/AlertDialog/Dropdown/Tabs/Select/Table/Form primitives, customized to source tokens.
- Lucide where equivalent; preserve meaning and accessible labels rather than icon-package implementation.
- Replace native alert/confirm/prompt with accessible dialogs while matching decisions.
- Explicit class maps instead of runtime-generated Tailwind classes.

## Visual proof

For each route/state/role, capture legacy and target screenshots at all four widths with deterministic data and animations disabled. Use stable masks only for dates/IDs and document every mask. A feature remains IMPLEMENTED—not VERIFIED—until interaction, content, responsive and visual thresholds pass.
