# Gloki — Whole-Platform Hierarchy & Accessibility Review: Pathways Forward

**Date:** 2026-06-20 · **Branch:** `ui` · **Status:** decision doc, nothing built yet · **★ gating decisions LOCKED 2026-06-20** (see "Decisions" below)

## How this was produced

A 47-agent review ran over **15 surfaces** (the 5 Eston named + the rest of the
platform). Each surface went through three stages — **Diagnose** (hierarchy + WCAG 2.1 AA
audit) → **Generate 2–3 competing design directions** → **Adversarial critique** (score each,
recommend one) — followed by a **cross-cutting synthesizer** and a **completeness critic**.

**192 findings**: 4 blocker · 75 high · 70 medium · 43 low.
Roughly half are the hierarchy/clutter/CTA problems Eston named; roughly half are accessibility.

| Finding category | Count |  | Category | Count |
|---|---|---|---|---|
| a11y-screenreader | 31 |  | redundancy | 17 |
| hierarchy | 28 |  | consistency | 13 |
| a11y-contrast | 23 |  | copy | 12 |
| a11y-touch | 20 |  | nav | 5 |
| cta | 19 |  | a11y-focus | 4 |
| clutter | 18 |  | a11y-keyboard | 2 |

> **This is a pathways/decision doc, not an implementation spec.** No code has been touched;
> `ui` is untouched. Pick directions → a second pass writes the implementation plan (per wave)
> and builds it. Every recommendation was checked to be implementable inside the existing design
> system and the UI↔service seam (no backend behaviour proposed).

## The verdict in one line

**The problems are systemic, not per-page.** All 15 surfaces draw from a small set of shared
root causes. Fixing ~5 shared things (one header, one disclosure pattern, one CTA rule, one
pipeline cue, one contrast sweep) fixes most of the platform at once — your specific complaints
about the mandate page, discussion page, problem card, and community cards are all instances of
the same four or five patterns.

## Your six directives, confirmed in code

All six were treated as **fixed intent**, and the diagnosis confirmed each is real:

1. **Collapse nav into one global header / kill duplicate titles** — confirmed: `GlobalHeader`
   (logo+hamburger) and a heavy 3-layout `PageHeader` both render on the same screens; the title
   appears twice; the community name is absent from persistent chrome.
2. **Cut clutter, hide rules behind an (i)** — confirmed: explanatory/threshold prose sits
   permanently above the task on ~12 surfaces; the Problem card stacks ~8 blocks; threshold text
   is duplicated.
3. **One clear hierarchy + one obvious CTA per card** — confirmed: no single primary action on
   most surfaces; ActivityCards are inert disclosure rows; "See all" appears 5× on Home.
4. **Country selection → searchable dropdown** — confirmed: 3 surfaces hardcode 4–5 country chips
   instead of using the existing `SearchableSelect` over all 197 countries.
5. **Rename Proposals → Solutions everywhere** — confirmed ~13 string sites + i18n; the vocab
   already partly exists ("Proposed solutions").
6. **Make each stage's move toward the mandate legible** — confirmed: progression is invisible on
   most stage surfaces; `JourneyRecap` lists stages but never states the throughline.

---

## Root causes — the 9 cross-cutting patterns

1. **Double top-bar chrome + buried/duplicated titles** (10 surfaces) — no single global header.
2. **Rules/how-it-works/threshold copy crowding the task** (12 surfaces) — no disclosure pattern.
3. **No single obvious primary CTA; the real action is buried, ambiguous, or out of thumb zone** (12 surfaces).
4. **Stage→mandate progression is invisible** (10 surfaces) — legitimacy not legible at a glance.
5. **Recurring AA contrast failures** (11 surfaces) — status-colour-as-text, `$gray-400`/opacity-dimmed captions, colour-only state.
6. **Missing screen-reader semantics** (13 surfaces) — broken/absent heading order, unlabeled icon-only controls, colour-only meters.
7. **Country selection as hardcoded chips** (3 surfaces) — instead of the shared `SearchableSelect`.
8. **"Proposals" → "Solutions" rename not applied** (6 surfaces) — vocabulary contradicts the agreed pipeline.
9. **Hand-rolled chrome instead of shared primitives** (6 surfaces) — token-debt + state divergence.

---

## The plan: 8 moves in 4 waves

Ranked by leverage (most impact first). The first move is the keystone — it is the literal root
cause of pattern 1 and unlocks patterns 2, 4, and 6.

| # | Move | Why it ranks here | Effort |
|---|------|-------------------|--------|
| 1 | **Build ONE global `AppHeader`; delete `PageHeader`** (migrate all 8 callers + CommunityView) | Root cause of the double-bar, every duplicate title, the buried community name, and a cluster of AA/focus/landmark defects across 10/15 surfaces. Once it owns the single `<h1>` + community-name line, most downstream heading fixes become *deletions*. Hosts the (i) and the pipeline cue. | L |
| 2 | **AA token-contract sweep** (status-colour-never-as-text; `$gray-500` captions, no opacity; community/stage cues on the `$info-on-surface` Badge tone; state never colour-alone) + DESIGN_SYSTEM regression greps | Same 3–4 defects recur on nearly every surface; fix is **token-only, no new colours** (every AA-safe token already exists); greps stop regressions permanently. Lowest risk; runs in parallel with everything. | M |
| 3 | **"One primary action per screen" standard** via `Button size='lg'` (48px) in the thumb zone, demoting competitors, binding each CTA to its referent | "No obvious CTA / ambiguous referent" is your most-repeated complaint; it's a usage rule over an existing component (near-zero new code). Must follow #1 so the header never hosts a page CTA. | S |
| 4 | **Reframe `JourneyRecap` → "how this mandate was earned"** on the mandate surfaces. **No dedicated header pipeline rail** — Eston's call: the global 64px StageFooter already carries stage context, so don't add redundant chrome. *At most* a small, limited "Step N of 5" text cue where there is genuinely no footer context (community cards, create flow), used sparingly. | The stage→mandate throughline needs *stating* only where it's genuinely absent (the mandate document), not duplicated everywhere the footer already implies it. Smaller than first scoped. | S |
| 5 | **Standardise the (i)-icon → Modal disclosure** for all rules/explainer/threshold-prose — **keeping threshold NUMBERS inline** | Your explicit "hide the rules behind a tappable (i)" directive; applies to ~12 surfaces. Presentational re-homing; sequence after #1 (hosts the (i)). | M |
| 6 | **Coordinated app-wide "Proposals" → "Solutions" rename** (label-only via new `stage.solutions`/`nav.solutions` keys; keep contract id `proposals`; en/fr/sw in lockstep) | Self-contained; unlocks the pipeline-cue/stage labels. Must be one pass to avoid a same-screen split-brain. Swahili word is the only human gate. | S |
| 7 | **One shared country `SearchableSelect`-with-chips wrapper** replacing all hardcoded chip sites | Contained, directive-closing, reused by 3 surfaces; removes the 190+-country exclusion on a global-democracy app. | S |
| 8 | **"Use the kit" + "semantic floor" pass** (Banner/EmptyState/Button/AuthorTag swaps; one `<h1>`; aria-labels + aria-pressed/expanded with counts; numeral-first meters; labeled inputs; `role=alert`; land the `Communities.tsx` i18n gap) | Broad-but-shallow connective tissue that lets the four standards hold. The `Communities.tsx` i18n gap inside it is itself a hard fr/sw blocker. | M |

### Sequencing (4 waves; verify each at 360px light **and** dark, en/fr/sw, before the next)

- **Wave 0 — decisions + baseline (parallel, no UI risk):** lock the gating decisions below;
  run the **AA token sweep (#2)** immediately — it's token-only, touches every surface, carries
  no layout risk.
- **Wave 1 — the spine:** build the single **`AppHeader` (#1)** and delete `PageHeader`, migrating
  all callers in one batch. Collapses every double-bar, kills every duplicate title, surfaces the
  community name, establishes the single `<h1>`.
- **Wave 2 — standards hung on the spine (largely parallel):** (i)→Modal disclosure **(#5)**;
  `<PipelineCue>` **(#4)** + JourneyRecap reframe; "one primary action" CTA standard **(#3)**;
  the **Proposals→Solutions rename (#6)** (must precede/accompany the pipeline-cue label + footer tab).
- **Wave 3 — consolidation + semantic floor (overlaps Wave 2):** country widget **(#7)**; "use the
  kit" swaps + SR semantic-floor pass **(#8)**; the `Communities.tsx` i18n gap.

**Dependency chain:** AA sweep (independent) → AppHeader (unlocks single `<h1>` + hosts disclosure
& pipeline cue) → disclosure + pipeline cue + CTA standard + rename → country widget + kit/SR
consolidation.

---

## Per-surface recommendations (15)

Each surface's recommendation is the adversarial critic's pick — mostly **hybrids** that take the
strongest structural direction and graft in the one thing it gets wrong (almost always: *don't
hide a legitimacy signal to look calmer*).

1. **Global nav chrome** — Single sticky `<header>` (logo + hamburger + optional back + bell;
   community name = bold `$gray-900` primary line, stage = quiet `$gray-500` secondary line);
   delete `PageHeader` + its 3 layouts. Add a neutral pipeline cue on stage routes; long subtitle
   + per-stage rules go behind an (i)→Modal. Header **never** carries a page CTA; wordmark renders once.
2. **Published mandate** — Strip to the global header; promote `MandateCard`'s title to the page's
   single `<h1>`; delete the duplicate subtitle + generic "Published mandate" h1. Keep the compact
   JourneyRecap **visible** (add an `<h2>` "The story so far"; fix the 10px labels in place).
   "Read the full mandate" = the one primary CTA (lg/48px); "Share" = secondary.
3. **Full mandate document** — De-dupe the title (3×→1); fix the eyebrow contrast (`$primary`
   3.68:1 → `$primary-dark`). **Label the two country counts** (5 jurisdictions vs 18 deliberation
   reach) as a small ledger so the two signals stop conflating. Reframe JourneyRecap to an
   *earned-legitimacy* throughline.
4. **Problem card + Propose-a-framing** — Progressive disclosure: one hero problem statement +
   one bound CTA + **one** threshold display (kill the duplicate); move rules behind an (i), keep
   the threshold number inline. Fix the green "Second it" contrast (2.3:1) by rendering it as a
   kit Button **or** `$text-lg`/bold + `$success-dark`. Modal countries → `SearchableSelect`.
5. **Discussion stage** — Re-order & rank: single-row header (community name prominent, stage as
   eyebrow); the shared statement is the hero; participation/advance-meter stays **compact and
   visible**; positions never default-collapse for read-only members; one thumb-zone "Suggest an
   edit". Fix the ~1.9:1 threshold marker, ~4.0:1 ticker, and 32–36px controls.
6. **Solutions stage** — Collapse the **two stacked proposal UIs** into one list of Solution cards
   with one unified AuthorTag and one primary "Propose a solution". Keep merge + expert-review
   **provenance visible per-card** (don't bury it behind a tab). Accessible Support toggle
   (text + aria-pressed + count). Apply the rename here.
7. **Vote / Approval + Concerns** — A `StageHeader` owns identity + the decision `<h1>` + a stage
   rail; numeral-first vote counts (the hearts get a number); severity becomes a Badge with a
   visible word (not a colour + letter); keep the QV "piling costs more" meter **visible**; country
   modal → `SearchableSelect`.
8. **Merge proposals** — Lead with the **source initiative name** (not a truncated id); one
   primary "Accept merge" (binding) in the thumb zone, advisory For/Against clearly secondary
   above it; explicit captions "Community vote (advisory)" / "Authors' decision (binding)" + a
   consequence line. Fix sub-AA percent/proposer text, colour-only meter, sub-44px buttons.
9. **Community home / ActivityCards** — Three-level disclosure: **title-led** `<h3>` card → compact
   stage **snapshot** on tap → full panel inside a focus-trapped Modal behind one stage-specific
   "Participate" Button. Lighter 360px-safe pipeline indicator (not the literal 5-across Stepper).
   How-it-works behind an (i).
10. **Home / cross-community overview** — Anchored front door: numbered stage rail (pipeline
    legible), community-name-as-lead-line, 44px aria-labelled section headers (kill the 5×
    identical "See all"), one primary "Get started" via the first-run Banner's action slot
    (no second bottom bar over the footer). Apply the rename.
11. **Stage feed + StageFooter** — Keep **inline participation** on the feed (it's the feed-level
    legitimacy signal); add a compact "Step N of 5 · `<Stage>`" heading + 5-segment meter +
    "→ Mandate"; collapse both explainer banners behind one (i) (keep threshold numbers);
    title-first cards; footer gets a non-colour active cue + 44px + focus ring. Apply the rename.
12. **Identity cluster** — Ship the hierarchy/clutter pass **in-place** (promote per-route `<h2>`→
    `<h1>`, community names loudest, star/hide rules behind an (i), "Scan invite code" = single
    primary, raw-JSON paste collapsed). **Land the `Communities.tsx` i18n gap** (it's a hard fr/sw
    blocker). Hand-rolled JoinCommunity states → shared `Banner`. *Excludes* a shared-PageHeader edit.
13. **Create community / create initiative** — Task-first: the form is screen one; the "what is a
    community / 5 stages" prose collapses behind an (i); keep a compact read-only pipeline strip;
    one `<h1>` + one thumb-anchored CTA. Fix dark-mode hint contrast, sub-44px back/remove/chips,
    unlabeled evidence inputs, colour-only country chips.
14. **Secondary tabs (chat/currency/members)** — Shared header on all three (community name +
    optional back); strip duplicate h2s; Currency explainer behind an (i)→Modal (not deleted);
    recipient picker → `SearchableSelect` of real names; fix 40px send/back, ~3.4:1 member-key text,
    border-only focus on compose inputs.
15. **Welcome / login** — Cut 6→4 welcome steps; delete the duplicated LoginPage field-hints +
    collapse the explainer into one (i)→Modal; state "one person, one vote" **once** and recolour
    it off the failing 3.68:1 blue; "Continue with this key" CTA; fix the 40px generate-key button
    (needs lg/48px) and 32px Stepper markers.

---

## Coverage gaps — what the review flagged it missed

The completeness critic identified real holes. **Recommendation: fold the top 4 into the relevant
waves** rather than treat them as a separate project.

**High-leverage misses (recommend including):**
- **App-shell chrome** (`App.tsx` "Validating session…", Suspense fallbacks, `ErrorBoundary`
  "Something went wrong", per-screen error messages) is **hardcoded English, raw divs, no i18n,
  bypasses the kit** — and there's **no `path='*'` 404 route** (unknown URL = blank screen). Global,
  contradicts the i18n + seam standards. → fold into Wave 3.
- **`prefers-reduced-motion` essentially absent** — only 2 hits across 56 animated SCSS files.
  Clean systemic WCAG 2.3.3 fix. → fold into the AA/Wave-0 sweep.
- **No skip-link + no `<main>` landmark** app-wide, despite a persistent header + 64px footer on
  every route. → fold into Wave 1 (with the AppHeader).
- **Header text-overflow** — `PageHeader` h1 is `flex-shrink:0` with no ellipsis; a long title or
  the longer fr/sw string pushes the bell/back off a 360px screen. → naturally fixed by the new AppHeader; verify.

**Whole surfaces never reviewed (flag for a follow-up pass):** the mandate **AdoptionFramework**
("From mandate to action") + AdopterModal — *the part that proves a mandate yields real action*;
the mandate **not-found** deep-link state (`getPublishedMandate(undefined)` always returns the
flagship); the **QR scanner** camera-denied path (no manual-entry fallback); the **connectivity
layer** for the Global-South audience (DataSaver/SmartImage/SyncBadge integration); `CommunitySettings`;
`IdentityCardSVG` export; the web-of-trust **endorsement/role** chrome; Currency **send-money** states;
Discussion **co-presence** + merge/roles flow internals; and the `/lab/presence` **dev route shipping
to prod** (worth removing).

**Other issue-classes under-covered:** optimistic-write failure/rollback UX; aria-live for async
updates; onboarding mid-flow refresh/back; first-run vs returning-user divergence; loading/skeleton
consistency; dark-mode verification of the missed surfaces.

---

## Decisions needed

Most of the ~50 open questions can be answered during the build. **Five are load-bearing and gate
Wave 0/1** (marked ★). I'm asking those now; the rest are grouped by surface below for when we plan
each wave.

### ★ Gating decisions — LOCKED 2026-06-20
1. **AppHeader look → LIGHT top bar.** Clean light header everywhere (logo, hamburger, optional
   back, bell, prominent community name). The dark `$gray-800` hero is retired as chrome (may
   survive as an in-content Home banner).
2. **Pipeline cue → NONE dedicated; rely on the StageFooter.** Eston: "this is clear because of the
   footer. If we DO add anything it should be small and limited." So: no header rail; the
   `JourneyRecap` *earned* reframe stays (the mandate is where the throughline is told); any extra
   cue elsewhere must be a small, limited text marker, used sparingly.
3. **Rename scope → APP-WIDE, one pass.** Flip every user-facing "Proposals" label across all
   surfaces + en/fr/sw in lockstep; contract id stays `proposals`. (Swahili word still to confirm
   via native review.)
4. **Guiding principle → KEEP governance signals + inline participation visible.** Cut prose/rules
   behind the (i), but never hide sources, tallies, the advance meter, or inline stake/vote to look
   calmer. This standing rule resolves most of the surface-level legitimacy-vs-minimalism questions
   below in favour of *keep it visible*.
5. **Initiative title placement** — to confirm when we plan Wave 1: as the page's first in-content
   heading (recommended) vs a third header line.

### Surface-level questions (decide per wave)
- **Header:** member-count chip in community-header? · bell on every inner page now? · keep the dark brand hero as an in-content banner below the header, or drop it?
- **Mandate:** dark vs light header on `/mandate` specifically · add an opt-in back button to the shared homepage branch or wrap in a separate shell · compact JourneyRecap label fix (scroll vs fewer/larger steps).
- **Full mandate:** "Applies-in" vs "Shaped-by" governance wording (translates to fr/sw) · 12-month duration placement · optional three-signals explainer behind an (i)?
- **Problem card:** is a persistent "N sources" count chip enough, or must Sources + "Who it affects" stay fully visible at the moment of seconding? · **approve a SCSS-token-only edit to `ProblemVoteFlow.module.scss`** (no markup change) to fix the green-button contrast? · multi-country UX = pick-one-at-a-time + removable chips (confirm) and offer KE/NG/MW/CD as quick-picks?
- **Discussion:** keep the live CoPresenceBar (trust signal) or cut it for focus? · the PositionsBoard category "Solutions" now **collides** with the Solutions stage name — rename the category (e.g. "Ideas")? · advance-meter under the hero vs pinned above the footer.
- **Solutions:** embedded list (cheapest) vs a dedicated full-screen workspace (more consistent with Discussion, costs a route) · OK to demote merge/expert-review to per-card affordances? · Support-toggle wording "Support/Supported"? · confirm "Solutions" as the label (key stays `proposals`).
- **Vote/Concerns:** drop straight into voting or keep a read-only review step first? · QV explanation fully behind the (i) or one line always visible? · ship full "High/Medium/Low" words (needs fr/sw)? · land as one batch or split (AA-first / StageHeader-restructure)?
- **Merge:** confirm "Accept merge" (binding) is the single primary · community-vote verbs "Support/Oppose" + advisory/binding captions · can a decider also cast a personal vote, or read-only?
- **Community home:** "Participate" opens a Modal on the feed vs navigates to the dashboard (note: only `/discussion` has a dedicated route — others land on InitiativeDashboard) · pipeline indicator form at 360px · defer the collapsed-row live signal to the snapshot (avoids extra reads on the external drive)?
- **Home:** suppress "Join/create" for users who already have communities? · label the Mandate row "Final decision" vs "Mandate" vs "Recent decisions" · show the per-stage tally now (only `problem` samples have one) or defer?
- **Stage feed:** **keep inline participation** (the core call — everything hinges on it) · rename this screen only vs app-wide · first-run auto-open the rules (i)? · sample cards → shared EmptyState?
- **Identity:** OK to move the star/hide explanation behind an (i)? · page title semantically `<h1>` but visually small? · delete the perpetually-disabled Join button and auto-advance on valid invite? · dashed "create" border → `$gray-500` (heavier) to clear 3:1?
- **Create flows:** keep an always-visible read-only stage strip or hide it too? · true multi-country select vs single primary country? · extend shared GlobalHeader vs a page-local bar? · reduce framing to "problem"→"initiative", CTA stays "Start an initiative"?
- **Secondary tabs:** Currency/Members explainers behind an (i) vs re-homed to About · how dominant must the community name be (needs a PageHeader size variant)? · any persistent Chat/Currency/Members switcher, or is the slide-out menu the only switcher? · keep the full public key on member rows, truncate, or hide?
- **Welcome/login:** LoginPage h1 "Welcome to Gloki" vs "Your Gloki identity" · confirm 6→4 steps (highest-surprise change) · hide the server-URL field behind "Connection settings"? · "Continue with this key" vs neutral "Continue" · which copy is the canonical "one person, one vote".
- **Swahili:** confirm the term for "Solutions" (fr is clean "Solutions"; sw proposed "Suluhu" vs existing "Suluhisho") — routes through the pending fr/sw native review.

---

## Recommended next step

1. Lock the **5 gating decisions** (the ★ set).
2. **Wave 0 immediately:** the AA token-contract sweep + `prefers-reduced-motion` — token-only, no
   layout risk, touches every surface, ships independently.
3. Then a focused **implementation plan for Wave 1 (the `AppHeader`)** — the keystone that turns
   most downstream fixes into deletions.

Full raw output (all 192 findings with file:line evidence, all 45 directions with concrete change
lists) is retained from the review run and can be expanded per surface when we plan each wave.
