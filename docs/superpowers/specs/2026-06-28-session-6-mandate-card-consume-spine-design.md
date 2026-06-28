# Session 6 — Mandate card/page redesign + CONSUME the commitments/metrics spine

**Date:** 2026-06-28
**Branch:** `ui`
**Roadmap:** `docs/superpowers/specs/2026-06-25-design-consistency-pipeline-redesign-roadmap.md` §5 Session 6 (the final session; closes the fixed S4 → S5 → S6 chain)

## Why

S4 **authored** the commitments + expert-metrics spine on each solution; S5 **carried** it onto the ballot. S6 **consumes** it: the published Mandate's "What we commit to" (articles) and "How we'll know it's working" (indicators) become **derived from the winning solution** instead of hand-authored fixtures. The words a community wrote as commitments — and the metrics an expert attached — surface as the binding mandate. This session also redesigns the Mandate card/page.

## Locked decisions (from the brainstorm)

1. **Derivation strategy — read-back + fallback.** A new `useMandate(initiativeId)` hook resolves the initiative's vote + proposals contracts exactly like `QVFlow` (a 2nd `useFlowContract` on `${initiativeId}_proposals`), finds the winner via `qvApi.getResults` (max id), joins it to its `approvalApi.getProposals` twin, and derives `articles`/`indicators` from the winner's `commitments` + flattened `expertReviews[].metrics`. **Graceful fallback** to the hand-authored `MANDATES_BY_KEY` fixture when an initiative has no spine. The non-derivable fixture parts (preamble, provenance, adopters, jurisdiction `countries`, the new `problem`) **stay fixtures**.

2. **Shape mapping — body-only, rendered gracefully.** The spine is plain strings; the mandate types are richer. Map:
   - `commitment` → `MandateArticle { id: 'art-N', title: '', body: commitment }`
   - `metric` → `MandateIndicator { label: metric, target: '' }`
   `MandateDocument` skips the `<h3>` article title when empty and drops the right-aligned target column when target is empty. `buildSpec()` keeps its existing keys with empty strings for the absent fields so the JSON stays well-formed. No invented prose. (Consequence: the derived `adaptation` articles lose their current hand-authored headings — accepted.)

3. **Seed scope — adaptation only.** Add an `adaptation` entry to `PROPOSAL_COMMITMENTS_BY_KEY` + `PROPOSAL_EXPERT_REVIEWS_BY_KEY` in `fixtures/deliberation.ts`, on the qv-winning proposal (**index 2, the LAST index**, because `qvAllocationPattern` elects the last proposal — an initial v10 seeded index 0, but the fund proposal only wins at the last index; fixed in FX1). Bump `DEMO_VERSION` `global-v10` → `global-v11`. `privacy` and others derive naturally when they reach mandate, or use the fixture fallback.

4. **Problem line — new hand-authored fixture field.** Add `problem: string` to `PublishedMandate` (fixture-side, like `preamble`; does NOT derive). adaptation: "Frontline communities face climate disasters without the resources to adapt." Renders as the card's Problem row.

5. **"Show your support" routes to the mandate stage host (decision B).** The card's primary CTA routes to the initiative's mandate-stage host where `ConvictionStaking` already lives (gated by `StageGate`), reusing the built control rather than adding a conviction section to the page.

## The redesigned Mandate card (final, validated at 360px)

`MandateCard.tsx` is rebuilt around a single label-left list. Top-to-bottom:

- **Eyebrow** — a lucide `ShieldCheck` icon + "Gloki Mandate" (uppercase, tracked, brand-colored). Brand only — the old "Verified members / one person, one vote" authority line is **removed**. The "A global community mandate" subtitle is **removed**.
- **Title** — `mandate.title`.
- **Unified rows** (label column ~82px, value column flexible; hairline divider between rows):
  - **Problem** — `mandate.problem` (muted).
  - **Mandate** — the derived winning-solution text in a **tinted boxed value** (the hero). Under the "Mandate" label, an **understated "View full →"** text button that opens the full document (the detail).
  - **Reach** — "{participants} people across {provenance.countries} countries" + sub "over a year of open deliberation".
  - **Jurisdiction** — a **two-column list** of `mandate.countries` (flag + name) + an understated **"View all →"** button (shows all when few; earns its keep when a mandate binds many — and the same structure scales to a national mandate of 1 country).
  - **Conviction** — "Backed by {convictionBackers}" + sub "in sustained conviction".
- **Actions row** — primary **"Show your support"** (heart icon) → mandate stage host (decision B); secondary **"Share"** beside it.
- The `JourneyRecap` "Chosen · Deliberated · Proposed · Voted · Mandate" breadcrumb is **removed** from the card (it tested as unclear).

The winning-solution text in the Mandate box = the derived winner (top `qv.getResults` proposal text), falling back to `provenance.voteWinner`. It must agree with the seeded winner — the adaptation seed guarantees this (winner index 0 == voteWinner).

## Preview → detail hierarchy

- The **bottom-nav "Mandate" tab** (`/stage/mandate`) is the **preview** surface; the redesigned card is the preview.
- **"View full →"** (in the Mandate row) is the path to the **detail**: the full `MandateDocument` (articles + indicators + machine-readable spec). On the standalone `MandatePage` (`/mandate/:communityId/:mandateId`) the card remains the hero above the document; "View full" scrolls to the `MANDATE_DOC_ANCHOR_ID` document as today.
- **"Show your support"** is the engagement path → mandate stage host with `ConvictionStaking`.

## Components & files

| File | Change |
|---|---|
| `src/services/demo/fixtures/mandate.ts` | Add `problem: string` to `PublishedMandate`; author adaptation's `problem`. Articles/indicators stay on the fixture as the **fallback** shape (no longer the primary source for seeded initiatives). |
| `src/hooks/useMandate.ts` (NEW) | The derivation layer. `useMandate(initiativeId)` → `{ mandate: PublishedMandate, loading }`. Resolves vote + proposals contracts (QVFlow pattern), derives articles/indicators from the winner's spine, merges over the fixture (fallback to fixture articles/indicators when no spine). `// FOR OURI` documenting the read path. **No new contract methods** — reads existing `qvApi.getResults` + `approvalApi.getProposals`. |
| `src/components/mandate/MandateCard.tsx` (+ `.module.scss`) | Full redesign per above. New eyebrow, unified rows, boxed Mandate value, "View full" link, two-column Jurisdiction + "View all", "Show your support" primary CTA, Share secondary. Remove `.decided` box, the 3 boxed signals, the JourneyRecap breadcrumb. New props: `onShowSupport`, `onViewAllCountries` (or internal modal). |
| `src/components/mandate/MandateDocument.tsx` | Render gracefully when article `title` / indicator `target` are empty. `buildSpec()` unchanged in shape (empty strings allowed). |
| `src/components/mandate/MandatePage.tsx` (+ `.demo.ts`) | Read route params (`communityId`, `mandateId`) via `useParams` and feed `useMandate(initiativeId)` instead of `getPublishedMandate(undefined)` (today it ignores params — `// SEAM (Ouri)`). Wire "Show your support" → mandate stage route (decision B). |
| `src/services/demo/fixtures/deliberation.ts` | Add `adaptation` entries to `PROPOSAL_COMMITMENTS_BY_KEY` (on the winning proposal) + `PROPOSAL_EXPERT_REVIEWS_BY_KEY`, aligned to `provenance.voteWinner`. |
| `src/services/demo/mockApi.ts` | `DEMO_VERSION` `global-v9` → `global-v10`. |
| `src/i18n/fr.ts`, `src/i18n/sw.ts` | New user-facing strings at fr + sw key parity (en inline via `t('key','English')`). Append to `docs/i18n-native-review-candidates.md`. |

## Derivation shape (`useMandate`)

```
useMandate(initiativeId):
  fixture = MANDATES_BY_KEY[initiativeId] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY]
  resolve voteContract (useFlowContract, parent=initiativeId, stageKey='voteContractId')
  resolve proposalsContract (useFlowContract, `${initiativeId}_proposals`, stageKey='proposalsContractId')
  results = qvApi.getResults(voteContract)          // Record<id, sqrtVotes>
  proposals = approvalApi.getProposals(proposalsContract)
  winnerId = argmax(results)
  winner = proposals[winnerId]
  if winner?.commitments?.length:
     articles = winner.commitments.map((c,i) => ({ id:`art-${i+1}`, title:'', body:c }))
     metrics  = (winner.expertReviews ?? []).flatMap(r => r.metrics)
     indicators = metrics.map(m => ({ label:m, target:'' }))
     winnerText = winner.text
  else: fall back to fixture.articles / fixture.indicators / provenance.voteWinner
  return { ...fixture, articles, indicators, /* winnerText surfaced for the Mandate box */ }, loading
```

The Mandate-box text uses `winnerText` (derived) and falls back to `provenance.voteWinner`. While contracts resolve, render the fixture (no spinner-only state — graceful progressive enhancement).

## Integration risk (verify first in the plan)

`MandatePage` today ignores route params. The key unknown: does the route's `:mandateId` (passed as `item.id` from the feeds) equal the `initiativeId` used as `parentContractId` when `seedDemoCommunity` deployed the vote + proposals contracts? The plan's **first task verifies** that `useFlowContract(initiativeId, …)` resolves the **already-seeded** contracts (not a fresh deploy). If the id mapping differs, resolve the mapping in `useMandate` (or `MandatePage.demo`) before wiring the rest. The mandate fixture `id` "matches initiative key", and adaptation's winner (index 0) matches `voteWinner`, so the join is sound once the id resolves.

## Out of scope / deferred

- **`scope` badge on the card** — the redesign surfaces Jurisdiction instead; not adding the global/community scope badge to `MandateActivityCard.fullPost` this session (kickoff flagged it optional).
- Seeding `privacy` (still at vote stage) or other initiatives — derive at runtime when they advance.
- `MandateEngage` conviction staking stays (do not remove — it is the only commitment control).
- The dormant `PositionsBoard`/`AnchoredThread`/etc. and other long-standing deferrals are untouched.

## Verification

- `npm run build` clean (`tsc -b`) before each commit.
- Dev server (`gloki-dev`, port 5173) at 360px, light + dark: the `adaptation` showcase renders **derived** articles/indicators that match `provenance.voteWinner`; card redesign matches the approved mockup; "View full" reaches the document; "Show your support" reaches the mandate stage host.
- i18n: fr/sw key parity check (empty diff) + code-ref↔i18n cross-check.
- AA gates: no `$gray-400` body text, ≥44px touch targets, focus rings; verify the muted Problem text and understated link colors pass contrast.
- Gate: local multi-model review panel (`/code-review`) on the session diff (no `--quit-chrome`), plus per-task + an Opus whole-branch review.
