# Session 1 — Design-System Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Gloki design system internally consistent — one canonical stage palette, no dead/duplicate color tokens, one identity treatment (flag + verified-shield), dead button CSS removed, and a whitespace/AA pass — without changing any flow's behaviour.

**Architecture:** All colour comes from `src/styles/variables.scss` tokens; this session adds a canonical `$stage-*` set as the single source of truth for the 5 governance-stage colours, retires bespoke/dead colour tokens by remapping to existing tokens, and introduces one shared `UserIdentity` primitive (`[flag] Name [verified-shield]`) that replaces the text `TrustBadge` in every feed/byline context. No data-layer or routing changes. Verification is type-check (`tsc -b`) + visual check at 360px in light **and** dark (this project has no test framework).

**Tech Stack:** React 19 + TypeScript + Vite + SCSS Modules + lucide-react + clsx.

## Global Constraints

- **Branch `ui`; keep it runnable.** No backend, no real server calls. Reads/writes stay behind `src/services/api.ts` (not touched this session).
- **Tokens only — no ad-hoc values.** Never introduce a raw hex / px / one-off `rgba(...)`. Tinted variants derive from a token (`rgba($primary, 0.1)`). (`DESIGN_SYSTEM.md` → "no ad-hoc values".)
- **Colour means only "stage" or "status".** Stage identity = `$stage-*`; status = `$success`/`$warning`/`$error`/`$info` + their surfaces; interactive = `$primary`.
- **Production build runs `tsc -b`.** A task is not done until `npm run build` is clean (zero TS errors).
- **No test framework.** Verify each task via `npm run dev` + the `preview_*` tools: screenshot the affected surface at **360px wide**, in **light and dark** (`prefers-color-scheme`). Never claim done without the screenshot.
- **Flagship target 360px Android**, light + dark, per `DESIGN_SYSTEM.md`.
- **i18n parity.** This session adds **no new user-facing strings** (the verified-shield reuses the existing `trust.verified` key for its aria-label). If any string is added, it ships at fr + sw key parity. Removing the country quick-picks orphans `country.quickAdd` + the `region.*` label keys — leave them (harmless) or prune in the i18n task; do not break parity.
- **AA gate.** `$gray-400` (#9ca3af, 2.54:1 on white) is never a text colour — use `$gray-500`. Regression grep: `grep -rn 'color: $gray-400' src --include='*.module.scss'` must match only `border-`/`background`/`::placeholder` (decorative), never standalone text `color:`.

---

## File Structure

**New files**
- `src/components/shared/UserIdentity.tsx` — the `[flag] Name [verified-shield]` primitive. One responsibility: render a person's inline identity consistently.
- `src/components/shared/UserIdentity.module.scss` — its styles.

**Modified — colour system**
- `src/styles/variables.scss` — add `$stage-*` (×5) + `$warning-dark`; remove dead `$secondary`.
- `src/components/shared/StageStrip.module.scss` — stage circles → `$stage-*`.
- `src/pages/CreateInitiativePage.module.scss` — stepper circles → `$stage-*`.
- `src/components/community/CollabList.module.scss` — `$collab-color` teal → `$primary`.
- `src/components/collaboration/InitiativeStagePanel.module.scss` + `src/components/collaboration/StageAdvanceBar.module.scss` — `$initiative-color` orange → `$primary`.
- `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss` — remove stale `$initiative-color: #ea580c`.
- Hex-migration files (Task 4): `src/components/identity/Communities.module.scss`, `src/components/collaboration/flows/roles/RolesFlow.module.scss`, `src/components/community/chat/ChatTopic.module.scss`, `src/components/collaboration/flows/discussion/DiscussionFlow.module.scss` (+ keep canvas literals in `IdentityCardSVG.tsx`/`Share.tsx`).

**Modified — identity treatment**
- `src/components/shared/index.ts` — export `UserIdentity`.
- `src/pages/HomeView.tsx`, `src/pages/StageFeedView.tsx`, `src/components/community/Members.tsx`, `src/components/community/ActivityCard.tsx` (+ the 5 `*ActivityCard.tsx` variants that pass `trustState`), `src/components/initiative/InitiativeStageCard.tsx` — `TrustBadge` → `UserIdentity`.
- `src/components/community/IdentityTrust.tsx` — **unchanged** (keeps the full `TrustBadge`).

**Modified — buttons / quick-wins / docs**
- `src/styles/globals.scss` — delete the 8 dead button classes.
- `src/pages/LoginPage.tsx` — drop the redundant `login-button` global class.
- `src/components/community/Members.tsx` + `Members.module.scss` — join/approve/pending → `<Button>`.
- `src/pages/CreateInitiativePage.tsx` — back-button icon 20 → 24.
- `src/components/shared/CountryMultiSelect.tsx` + `CountryMultiSelect.module.scss` + `src/utils/countries.ts` — remove regional quick-picks.
- `DESIGN_SYSTEM.md` — document the changes.

---

## Task 1: Add canonical stage + warning-dark tokens (additive)

Additive only — nothing consumes the new tokens yet, so the build stays green and nothing renders differently.

**Files:**
- Modify: `src/styles/variables.scss`

**Interfaces:**
- Produces: `$stage-problem`, `$stage-discussion`, `$stage-solutions`, `$stage-vote`, `$stage-mandate`, `$warning-dark` (consumed by Tasks 2, 4).

- [ ] **Step 1: Add the tokens.** After the `$error-dark` line (currently `src/styles/variables.scss:12`), insert `$warning-dark`; after the brand-gradient block, add the stage set:

```scss
$warning: #f59e0b;
$warning-dark: #d97706; // warning hover/darker; completes the -dark set ($primary/$success/$error-dark)
$error: #dc2626;
$error-dark: #b91c1c;

// Brand gradient (login hero only — decorative, pre-auth, no text sits on it)
$brand-gradient-start: #667eea;
$brand-gradient-end: #764ba2;

// ---------------------------------------------------------------------------
// Stage identity — the SINGLE source of truth for the 5 governance-stage
// colours (Problem → Discussion → Solutions → Vote → Mandate). Used by the
// StageStrip circles and the create-initiative stepper. A harmonised sibling
// set (consistent weight) so the pipeline reads as one calm rainbow, not a
// clash. Stage colour ALWAYS pairs with the stage icon + label, so it never
// reads as a status (e.g. red Problem ≠ error). Tunable at review.
// ---------------------------------------------------------------------------
$stage-problem:    #ef4444;
$stage-discussion: #f59e0b;
$stage-solutions:  #8b5cf6;
$stage-vote:       #3b82f6;
$stage-mandate:    #10b981;
```

- [ ] **Step 2: Type-check.** Run: `npm run build` — Expected: clean (SCSS variables don't affect TS, but confirms nothing broke).
- [ ] **Step 3: Commit.**

```bash
git add src/styles/variables.scss
git commit -m "feat(tokens): add canonical \$stage-* palette + \$warning-dark"
```

---

## Task 2: Unify the stage circles onto `$stage-*`

Today the saturated stage circles are defined **twice with different values** — `StageStrip.module.scss` (`$error`/`$warning`/`$brand-gradient-end`/`$primary`/`$success`) and the create-initiative stepper (`#ef4444`/`$warning`/`#8b5cf6`/`$primary`/`$success`). Point both at the one `$stage-*` source.

**Files:**
- Modify: `src/components/shared/StageStrip.module.scss:49-53`
- Modify: `src/pages/CreateInitiativePage.module.scss:138-142`

- [ ] **Step 1: StageStrip circles → tokens.** Replace lines 45-53 of `StageStrip.module.scss`:

```scss
// Five distinct stage colours from the canonical $stage-* set (variables.scss),
// the single source shared with the create-initiative stepper.
.stage_problem .circle    { background: $stage-problem; }
.stage_discussion .circle { background: $stage-discussion; }
.stage_proposals .circle  { background: $stage-solutions; }
.stage_vote .circle       { background: $stage-vote; }
.stage_mandate .circle    { background: $stage-mandate; }
```

- [ ] **Step 2: Stepper circles → tokens.** Replace `src/pages/CreateInitiativePage.module.scss:135-142`:

```scss
// Per-stage step-circle accents from the canonical $stage-* set (variables.scss),
// the single source shared with the StageStrip.
.stepCircle_problem    { background: $stage-problem; }
.stepCircle_discussion { background: $stage-discussion; }
.stepCircle_proposals  { background: $stage-solutions; }
.stepCircle_vote       { background: $stage-vote; }
.stepCircle_mandate    { background: $stage-mandate; }
```

- [ ] **Step 3: Type-check.** Run: `npm run build` — Expected: clean.
- [ ] **Step 4: Visual verify.** `npm run dev`; open `/login` (StageStrip is on the login + create screens) and a community's **Start an initiative** page → open the **(i)** "How initiatives work" to see the stepper. Screenshot at 360px, light **and** dark. Confirm: the strip and the stepper now show the **same** five hues; the rainbow reads calm; nothing else changed. **This is the live approval point for the exact stage hues — note them for Eston; they are tunable here.**
- [ ] **Step 5: Commit.**

```bash
git add src/components/shared/StageStrip.module.scss src/pages/CreateInitiativePage.module.scss
git commit -m "refactor(color): unify stage circles onto canonical \$stage-* tokens"
```

---

## Task 3: Remove dead `$secondary` + remap bespoke teal/orange accents

`$secondary` (#64748b) has **zero** usages. `$collab-color` (#0d9488 teal) and `$initiative-color` (#c2410c orange) are bespoke non-stage accents — remap to `$primary` so "interactive = blue" holds. A stale `$initiative-color: #ea580c` in `ProblemVoteFlow` is unused. `$brand-gradient-*` **stays** (the login hero uses it).

**Files:**
- Modify: `src/styles/variables.scss:7` (remove `$secondary`)
- Modify: `src/components/community/CollabList.module.scss` (`$collab-color` → `$primary`)
- Modify: `src/components/collaboration/InitiativeStagePanel.module.scss` + `src/components/collaboration/StageAdvanceBar.module.scss` (`$initiative-color` → `$primary`)
- Modify: `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss:3` (delete stale var)

- [ ] **Step 1: Remove `$secondary`.** Delete `src/styles/variables.scss:7` (`$secondary: #64748b;`).
- [ ] **Step 2: Remap `$collab-color`.** In `CollabList.module.scss`: delete the `$collab-color: #0d9488;` definition (line ~4); replace every `$collab-color` reference with `$primary`, and every literal `rgba(13, 148, 136, <a>)` (lines ~24, 124, 134) with `rgba($primary, <a>)` (keep the same alpha). The dark-block reuse (line ~152) becomes `$primary` too.
- [ ] **Step 3: Remap `$initiative-color`.** In **both** `InitiativeStagePanel.module.scss` and `StageAdvanceBar.module.scss`: delete the `$initiative-color: #c2410c;` definition (line 3); replace `$initiative-color` with `$primary` and `darken($initiative-color, …)` hovers with `$primary-dark`.
- [ ] **Step 4: Delete stale var.** Remove `src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss:3` (`$initiative-color: #ea580c;` — unused).
- [ ] **Step 5: Type-check.** Run: `npm run build` — Expected: clean. (If SCSS errors "undefined variable `$collab-color`", a reference was missed — grep `grep -rn 'collab-color\|initiative-color\|\$secondary' src` should now return **nothing**.)
- [ ] **Step 6: Visual verify.** `npm run dev`; view the **Collaborate** list (community → Collaborate) and a stage-advance surface (an initiative dashboard with the advance bar). Screenshot 360px light + dark. Confirm teal/orange are gone (now brand-blue) and nothing looks broken.
- [ ] **Step 7: Commit.**

```bash
git add src/styles/variables.scss src/components/community/CollabList.module.scss src/components/collaboration/InitiativeStagePanel.module.scss src/components/collaboration/StageAdvanceBar.module.scss src/components/collaboration/flows/voting/ProblemVoteFlow.module.scss
git commit -m "refactor(color): drop dead \$secondary; remap teal/orange accents to \$primary"
```

---

## Task 4: Migrate clean hardcoded hex/rgba → tokens

A finite, enumerated set (from the colour audit). **Keep canvas/SVG literals** (`IdentityCardSVG.tsx`, `Share.tsx`) — `canvas`/SVG `fill` can't read SCSS — but add a token-mapping comment. **Keep** the `DiscussionFlow.tsx` `CATEGORIES[].color` literals (component-semantic, in `.tsx`) with a sync comment. Everything below is a `.module.scss` literal that maps 1:1 to a token.

**Files & transformations** (apply each, keeping the original alpha):

- `src/components/identity/Communities.module.scss` — `#f59e0b` → `$warning`; `#d97706` → `$warning-dark` (lines ~160-166, 380).
- `src/components/collaboration/flows/roles/RolesFlow.module.scss` — `#f59e0b` → `$warning`; `rgba(245, 158, 11, <a>)` → `rgba($warning, <a>)`; `rgba(220, 38, 38, <a>)` → `rgba($error, <a>)` (lines ~44, 102, 148-256).
- `src/components/community/chat/ChatTopic.module.scss` — `rgba(59, 130, 246, <a>)` → `rgba($primary, <a>)` (lines ~109, 110, 236, 237).
- `src/components/collaboration/flows/discussion/DiscussionFlow.module.scss` — `rgba(59, 130, 246, <a>)` → `rgba($primary, <a>)`; `rgba(220, 38, 38, <a>)` → `rgba($error, <a>)` (lines ~159, 222, 226, 369, 385).

**Worked example** (ChatTopic.module.scss):

```scss
/* before */   background: rgba(59, 130, 246, 0.06);
/* after  */   background: rgba($primary, 0.06);
```

**Canvas comment example** (top of the colour block in `IdentityCardSVG.tsx` / `Share.tsx`):

```ts
// Canvas/SVG literals — cannot reference SCSS tokens at draw time. Keep in sync
// with variables.scss: #3b82f6=$primary, #1d4ed8≈$primary-dark, #f8fafc=$gray-50,
// #1f2937=$gray-800, #6b7280=$gray-600, #e5e7eb=$gray-200.
```

- [ ] **Step 1:** Apply the four `.module.scss` migrations above.
- [ ] **Step 2:** Add the sync comment to `IdentityCardSVG.tsx` and `Share.tsx` (no value changes), and a one-line sync comment above `DiscussionFlow.tsx`'s `CATEGORIES` array.
- [ ] **Step 3: Grep gate.** Run: `grep -rnE '#[0-9a-fA-F]{6}|rgba?\([0-9]' src --include='*.module.scss'` — Expected: the only remaining literals are intentional (e.g. `_animations.scss` shimmer, `$overlay-bg`-style scrims, `rgba(0,0,0,…)`/`rgba(255,255,255,…)` shines). No `#3b82f6`/`#f59e0b`/`#dc2626`/`rgba(59,130,246…)` etc. remain in component modules.
- [ ] **Step 4: Type-check + AA grep.** `npm run build` clean; `grep -rn 'color: $gray-400' src --include='*.module.scss'` matches only decorative/placeholder.
- [ ] **Step 5: Visual verify.** Screenshot the Roles flow, a chat topic, and the discussion flow at 360px light + dark — unchanged appearance (values are token-equal).
- [ ] **Step 6: Commit.**

```bash
git add src/components/identity/Communities.module.scss src/components/collaboration/flows/roles/RolesFlow.module.scss src/components/community/chat/ChatTopic.module.scss src/components/collaboration/flows/discussion/DiscussionFlow.module.scss src/components/community/dialogs/IdentityCardSVG.tsx src/components/community/Share.tsx
git commit -m "refactor(color): migrate hardcoded hex/rgba to tokens; comment canvas literals"
```

---

## Task 5: Build the `UserIdentity` primitive

One shared component for `[flag] Name [verified-shield]`. Flag (when a country is known) sits **before** the name; a **verified** member gets a small `ShieldCheck` rendered like an exponent **after** the name; non-verified members get no shield. The shield is icon-only, so its `aria-label` ("Verified", reusing `trust.verified`) is its accessible name.

**Files:**
- Create: `src/components/shared/UserIdentity.tsx`
- Create: `src/components/shared/UserIdentity.module.scss`
- Modify: `src/components/shared/index.ts`

**Interfaces:**
- Produces: `UserIdentity` (default export) + `UserIdentityProps { name: string; countryCode?: string; trustState?: TrustState; size?: 'sm'|'md'; className?: string }`. Consumed by Tasks 6, 7.

- [ ] **Step 1: Component.** Create `src/components/shared/UserIdentity.tsx`:

```tsx
import React from 'react';
import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';
import { useT } from '../../i18n';
import CountryFlag from './CountryFlag';
import type { TrustState } from '../../services/trustModel';
import styles from './UserIdentity.module.scss';

export interface UserIdentityProps {
  /** Display name, already composed + translated (e.g. "Mei Chen"). */
  name: string;
  /** ISO 3166-1 alpha-2 code; renders a flag BEFORE the name when present. */
  countryCode?: string;
  /** Web-of-trust state; a verified member gets a small shield after the name. */
  trustState?: TrustState;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Canonical inline identity: [flag] Name [verified-shield].
 * - Country flag (when known) BEFORE the name (reuses CountryFlag's accessible label).
 * - A verified member gets a ShieldCheck rendered like an exponent AFTER the name.
 *   Non-verified members get no shield (absence = not verified) so the adornment
 *   never adds noise. The shield is icon-only → aria-label ("Verified") is its name.
 * Replaces the text TrustBadge in feed/byline contexts; the dedicated verification
 * page (IdentityTrust) keeps the full descriptive TrustBadge.
 */
const UserIdentity: React.FC<UserIdentityProps> = ({
  name,
  countryCode,
  trustState,
  size = 'sm',
  className,
}) => {
  const t = useT();
  const verified = trustState === 'verified';
  return (
    <span className={clsx(styles.identity, styles[size], className)}>
      {countryCode && <CountryFlag code={countryCode} size="sm" className={styles.flag} />}
      <span className={styles.name}>{name}</span>
      {verified && (
        <ShieldCheck
          className={styles.shield}
          size={size === 'md' ? 13 : 11}
          role="img"
          aria-label={t('trust.verified', 'Verified')}
        />
      )}
    </span>
  );
};

export default UserIdentity;
```

- [ ] **Step 2: Styles.** Create `src/components/shared/UserIdentity.module.scss`:

```scss
@use '../../styles/variables' as *;

.identity {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  min-width: 0;
}

.flag { flex-shrink: 0; }

.name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: $font-medium;
}

// Shield reads like an exponent: small, raised, success-toned (verified = good).
.shield {
  flex-shrink: 0;
  margin-left: 1px;
  transform: translateY(-0.3em);
  color: $success;
}

.sm .name { font-size: $text-sm; }
.md .name { font-size: $text-base; }
```

- [ ] **Step 3: Export.** In `src/components/shared/index.ts`, after the `TrustBadge` export block, add:

```ts
export { default as UserIdentity } from './UserIdentity';
export type { UserIdentityProps } from './UserIdentity';
```

- [ ] **Step 4: Type-check.** Run: `npm run build` — Expected: clean.
- [ ] **Step 5: Commit.**

```bash
git add src/components/shared/UserIdentity.tsx src/components/shared/UserIdentity.module.scss src/components/shared/index.ts
git commit -m "feat(shared): add UserIdentity (flag + name + verified-shield exponent)"
```

---

## Task 6: Adopt `UserIdentity` at feed/byline sites that have author profiles

Swap `TrustBadge` → `UserIdentity` where the author's public key is in hand and the country comes from `state.communities.profiles[authorKey]?.country`. Each of these sites currently renders the name in its own markup and the `TrustBadge` separately — replace **both** with one `UserIdentity` (so the flag/shield render consistently).

**Files:** `src/pages/HomeView.tsx:59`, `src/pages/StageFeedView.tsx:73`, `src/components/community/Members.tsx:58,69`, `src/components/community/ActivityCard.tsx:157` (+ confirm the 5 `*ActivityCard.tsx` variants feed `ActivityCard` — they pass `trustState`/`authorKey` through, so only `ActivityCard` renders the badge).

**Pattern** (apply per site — read each site first to get its name variable + profiles selector):

```tsx
// before: a name span + a separate TrustBadge
<span className={styles.bylineName}>{authorName}</span>
<TrustBadge state={trust.trustOf(author)} vouchCount={trust.vouchCountOf(author)} size="sm" />

// after: one UserIdentity (country from the profile the page already loads)
<UserIdentity
  name={authorName}
  countryCode={profiles[author]?.country}
  trustState={trust.trustOf(author)}
  size="sm"
/>
```

- [ ] **Step 1: Members.** In `Members.tsx`, the `MemberItem` already has `profile`. Replace the `memberName` div + the line-69 `TrustBadge` with a `UserIdentity` (`name={displayName}`, `countryCode={profile?.country}`, `trustState={trustState}`). Update the import on line 9 (`TrustBadge` → `UserIdentity`). Keep the approve button untouched here (Task 8).
- [ ] **Step 2: HomeView + StageFeedView.** These use a `trust` hook keyed by `card.author`/`item.author`. Add the profiles selector (`const { profiles } = useAppSelector(s => s.communities)`) if not present, and swap the name+`TrustBadge` for `UserIdentity` with `countryCode={profiles[author]?.country}`.
- [ ] **Step 3: ActivityCard.** Swap the line-157 name+`TrustBadge` for `UserIdentity`; source `countryCode` from the profile/author data the card receives (read the props — if it lacks a country, pass `undefined`; flag simply won't render, shield still does).
- [ ] **Step 4: Type-check.** `npm run build` clean. Confirm no remaining `TrustBadge` import in these files (`grep -n TrustBadge` on each).
- [ ] **Step 5: Visual verify.** `npm run dev`; Home feed, a stage feed, and a community Members list at 360px light + dark. Confirm: flag renders before names that have a country; a **verified** member shows the small raised shield; a non-verified member shows **no** shield; names still truncate cleanly.
- [ ] **Step 6: Commit.**

```bash
git add src/pages/HomeView.tsx src/pages/StageFeedView.tsx src/components/community/Members.tsx src/components/community/ActivityCard.tsx
git commit -m "refactor(identity): adopt UserIdentity at feed/byline sites with author profiles"
```

---

## Task 7: Thread `authorCountry` into `StagePost` + swap `InitiativeStageCard`

`InitiativeStageCard`'s byline is a pre-composed string (`post.byline`, e.g. "Started by Mei Chen") with no country. Add an optional `authorCountry` to `StagePost`, render the byline via `UserIdentity`, and populate `authorCountry` where the card data is assembled.

**Files:**
- Modify: `src/components/initiative/InitiativeStageCard.tsx` (type + byline render)
- Modify: the card-data assembly sites that build `StagePost` (grep `byline:` / `StagePost` to enumerate; pass `authorCountry` from the author profile already loaded there).

- [ ] **Step 1: Type.** In `InitiativeStageCard.tsx`, add to `StagePost`: `authorCountry?: string;` (next to `authorKey`). Keep `byline` as the display name source.
- [ ] **Step 2: Byline render.** Replace the byline block (lines ~87-97) so the name + trust become a single `UserIdentity`:

```tsx
{post.byline && (
  <span className={styles.byline}>
    <UserIdentity
      name={post.byline}
      countryCode={post.authorCountry}
      trustState={trustState}
      size="sm"
    />
    {post.createdAt != null && (
      <span className={styles.date}>{formatTimeAgo(t, post.createdAt)}</span>
    )}
  </span>
)}
```

Update the import (line 3): drop `TrustBadge`, add `UserIdentity`. The `trustState` prop type on line 27 currently borrows `TrustBadge`'s — repoint it to `UserIdentityProps['trustState']`.

- [ ] **Step 3: Populate `authorCountry`.** Grep for where `StagePost` objects are built (`grep -rn "byline:" src`). At each site that has the author's profile, add `authorCountry: profiles[authorKey]?.country`. Where the profile isn't readily available, omit (flag won't render; shield still does).
- [ ] **Step 4: Type-check.** `npm run build` clean.
- [ ] **Step 5: Visual verify.** A stage feed using `InitiativeStageCard` (Home → tap a card; or `/stage/*`) at 360px light + dark — byline shows flag + name + (verified) shield.
- [ ] **Step 6: Commit.**

```bash
git add src/components/initiative/InitiativeStageCard.tsx
git commit -m "refactor(identity): UserIdentity byline in InitiativeStageCard via StagePost.authorCountry"
```

---

## Task 8: Remove dead button CSS + migrate the Members buttons

7 of the 8 global button classes have zero consumers; `.login-button` is applied redundantly in `LoginPage` alongside its own module class. Delete all 8. Migrate Members' three ad-hoc buttons to `<Button>`. The 170 remaining raw `<button>`s across 62 files are the **documented bespoke exceptions** (icon-squares, list-rows, card toggles) — **left as-is** per `DESIGN_SYSTEM.md` → "When to reach for `<Button>`"; not silently swept.

**Files:** `src/styles/globals.scss` (lines 79-170), `src/pages/LoginPage.tsx:253`, `src/components/community/Members.tsx` + `Members.module.scss`.

- [ ] **Step 1: LoginPage.** Read `LoginPage.tsx` around line 253. If `styles.loginButton` fully styles the button, drop the global class: `className={styles.loginButton}`. (If it relied on the global class for anything, fold that into `.loginButton` first.)
- [ ] **Step 2: Delete dead classes.** In `globals.scss`, delete the entire `/* Buttons */` block: `.save-button,…,.submit-vote-button` group, `.cancel-button`, `.edit-button`, `.back-button` (lines ~79-170).
- [ ] **Step 3: Members buttons → `<Button>`.** Import `Button` from `../shared`. Replace the approve toggle (lines 59-67): pending → `<Button variant="primary" size="sm" onClick={onApprove}>{t('members.approve','Approve')}</Button>`; approved → `<Button variant="primary" size="sm" disabled>{t('members.approved','Approved')}</Button>`. Replace the join button (lines 227-234) with `<Button variant="primary" loading={isJoining} onClick={handleJoinCommunity}>{t('members.join','Join Community')}</Button>`. Remove the now-unused `.approvedButton`/`.pendingButton`/`.joinButton` rules from `Members.module.scss`.
- [ ] **Step 4: Grep gate + type-check.** `grep -rnE '(save-button|create-button|login-button|send-button|join-button|submit-vote-button|cancel-button|edit-button|back-button)' src` → no matches. `npm run build` clean.
- [ ] **Step 5: Visual verify.** Login screen, and a community Members list (with a pending member if possible) at 360px light + dark — buttons look correct, focus ring present (Tab to them).
- [ ] **Step 6: Commit.**

```bash
git add src/styles/globals.scss src/pages/LoginPage.tsx src/components/community/Members.tsx src/components/community/Members.module.scss
git commit -m "refactor(buttons): delete 8 dead global button classes; Members buttons to <Button>"
```

---

## Task 9: Create-initiative quick wins (back-button + remove quick-picks)

**Files:** `src/pages/CreateInitiativePage.tsx:139`, `src/components/shared/CountryMultiSelect.tsx`, `src/components/shared/CountryMultiSelect.module.scss`, `src/utils/countries.ts`.

- [ ] **Step 1: Bigger back-button icon.** `CreateInitiativePage.tsx:139`: `<ArrowLeft size={20} />` → `<ArrowLeft size={24} />`. (Button is 44×44 — fits; tunable.)
- [ ] **Step 2: Remove quick-picks (component).** In `CountryMultiSelect.tsx`: delete the entire `<div className={styles.quickAdd}>…</div>` block (lines ~91-118), and remove `REGIONAL_QUICK_PICKS` + `getCountryName`? — **keep** `getCountryName` (still used by `label()` at line 51), remove only `REGIONAL_QUICK_PICKS` from the import (line 7). The `SearchableSelect` search remains the sole picker.
- [ ] **Step 3: Remove quick-pick styles.** In `CountryMultiSelect.module.scss`, delete the now-unused rules: `.quickAdd`, `.quickAddLabel`, `.region`, `.regionLabel`, `.quickChip`, `.quickChipSelected` (lines ~69-151).
- [ ] **Step 4: Remove the export.** In `src/utils/countries.ts`, delete the `REGIONAL_QUICK_PICKS` export (line ~218; grep confirmed it's used nowhere else).
- [ ] **Step 5: Type-check.** `npm run build` clean. `grep -rn REGIONAL_QUICK_PICKS src` → no matches.
- [ ] **Step 6: Visual verify.** Start-an-initiative page at 360px light + dark: back-button icon is visibly larger; the country field shows only the search + selected chips (no quick-pick rows).
- [ ] **Step 7: Commit.**

```bash
git add src/pages/CreateInitiativePage.tsx src/components/shared/CountryMultiSelect.tsx src/components/shared/CountryMultiSelect.module.scss src/utils/countries.ts
git commit -m "refactor(create-initiative): larger back icon; remove country quick-picks"
```

---

## Task 10: Whitespace + AA pass

"A bit more white between text" + hold WCAG 2.1 AA. Targeted vertical-rhythm increases on the dense identity/byline + card + form surfaces, plus the AA regression gates.

**Files:** `InitiativeStageCard.module.scss`, `Members.module.scss`, `CreateInitiativePage.module.scss` (hints), `HomeView`/`StageFeedView` byline styles, `UserIdentity.module.scss`.

- [ ] **Step 1: Rhythm.** Read each module above; apply concrete increases: byline row `gap` → `$spacing-sm` where it's `$spacing-xs`; multi-line body/teaser `line-height` → `1.6`; space between a card headline and its byline → at least `$spacing-sm`; members list row vertical padding → one step up. Use tokens only; no raw px.
- [ ] **Step 2: AA gates.** Run `grep -rn 'color: $gray-400' src --include='*.module.scss'` — every hit must be `border-`/`background`/`::placeholder` (fix any standalone text `color: $gray-400` → `$gray-500`). Confirm the verified-shield + any new control still meet 44px touch where interactive (the shield is non-interactive).
- [ ] **Step 3: Type-check + visual.** `npm run build` clean. Screenshot Home feed, a stage card (collapsed + expanded), Members, and the create form at 360px light + dark — text breathes more; nothing overflows the 360px column; contrast holds (spot-check captions/metadata).
- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "style(rhythm): more vertical whitespace on cards/identity/forms; AA caption gate"
```

---

## Task 11: Document the changes in `DESIGN_SYSTEM.md`

**Files:** `DESIGN_SYSTEM.md`

- [ ] **Step 1:** Add a **Stage colours** subsection under Colors: the `$stage-*` set is the single source for the 5 governance-stage accents (StageStrip + create-initiative stepper); stage colour always pairs with the stage icon+label; list the 5 tokens. Note `$warning-dark` was added to complete the `-dark` set.
- [ ] **Step 2:** Add `UserIdentity` to the **Shared component inventory** table: "Inline person identity — `[flag] Name [verified-shield]`; verified-only shield (exponent); replaces the text `TrustBadge` in feed/byline contexts. `TrustBadge` remains for the dedicated verification page."
- [ ] **Step 3:** Update the **Buttons** section: note the 8 legacy global button classes (`.save-button`…`.back-button`) were removed as dead CSS; the documented bespoke-`<button>` exceptions stand.
- [ ] **Step 4:** Update the `CountryMultiSelect` row: drop "regional quick-picks" (removed) — it's now chips + search over all 197 countries.
- [ ] **Step 5: Commit.**

```bash
git add DESIGN_SYSTEM.md
git commit -m "docs(design-system): document \$stage-* tokens, UserIdentity, button + quick-pick changes"
```

---

## Self-Review

**Spec coverage** (roadmap §5 Session 1):
- Reduce/clean colour + fix dark-mode clash → Tasks 1-4 (canonical `$stage-*`, dead-token removal, teal/orange remap, hex migration). Dark mode confirmed token-clean by audit; harmonised palette removes the saturated clash.
- Consolidate buttons → Task 8 (delete 8 dead classes + Members migration; bespoke exceptions documented, not swept).
- Identity component (flag + shield-exponent) → Tasks 5-7 (build + adopt at ~8 sites; `IdentityTrust` keeps full badge).
- Whitespace/AA → Task 10. Create-initiative back-button + remove quick-picks → Task 9. Docs → Task 11. **All covered.**

**Placeholder scan:** No "TBD"/"handle the rest". Sweep tasks (3, 4, 6, 7) name every target file+line from grep/audit and give the exact transform + a worked example; the executing agent reads each named file and applies the rule. Stage-hex values are concrete (and flagged tunable at the Task-2 live-verify gate).

**Type/name consistency:** `UserIdentityProps` shape is defined in Task 5 and consumed verbatim in Tasks 6-7; `$stage-*` token names are identical across Tasks 1, 2, 11; `$warning-dark` defined in Task 1, used in Task 4.

**Known revision from roadmap:** `$brand-gradient-*` is **kept** (LoginPage hero uses it) — only its Solutions-stage use is replaced by `$stage-solutions`. (Roadmap said "retire purple"; the audit corrected this. If Eston wants the login hero re-themed off purple, that's a small separate add — flag at review.)
