# Mandate-page recompose — implementation plan (S32, Wave D)

> **For agentic workers:** UI-only change on a repo with **no test framework**. Each task's
> test cycle = `npx tsc -b` + `npm run build` clean + grep gates + (at the end) controller-driven
> preview. Execute **inline** (tightly-coupled cross-cutting work; controller owns the one preview).
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** Recompose the published-mandate page (top air, hero eyebrow rename, document-card status +
reorder + provenance chin, adoption card chrome) per spec
[2026-07-14-mandate-page-recompose-design.md](../specs/2026-07-14-mandate-page-recompose-design.md).

**Architecture:** Four hand-rolled sibling cards in `src/components/mandate/`. Edits are localized
per card; the only cross-file task is F2 (tsx + fr + sw). No contract/fixture/route changes.

**Tech Stack:** React 19 + TS + SCSS modules; tokens in `src/styles/variables.scss`; i18n via
`t('key','English fallback')` + fr.ts/sw.ts parity.

## Global Constraints (verbatim from spec / change-control)

- Class: **UI-only** — no `src/services/demo/` change, **no `DEMO_VERSION` bump**, no routes.
- No ad-hoc style values — every colour/space/radius/shadow/size from a `variables.scss` token
  (Sass tints `rgba($token, …)` allowed). Reviewers reject ad-hoc values.
- Strings via `t('ns.key','English default')`; copy changes touch **tsx + fr + sw, never en.ts**.
  Parity must stay **1137/1137**.
- `npx tsc -b` clean is the only CI (strict `noUnusedLocals`/`noUnusedParameters`).
- Single-h1 law: the document title stays `<h2>`; the hero title stays the page's one `<h1>`.
- Chin tokens are the one home: `$footer-surface(-dark)` / `$footer-border(-dark)`; a chin that sets
  a background re-declares bg **and** border under `@include dark`.
- `ui` runnable after every commit; small `feat(s32)`/`docs(s32)` commits.

---

### Task 1 — F1: Top air on the mandate page

**Files:** Modify `src/components/mandate/MandatePage.module.scss:3-7`

- [ ] **Step 1:** In `.page`, add `padding-top: $spacing-lg;` (below `gap: $spacing-xl;`). Do **not**
  touch `Container.module.scss`.
- [ ] **Step 2:** `npx tsc -b` clean (no TS surface, sanity only).
- [ ] **Step 3:** Commit `feat(s32): mandate page — top air above the hero card [F1]`.

---

### Task 2 — F2: Summary-card eyebrow → "Mandate summary" (D6)

**Files:** Modify `src/components/mandate/MandateCard.tsx:77,80`; `src/i18n/fr.ts:383-384`;
`src/i18n/sw.ts:382-383`. (`MandateCard.module.scss` `.brand` unchanged — generic eyebrow type.)

- [ ] **Step 1:** In `fr.ts`, replace the `'mandate.card.aria'` line with
  `'mandate.card.eyebrow': 'Résumé du mandat',` (keep `'mandate.card.brand'` line as-is).
- [ ] **Step 2:** In `sw.ts`, replace the `'mandate.card.aria'` line with
  `'mandate.card.eyebrow': 'Muhtasari wa agizo',` (keep `'mandate.card.brand'`).
- [ ] **Step 3:** In `MandateCard.tsx`, change the section open tag to use `aria-labelledby`:
  `<section className={styles.card} aria-labelledby="mandate-summary-eyebrow">`.
- [ ] **Step 4:** In `MandateCard.tsx`, give the brand span the id + new key:
  `<span id="mandate-summary-eyebrow" className={styles.brand}>{t('mandate.card.eyebrow', 'Mandate summary')}</span>`.
- [ ] **Step 5:** Parity scanner → OK 1137; grep `mandate.card.aria` in src → **zero** hits.
- [ ] **Step 6:** `npx tsc -b` clean.
- [ ] **Step 7:** Commit `feat(s32): hero eyebrow → "Mandate summary" + aria-labelledby [F2/D6]`.

---

### Task 3 — F3 + F4/F5: MandateDocument recompose

Same two files, tightly coupled → one task/commit. `src/components/mandate/MandateDocument.tsx`
and `MandateDocument.module.scss`.

**tsx changes (`MandateDocument.tsx`):**

- [ ] **Step 1 (F3 — masthead):** Rewrite the `<header className={styles.masthead}>` block so the
  eyebrow and status badge share a flex row, and the ratified date sits under the title:

```tsx
<header className={styles.masthead}>
  <div className={styles.eyebrowRow}>
    <p className={styles.eyebrow}>{t('mandate.card.brand', 'Gloki Mandate')}</p>
    {mandate.status === 'ratified' ? (
      <Badge tone="success" size="sm">{t('mandate.statusRatified', 'Ratified')}</Badge>
    ) : (
      <Badge tone="warning" size="sm">{t('mandate.statusPending', 'Pending ratification')}</Badge>
    )}
  </div>
  <h2 className={styles.title}>{mandate.title}</h2>
  {/* S17 rule: date only exists once ratified — never beside a Pending badge. */}
  {mandate.status === 'ratified' && (
    <span className={styles.ratified}>
      <CalendarCheck size={14} aria-hidden />
      {t('mandate.ratifiedOn', 'Ratified {date}', { date: ratified })}
    </span>
  )}
</header>
```

- [ ] **Step 2 (F4/F5 — move turnout + toggle to the bottom):** Delete the `<div className=
  {styles.turnout}>…</div>` block and the `<SegmentedControl … />` block from directly after the
  header. Re-insert them, wrapped, as the **last** child of the `<article>` (after the
  `{view === 'plain' && …}` and `{view === 'spec' && …}` blocks):

```tsx
<div className={styles.provChin}>
  <div className={styles.turnout}>
    <Vote size={16} aria-hidden className={styles.turnoutIcon} />
    <p className={styles.turnoutText}>
      {t('mandate.turnoutLine', '{voters} of {eligible} eligible members voted ({pct}%)', {
        voters: mandate.provenance.voters.toLocaleString(),
        eligible: mandate.provenance.eligible.toLocaleString(),
        pct: turnoutPct(mandate.provenance.voters, mandate.provenance.eligible),
      })}
    </p>
    <InfoDisclosure
      label={t('mandate.verification.title', 'How we keep the vote real')}
      className={styles.verifyInfo}
    >
      <p>{t('mandate.verification.body', VERIFICATION_STATEMENT)}</p>
    </InfoDisclosure>
  </div>
  <SegmentedControl<MandateView>
    ariaLabel={t('mandate.viewToggle', 'Mandate view')}
    fullWidth
    value={view}
    onChange={setView}
    options={[
      { value: 'plain', label: t('mandate.viewPlain', 'Plain language'), icon: <FileText size={16} /> },
      { value: 'spec', label: t('mandate.viewSpec', 'Machine-readable spec'), icon: <Code2 size={16} /> },
    ]}
  />
</div>
```

  Net order becomes: header → plain/spec body → `.provChin`.

**scss changes (`MandateDocument.module.scss`):**

- [ ] **Step 3 (F3 styles):** Replace `.metaRow` with `.eyebrowRow`:

```scss
.eyebrowRow {
  display: flex;
  align-items: center;
  justify-content: space-between;   // eyebrow left, status badge right (exactly 2 children)
  gap: $spacing-sm;
}
```
  `justify-content: space-between` puts the eyebrow at the left and the badge at the right edge —
  no `margin-left:auto` / Badge className needed (the row always has exactly the eyebrow + one badge).

- [ ] **Step 4 (F4/F5 chin styles):** Add `.provChin` and strip `.turnout`'s own surface (the chin
  now provides it):

```scss
.provChin {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  // Bleed to the card edges: cancel the .document $spacing-lg inset on L/R/bottom.
  // The flex `gap: $spacing-xl` above still provides the top separation.
  margin: 0 (-$spacing-lg) (-$spacing-lg);
  padding: $spacing-md $content-gutter;
  background: $footer-surface;
  border-top: 1px solid $footer-border;
  border-bottom-left-radius: $radius-lg;
  border-bottom-right-radius: $radius-lg;

  @include dark {
    background: $footer-surface-dark;
    border-top-color: $footer-border-dark;
  }
}

.turnout {                    // was a $gray-50 pill; the chin is the surface now
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}
```
  Delete the old `.turnout` padding/background/border/border-radius + its `@include dark` block.
  Keep `.turnoutIcon`, `.turnoutText`, `.verifyInfo` (margin-left:auto) unchanged.

- [ ] **Step 5:** `npx tsc -b` + `npm run build` clean; grep the file for raw hex/px/`rgba(`
  literals → none new; `$gray-400` gate clean.
- [ ] **Step 6:** Commit `feat(s32): mandate document — status top-right + bottom provenance chin [F3/F4/F5/D7]`.

---

### Task 4 — F6: AdoptionFramework becomes a card (D8)

**Files:** Modify `src/components/mandate/AdoptionFramework.module.scss` (`.adoption`, `.card`).

- [ ] **Step 1:** Give `.adoption` card chrome (keep `gap: $spacing-lg`):

```scss
.adoption {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding: $spacing-lg;
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;

  @include dark {
    background: $dark-bg;
    border-color: $dark-border;
  }
}
```

- [ ] **Step 2:** Fix the now white-on-white AdopterCard `.card` fill:

```scss
.card {
  /* …existing flex/gap/padding/border/radius… */
  background: $gray-50;        // was white — nested item inside the white .adoption card

  @include dark {
    background: $dark-surface;  // was $dark-bg — distinct from the $dark-bg outer card
    border-color: $dark-border;
  }
}
```

- [ ] **Step 3:** `npx tsc -b` clean; confirm the `.summary` `$info-surface` box + `$info-on-surface`
  text is untouched (dark contrast re-checked in preview).
- [ ] **Step 4:** Commit `feat(s32): adoption framework — sibling card chrome + nested item tone [F6/D8]`.

---

### Task 5 — DESIGN_SYSTEM chin-law extension (D7 cost)

**Files:** Modify `DESIGN_SYSTEM.md` §"Card chin / footer".

- [ ] **Step 1:** Add a "Provenance / utility chin (S32)" subsection: the padded-card bleed variant
  (`margin: 0 (-$pad) (-$pad)` + own `padding: $spacing-md $content-gutter` + matching
  `border-bottom-*-radius`), same `$footer-*` fill/hairline + dark re-declaration; and the carve-out
  that a provenance chin MAY carry non-action content (line, (i), toggle) — "every control is an
  action button" is scoped to **engage** chins. Cite `MandateDocument .provChin` as reference.
- [ ] **Step 2:** Commit `docs(s32): DESIGN_SYSTEM — provenance/utility chin variant [D7]`.

---

### Task 6 — i18n packet + verification + closeout

- [ ] **Step 1:** Append an "S32 (2026-07-14)" section to `docs/i18n-native-review-candidates.md`
  listing the renamed key: `mandate.card.eyebrow` (fr "Résumé du mandat" / sw "Muhtasari wa agizo"),
  noting it replaces `mandate.card.aria` (same values, now a visible eyebrow not an aria-label).
- [ ] **Step 2:** Parity scanner → OK 1137/1137.
- [ ] **Step 3:** Controller preview at 360px, light + dark, en/fr/sw on the published-mandate page —
  verify all F1–F6 acceptance points from the spec's Verification section. Screenshot proof.
- [ ] **Step 4:** Commit `docs(s32): i18n packet — S32 eyebrow key`.
- [ ] **Step 5:** Opus whole-branch review; resolve findings.
- [ ] **Step 6:** Closeout (held for push gate): MASTER_TODO §7 P8 ✅ DONE, §8 changelog, memory,
  next-session prompt. Hold the push for Eston's green light.

## Self-review

- **Spec coverage:** F1→T1, F2/D6→T2, F3+F4/F5/D7→T3, F6/D8→T4, chin-law→T5, i18n+verify+closeout→T6,
  D9 skip (no task, documented). All spec sections covered.
- **Placeholder scan:** none.
- **Type consistency:** new i18n key `mandate.card.eyebrow` used identically in tsx + fr + sw; class
  names `.eyebrowRow`/`.provChin` defined in scss (T3 steps 3-4) and used in tsx (T3 steps 1-2).
