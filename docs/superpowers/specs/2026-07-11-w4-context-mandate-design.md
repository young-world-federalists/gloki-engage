# Wave 4 — Context restoration + mandate composition (design)

**Session:** S27 · **Date:** 2026-07-11 · **Branch:** `ui` · **Base HEAD:** `4a9b60d`
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 Wave 4 · **Class:** UI-only (no `src/services/demo/` change → **no `DEMO_VERSION` bump**)

## Goal (one sentence)
Give acted-on items their context back (the discussion and suggest pages SHOW the item being acted on), and compose the mandate actions/sections onto a coherent left edge with proper dark-surface elevation and progressive disclosure — without a long-scroll blow-up.

## Decisions locked with Eston (2026-07-11, recommend-then-confirm)
1. **4.7 mandate depth** → **inline-expand**: keep hero + commitments (articles) + turnout always open; collapse the indicators `<dl>` and the full adopter list behind inline toggles; move the verification PROSE into an `(i)` `InfoDisclosure` modal.
2. **ContextCard scope** → **title + body only** (dumb presentational; no badge/author/meta).
3. **4.6 dark elevation** → **raise the hero `MandateCard`** to `$dark-bg` (the campaign named the wrong cards — see corrected premises).
4. **§6 #7 open-full-item affordance** → **document the per-context difference** in DESIGN_SYSTEM.md (no code change).

## Corrected premises (vs HEAD `4a9b60d` — the S10–S26 re-grounding discipline)
- **4.2 already fixed by W1b.** `DiscussionStageView.module.scss .main` has no horizontal padding (only `padding-top: $spacing-lg`); `Container.module.scss .content` is `@include page-column` + single `padding-block: 0 $footer-clearance`. No double-padding, no doubled footer clearance. Title lives in `AppHeader` (header-gutter law). → **only confirm alignment; no SCSS change unless the preview shows drift.**
- **4.5 narrower than stated.** Only `MandateCard` (`.card`) and `MandateDocument` (`.document`) use `$spacing-xl`. `RatificationPanel .panel` is already `$spacing-lg`; `AdoptionFramework` has no outer card (its `.summary` = `$spacing-lg`, adopter `.card` = `$spacing-md $spacing-lg` → left edge already `$spacing-lg`). → **2 files change, not 4.**
- **4.6 named the wrong cards.** `MandateDocument .document` and `RatificationPanel .panel` are ALREADY `@include dark { background: $dark-bg }` (raised). The actually-flat card in dark is the hero `MandateCard` (`@include dark { background: $dark-surface }` = the page base). → **retarget to `MandateCard`.**
- **Dark-token naming is inverted:** `$dark-surface` `#0f172a` = page base; `$dark-bg` `#1e293b` = raised surface. "Raise to `$dark-bg`" = elevate above the page.
- **`get_details` sourcing confirmed.** Demo `demoContracts/initiative.ts:64` handles `get_details` → returns `s.details` (carries `title` + `description`). Both ContextCard bodies read through this existing seam method → UI-only. `ActivityCard` navigates to `/discussion` with **no** `initiative` state, so `get_details` is the primary source for the discussion body.

## Components & changes

### 1. New primitive — `ContextCard` (§5 rule 11)
**Files:** `src/components/shared/ContextCard.tsx`, `src/components/shared/ContextCard.module.scss`, export from `src/components/shared/index.ts`.

Dumb presentational card. Contract:
```ts
interface ContextCardProps {
  title?: string;      // optional heading (h2). Omitted when the page header already carries the title.
  body?: string;       // the summary/description. Line-clamped (~4 lines) — full text lives on the item's own page.
  ariaLabel?: string;  // accessible name for the <section> (e.g. "The problem under discussion").
  className?: string;
}
```
- Renders `<section className={styles.card} aria-label={ariaLabel}>` → optional `<h2 className={styles.title}>{title}</h2>` → `<p className={styles.body}>{body}</p>` (body clamped via `-webkit-line-clamp`).
- **Renders nothing** (returns `null`) when both `title` and `body` are empty — no orphaned empty box.
- Styling: bordered/tinted panel (tokens only: `$surface`/`$gray-*` light, `$dark-bg`/`$dark-border` dark), `$spacing-lg` padding, `$radius-lg`, hairline border. Reads as "the thing you're acting on." No interactivity.
- **Single-h1 safe:** the `<h2>` sits under the page's one `AppHeader` h1.

### 2. Discussion page context (4.1)
**Files:** `src/pages/collaboration/InitiativeView.tsx`, `src/components/collaboration/DiscussionStageView.tsx`.
- `InitiativeView`: add a `description` state alongside `title`; initialize from `location.state.initiative?.description`; in the existing `get_details` effect, also `setDescription(details.description)` when present. Pass `description` to `DiscussionStageView`.
- `DiscussionStageView`: add `description?: string` prop. Render `<ContextCard body={description} ariaLabel={t('context.discussion.aria','The problem under discussion')} />` **between the `AppHeader` and the thread**, inside `.content`/`.main` (top of the column, above the ErrorBoundary/thread). **Body-only** (h1 already = title, S23 → no double-title). When `description` is absent, ContextCard renders null → unchanged layout.

### 3. Suggest-to-author context (4.3)
**File:** `src/components/collaboration/SuggestionDmView.tsx`.
- Self-fetch the problem: on mount (have `serverUrl/publicKey/initiativeId`), `contractRead({contractId: initiativeId, method:{name:'get_details',values:{}}})` → capture `title` + `description` into local state (cancellation-safe, `.catch(()=>{})`). Mirrors `InitiativeView`'s title fetch. No prop-threading through `ProblemEngage`.
- Render `<ContextCard title={problemTitle} body={problemDescription} ariaLabel={t('context.suggest.aria','The problem you are suggesting on')} />` **pinned below the `AppHeader`, above the scrollable `.thread`** (stays visible while composing). Header h1 = author name, so ContextCard carries **title + body**.

### 4. Mandate hero — actions on one row + inset + elevation (4.4 / 4.5 / 4.6)
**Files:** `src/components/mandate/MandateCard.tsx`, `src/components/mandate/MandateCard.module.scss`.
- **4.4:** drop `fullWidth`; set both actions `size="md"` (44px, meets touch floor, cleaner one-row than `lg`). Add classNames `styles.supportBtn` (primary) / `styles.shareBtn` (secondary). SCSS `.actions{display:flex;gap:$spacing-sm;flex-wrap:nowrap}`, `.supportBtn{flex:1}`, `.shareBtn{flex:0 0 auto}`. **Verify 360px** incl. fr "Soutenir ce mandat"; if fr overflows, fall back to icon-only Share (aria-label already present).
- **4.5:** `.card` padding `$spacing-xl → $spacing-lg`.
- **4.6:** `@include dark { background: $dark-surface → $dark-bg }` (raise the hero to match document/ratification).

### 5. Mandate document — inset + progressive disclosure (4.5 / 4.7)
**Files:** `src/components/mandate/MandateDocument.tsx`, `src/components/mandate/MandateDocument.module.scss`.
- **4.5:** `.document` padding `$spacing-xl → $spacing-lg`; remove the `@media (max-width:$breakpoint-sm)` `$spacing-lg` override (now uniform).
- **4.7 verification → `(i)` modal:** replace the `.verification` `<section>` (h3 + prose `<p>`) with `<InfoDisclosure label={t('mandate.verification.title', …)}>{verification prose}</InfoDisclosure>`, placed inline right after the turnout strip (turnout + "is the vote real" are related). Reuses existing `mandate.verification.title` + `mandate.verification.body` strings — no new strings.
- **4.7 indicators → inline collapse:** the "How we'll know it's working" `<section>` becomes a disclosure. Keep the `<h2 id="mandate-indicators">` as the accessible heading, but make it a toggle: `<h2><button aria-expanded={open} aria-controls="mandate-indicators-panel">{indicatorsTitle}<ChevronDown/></button></h2>`, then `<div id="mandate-indicators-panel" hidden={!open}>…<dl/>…</div>`. Default **collapsed**. Reuses `mandate.indicatorsTitle` as the button label — no new strings. "What we commit to" (articles) stays open above it. ≥44px hit area on the toggle.

### 6. Mandate adoption — collapse the full list (4.7)
**Files:** `src/components/mandate/AdoptionFramework.tsx`, `src/components/mandate/AdoptionFramework.module.scss`.
- Keep `.summary` (count + breakdown + "Add your organization") always open. Collapse the `.list` `<ul>` behind an inline toggle: `<button aria-expanded={open} aria-controls="adopters-panel">{t('mandate.adoption.showAll','Show all {n} organizations',{n})}<ChevronDown/></button>` when collapsed, flipping to `t('mandate.adoption.hideList','Hide the list')` when open; `<ul id="adopters-panel" hidden={!open}>`. Default **collapsed** (the summary already states the count + breakdown). ≥44px hit area.
- **New i18n strings (2):** `mandate.adoption.showAll`, `mandate.adoption.hideList` → en/fr/sw parity + native-review packet.

### 7. Docs
**File:** `DESIGN_SYSTEM.md`.
- Add `ContextCard` to the shared-primitive inventory; codify §5 rule 11 ("any sub-page that acts ON an item renders a shared ContextCard — title + body — so the item never disappears").
- Codify the §6 #7 decision: the "open the full item" affordance is intentionally per-context (dashboard = solid CTA; stage-feed = quiet link) — document the distinction so it isn't "fixed" as drift.

## New/changed user-facing strings (i18n — en/fr/sw parity BEFORE + AFTER)
| Key | English | Note |
|---|---|---|
| `context.discussion.aria` | "The problem under discussion" | aria-label, discussion ContextCard |
| `context.suggest.aria` | "The problem you are suggesting on" | aria-label, suggest ContextCard |
| `mandate.adoption.showAll` | "Show all {n} organizations" | adopter list toggle (collapsed) |
| `mandate.adoption.hideList` | "Hide the list" | adopter list toggle (expanded) |

Reused (no new key): `mandate.verification.title`/`.body`, `mandate.indicatorsTitle`.

## Files touched
**New:** `ContextCard.tsx` + `.module.scss`.
**Modified:** `shared/index.ts`, `InitiativeView.tsx`, `DiscussionStageView.tsx`, `SuggestionDmView.tsx`, `MandateCard.tsx` + scss, `MandateDocument.tsx` + scss, `AdoptionFramework.tsx` + scss, `i18n/en.ts` + `fr.ts` + `sw.ts`, `DESIGN_SYSTEM.md`, (closeout) `docs/i18n-native-review-candidates.md`, `MASTER_TODO.md`.

## Out of scope
W5 kit sweep/floors, W6 chrome. No new routes. No `ProblemEngage` prop-threading. `RatificationPanel`/`AdoptionFramework` insets (already aligned). 4.2 SCSS (already fixed) unless preview shows drift.

## Verification plan
`npx tsc -b` clean per chunk; `npm run build` clean. Preview walk at **360px light + dark** (reload after colorScheme flip): discussion + suggest ContextCards render and body clamps; mandate actions hold one row (incl. fr); hero reads raised in dark; indicators/adopters collapse+expand with working `aria-expanded`; verification `(i)` modal opens/traps focus; single h1 + single `AppHeader` per route. i18n parity scanner before + after. Then adversarial whole-branch review (Workflow fleet on Opus); verify findings ("no verdict" ≠ refuted). Push only on Eston's explicit green light.

## Risks / watch-items
- **360px one-row fit (4.4):** longest label is fr "Soutenir ce mandat" + heart + gap + Share. Verify; icon-only Share fallback ready.
- **`get_details` empty details:** on an initiative with no seeded `description`, the discussion ContextCard renders null (graceful) and the suggest ContextCard shows title-only. Acceptable.
- **Heading-as-button a11y (indicators):** keep the `<h2>` wrapping the toggle so the heading stays in the a11y tree; `aria-controls` + `aria-expanded` on the inner button.
- **AdoptionFramework has no outer card** — the collapse toggle lives inside its existing structure; don't introduce a card wrapper.
