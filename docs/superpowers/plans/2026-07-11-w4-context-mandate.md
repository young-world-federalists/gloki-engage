# W4 — Context restoration + mandate composition — Implementation Plan

> **For agentic workers:** No test framework in this repo (CLAUDE.md). Each task's cycle is **edit → `npx tsc -b` → preview-verify (360px light+dark) → commit**. Execution mode: **direct/controller** (only the controller drives the one shared preview; slow USB drive rules out parallel subagent writers). Spec: `docs/superpowers/specs/2026-07-11-w4-context-mandate-design.md`.

**Goal:** Give discussion + suggest pages the item's context back via a new `ContextCard` primitive, and compose the mandate (one-row actions, unified inset, raised hero, progressive disclosure) — no long-scroll blow-up.

**Architecture:** One new dumb presentational primitive (`ContextCard`) consumed by two collab views (sourced through the existing `get_details` seam read). Four mandate components get token-only SCSS composition + two inline disclosures + one `(i)` modal reuse. DESIGN_SYSTEM.md codifies the pattern.

**Tech Stack:** React 19 + TS + SCSS modules; tokens from `src/styles/variables.scss`; i18n via `t()` with en/fr/sw parity; `lucide-react` icons.

## Global Constraints (verbatim from spec / change-control)
- **UI-only** — no `src/services/demo/` change → **NO `DEMO_VERSION` bump**.
- **Tokens only** — no raw hex/px/rem/`rgba(...)`; Sass tints of a token OK. Reviewers reject ad-hoc values.
- **Seam** — data only via `src/services/api.ts` (`contractRead`); `get_details` already exists; no new contract method.
- **i18n** — every new string via `t('ns.key','English')` + added to `en.ts`+`fr.ts`+`sw.ts` in the SAME commit; parity scan before+after.
- **Single h1 / single AppHeader** per route; ContextCard title is `<h2>` under the header's h1.
- **Build gate** — `npx tsc -b` clean (strict `noUnusedLocals`/`noUnusedParameters`) before every commit.
- **360px hold**, light + dark; ≥44px hit areas on new toggles.
- Commit tags `feat(s27):` / `docs(s27):`; each commit leaves `ui` runnable.

---

### Task 1: `ContextCard` primitive + discussion page context (4.1)

**Files:**
- Create: `src/components/shared/ContextCard.tsx`, `src/components/shared/ContextCard.module.scss`
- Modify: `src/components/shared/index.ts` (export), `src/pages/collaboration/InitiativeView.tsx`, `src/components/collaboration/DiscussionStageView.tsx`, `src/i18n/en.ts`, `src/i18n/fr.ts`, `src/i18n/sw.ts`

**Produces:** `ContextCard` (props `{title?, body?, ariaLabel?, className?}`) consumed by Task 2.

- [ ] **Step 1 — ContextCard.tsx.** Dumb card; returns `null` when both `title` and `body` are falsy:
```tsx
import React from 'react';
import styles from './ContextCard.module.scss';

export interface ContextCardProps {
  title?: string;
  body?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * The item a sub-page acts ON (discussion, suggest-to-author) — so it never
 * disappears (DESIGN_SYSTEM §5 rule 11). Title is optional: pages whose header
 * already carries the title pass body-only to avoid a double-title. Presentational
 * only — no interactivity, no data.
 */
const ContextCard: React.FC<ContextCardProps> = ({ title, body, ariaLabel, className }) => {
  if (!title && !body) return null;
  return (
    <section className={`${styles.card}${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {body && <p className={styles.body}>{body}</p>}
    </section>
  );
};

export default ContextCard;
```
- [ ] **Step 2 — ContextCard.module.scss.** Tokens only; body clamped to 4 lines:
```scss
@use '../../styles/variables' as *;

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-lg;
  background: $gray-50;
  border: 1px solid $gray-200;
  border-radius: $radius-lg;

  @include dark {
    background: $dark-bg;
    border-color: $dark-border;
  }
}

.title {
  margin: 0;
  font-size: $text-base;
  font-weight: $font-semibold;
  line-height: 1.3;
  color: $gray-900;

  @include dark { color: $dark-text; }
}

.body {
  margin: 0;
  font-size: $text-sm;
  line-height: 1.45;
  color: $gray-600;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @include dark { color: $dark-text-secondary; }
}
```
- [ ] **Step 3 — export.** In `src/components/shared/index.ts` add `export { default as ContextCard } from './ContextCard';` (match the file's existing export style; also re-export the type if the file re-exports types).
- [ ] **Step 4 — i18n `context.discussion.aria`.** Add to `en.ts` ("The problem under discussion"), `fr.ts` ("Le problème en discussion"), `sw.ts` ("Tatizo linalojadiliwa") in the same nesting position. Confirm final translations against existing tone; native packet at closeout.
- [ ] **Step 5 — InitiativeView.tsx.** Add `description` state mirroring `title`:
  - `const [description, setDescription] = useState(initiative?.description ?? '');`
  - In the `get_details` `.then`, after the title line: `if (typeof details?.description === 'string') setDescription(details.description as string);`
  - Guard the effect early-return already covers `initiative?.title`; keep it (description rides the same fetch).
  - Pass to the discussion branch: `<DiscussionStageView title={title} description={description} communityId={...} initiativeId={...} />`.
- [ ] **Step 6 — DiscussionStageView.tsx.** Add `description?: string` to `DiscussionStageViewProps`; destructure it; import `ContextCard` from `../shared`; render body-only card as the FIRST child inside `<div className={styles.main}>`, before the `ErrorBoundary`:
```tsx
<ContextCard body={description} ariaLabel={t('context.discussion.aria', 'The problem under discussion')} />
```
- [ ] **Step 7 — Build.** `npx tsc -b` → clean.
- [ ] **Step 8 — Preview.** Discussion route at 360px light+dark: description renders in a bordered card between header and thread, body clamps at 4 lines, no double-title, single h1. (Seed auth + navigate via a seeded initiative with a description.)
- [ ] **Step 9 — Parity + commit.** Run i18n parity scan (0 diff). `git add` the 7 paths; `git commit -m "feat(s27): discussion page shows the discussed item — ContextCard [W4 4.1]"`.

---

### Task 2: Suggest-to-author context (4.3)

**Files:** Modify `src/components/collaboration/SuggestionDmView.tsx`, `src/i18n/en.ts`, `fr.ts`, `sw.ts`.
**Consumes:** `ContextCard` from Task 1.

- [ ] **Step 1 — self-fetch get_details.** In `SuggestionDmView`, add local state `const [problem, setProblem] = useState<{title?: string; description?: string}>({});` and an effect (cancellation-safe) that, when `serverUrl && publicKey && initiativeId`, calls `contractRead({serverUrl, publicKey, contractId: initiativeId, method: {name:'get_details', values:{}} as IMethod})` → `setProblem({title: d.title, description: d.description})`, `.catch(()=>{})`. Import `contractRead` from `../../services/api` and `IMethod` from `../../services/interfaces`.
- [ ] **Step 2 — i18n `context.suggest.aria`.** Add to en ("The problem you are suggesting on"), fr ("Le problème que vous commentez"), sw ("Tatizo unalotolea maoni").
- [ ] **Step 3 — render.** Import `ContextCard` from `../shared`. Render pinned between the `AppHeader` and the scrollable `.thread` (a direct child of `.dmMain`, BEFORE `.thread`):
```tsx
<ContextCard title={problem.title} body={problem.description} ariaLabel={t('context.suggest.aria', 'The problem you are suggesting on')} />
```
Confirm it does not sit inside the scroll region and does not break the composer-anchored flex column.
- [ ] **Step 4 — Build.** `npx tsc -b` → clean.
- [ ] **Step 5 — Preview.** Suggest route (`…/suggest`) 360px light+dark: header shows author name, ContextCard shows problem title + body below it, composer still anchored bottom.
- [ ] **Step 6 — Parity + commit.** Parity scan; `git commit -m "feat(s27): suggest-to-author shows the problem — ContextCard [W4 4.3]"`.

---

### Task 3: Mandate hero — one-row actions + inset + dark elevation (4.4 / 4.5 / 4.6)

**Files:** Modify `src/components/mandate/MandateCard.tsx`, `src/components/mandate/MandateCard.module.scss`.

- [ ] **Step 1 — MandateCard.tsx actions.** Replace the two Buttons: primary drop `fullWidth`, set `size="md"`, add `className={styles.supportBtn}`; secondary set `size="md"`, add `className={styles.shareBtn}`:
```tsx
<div className={styles.actions}>
  <Button variant="primary" size="md" className={styles.supportBtn} leftIcon={<Heart size={16} aria-hidden />} onClick={onShowSupport}>
    {t('mandate.card.showSupport', 'Back this mandate')}
  </Button>
  <Button variant="secondary" size="md" className={styles.shareBtn} leftIcon={<Share2 size={16} aria-hidden />} onClick={share}>
    {copied ? t('mandate.copied', 'Copied') : t('mandate.card.share', 'Share')}
  </Button>
</div>
```
- [ ] **Step 2 — MandateCard.module.scss.** `.card` padding `$spacing-xl → $spacing-lg`; dark `background: $dark-surface → $dark-bg` (keep `border-color: $dark-border`). Replace `.actions`:
```scss
.actions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: nowrap;
}
.supportBtn { flex: 1; min-width: 0; }
.shareBtn { flex: 0 0 auto; }
```
- [ ] **Step 3 — Build.** `npx tsc -b` → clean.
- [ ] **Step 4 — Preview (light+dark, 360px).** Support + Share on ONE row (support fills, share right); hero card reads raised (lighter than page) in dark; inset now 16px.
- [ ] **Step 5 — fr row-fit check.** Set locale=fr (or seed): "Soutenir ce mandat" + heart + Share fit one row at 360px. If it overflows/truncates, make Share icon-only (drop the visible label, keep the icon + existing `aria-label`) — record the fallback in the commit body.
- [ ] **Step 6 — Commit.** `git commit -m "feat(s27): mandate hero — actions one row, 16px inset, raised in dark [W4 4.4/4.5/4.6]"`.

---

### Task 4: Mandate document — inset + progressive disclosure (4.5 / 4.7)

**Files:** Modify `src/components/mandate/MandateDocument.tsx`, `src/components/mandate/MandateDocument.module.scss`.
**Imports to add:** `InfoDisclosure` from `../shared` (verify export name); `ChevronDown` from `lucide-react`; `useState` (already imported).

- [ ] **Step 1 — inset.** `.document` padding `$spacing-xl → $spacing-lg`; DELETE the `@media (max-width: $breakpoint-sm)` block that overrode `.document` padding to `$spacing-lg` (now redundant).
- [ ] **Step 2 — verification → `(i)` modal.** Replace the `<section className={styles.verification} …>` block (h3 + `<p>`) with an `InfoDisclosure` placed right after the `.turnout` div:
```tsx
<InfoDisclosure
  label={t('mandate.verification.title', 'How we keep the vote real')}
  className={styles.verifyDisclosure}
>
  <p>{t('mandate.verification.body', 'One person, one vote. Gloki keeps the electorate real through a community web of trust — members vouch for one another in person by scanning QR codes. No ID papers, no biometrics, no face scans are collected, and no one can buy extra influence.')}</p>
</InfoDisclosure>
```
Keep the `mandate.verification.title`/`.body` keys (reused). Add a small `.verifyDisclosure` alignment style if needed (e.g. `align-self: flex-start`).
- [ ] **Step 3 — indicators → inline collapse.** Add `const [showIndicators, setShowIndicators] = useState(false);` near the `view` state. Rewrite the indicators `<section aria-labelledby="mandate-indicators">` so the `<h2>` wraps a toggle button and the `<dl>` is in a controlled panel:
```tsx
<section className={styles.section} aria-labelledby="mandate-indicators">
  <h2 id="mandate-indicators" className={styles.sectionTitle}>
    <button
      type="button"
      className={styles.discloseToggle}
      aria-expanded={showIndicators}
      aria-controls="mandate-indicators-panel"
      onClick={() => setShowIndicators((v) => !v)}
    >
      {t('mandate.indicatorsTitle', 'How we’ll know it’s working')}
      <ChevronDown size={18} aria-hidden className={showIndicators ? styles.chevronOpen : styles.chevron} />
    </button>
  </h2>
  <div id="mandate-indicators-panel" hidden={!showIndicators}>
    <dl className={styles.indicators}>
      {/* unchanged indicator mapping */}
    </dl>
  </div>
</section>
```
Default collapsed. "What we commit to" (articles) stays untouched above it.
- [ ] **Step 4 — toggle SCSS.** Add to `MandateDocument.module.scss` (tokens only, ≥44px hit area):
```scss
.discloseToggle {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  min-height: 44px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;

  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; border-radius: $radius-sm; }
}
.chevron { transition: transform $transition-base; }
.chevronOpen { transition: transform $transition-base; transform: rotate(180deg); }
```
(If `$transition-base` is not the token name, use the existing transition token — verify in variables.scss.)
- [ ] **Step 5 — Build.** `npx tsc -b` → clean.
- [ ] **Step 6 — Preview (light+dark, 360px).** Document inset 16px; verification is now an `(i)` that opens a focus-trapped modal with the prose; indicators default collapsed, toggle expands the `<dl>` with the chevron rotating and `aria-expanded` flipping; commitments still open; single h1 unaffected (these are h2/h3).
- [ ] **Step 7 — Commit.** `git commit -m "feat(s27): mandate document — 16px inset + progressive disclosure [W4 4.5/4.7]"`.

---

### Task 5: Mandate adoption — collapse the full adopter list (4.7)

**Files:** Modify `src/components/mandate/AdoptionFramework.tsx`, `src/components/mandate/AdoptionFramework.module.scss`, `src/i18n/en.ts`, `fr.ts`, `sw.ts`.
**Imports to add:** `ChevronDown` from `lucide-react` (if not present); `useState` (present).

- [ ] **Step 1 — i18n strings.** Add `mandate.adoption.showAll` = en "Show all {n} organizations" / fr "Voir les {n} organisations" / sw "Onyesha mashirika yote {n}"; `mandate.adoption.hideList` = en "Hide the list" / fr "Masquer la liste" / sw "Ficha orodha". (Finalize fr/sw wording; native packet at closeout.)
- [ ] **Step 2 — collapse the list.** Add `const [showAdopters, setShowAdopters] = useState(false);`. Wrap the `.list` `<ul>` in a controlled panel and add a toggle button just before it (after `.summary`):
```tsx
<button
  type="button"
  className={styles.discloseToggle}
  aria-expanded={showAdopters}
  aria-controls="adopters-panel"
  onClick={() => setShowAdopters((v) => !v)}
>
  {showAdopters
    ? t('mandate.adoption.hideList', 'Hide the list')
    : t('mandate.adoption.showAll', 'Show all {n} organizations', { n: adopters.length })}
  <ChevronDown size={18} aria-hidden className={showAdopters ? styles.chevronOpen : styles.chevron} />
</button>
<ul id="adopters-panel" className={styles.list} hidden={!showAdopters}>
  {/* unchanged AdopterCard mapping */}
</ul>
```
Use the actual adopters array name from the component for `{n}` and the mapping. Default collapsed.
- [ ] **Step 3 — toggle SCSS.** Add the same `.discloseToggle` / `.chevron` / `.chevronOpen` rules (as Task 4 Step 4) to `AdoptionFramework.module.scss`.
- [ ] **Step 4 — Build.** `npx tsc -b` → clean.
- [ ] **Step 5 — Preview (light+dark, 360px).** Summary + "Add your organization" stay open; toggle reads "Show all N organizations" collapsed, reveals the list + flips to "Hide the list"; `aria-expanded` correct; count matches.
- [ ] **Step 6 — Parity + commit.** Parity scan; `git commit -m "feat(s27): mandate adoption — collapse full adopter list [W4 4.7]"`.

---

### Task 6: DESIGN_SYSTEM.md — codify ContextCard + §6 #7 (docs)

**Files:** Modify `DESIGN_SYSTEM.md`.

- [ ] **Step 1 — ContextCard inventory + rule 11.** In the shared-primitive inventory section, add a `ContextCard` entry (props `title?`, `body?`, `ariaLabel?`; body clamps ~4 lines; title omitted when the page header already carries it). Add the rule: "Any sub-page that acts ON an item (discussion, suggest-to-author) renders a shared `ContextCard` (title + body) so the item never disappears." Match the file's existing entry style/numbering.
- [ ] **Step 2 — §6 #7 affordance.** Add a short note that the "open the full item" affordance is intentionally per-context (dashboard = solid Button CTA; stage-feed = quiet link) — documented so it is not "corrected" as drift.
- [ ] **Step 3 — Commit.** `git commit -m "docs(s27): DESIGN_SYSTEM — ContextCard primitive (§5 rule 11) + §6#7 open-item affordance"`.

---

## Self-review (plan vs spec)
- **Spec coverage:** 4.1→T1; 4.3→T2; 4.4/4.5(hero)/4.6→T3; 4.5(doc)/4.7(verification+indicators)→T4; 4.7(adopters)→T5; §5 rule 11 + §6 #7 docs→T6. 4.2 = no-op (confirm in T1/T4 previews). All covered.
- **Placeholders:** fr/sw wordings are provisional-but-concrete (finalized against tone at build; native packet flags them) — not placeholders. Component-specific array/mapping names (adopters, indicator map) are marked "use actual name from component" because they are read at edit time.
- **Type consistency:** `ContextCard` props `{title?, body?, ariaLabel?, className?}` identical across T1/T2. `.discloseToggle`/`.chevron`/`.chevronOpen` class names identical across T4/T5.
- **Verify tokens at build:** `$transition-base` name and `InfoDisclosure` export name confirmed against source before use.
