---
name: gloki-ui-review-campaign
description: "Use when asked to run a full or partial UI review of the Gloki/Communities2 app — accessibility (WCAG/contrast/keyboard/screen-reader), usability, normalisation, standardisation, attractiveness, or beauty audits; a persona review wave; design-drift complaints ('the card design feels diluted', 'screens look inconsistent'); pre-pilot UI QA; or when triaging/promoting the findings such a review produced. Keywords: review wave, persona panel, contrast audit, 360px, token law, single h1, REVIEW-WAVE."
---

# Gloki UI Review Campaign

An executable, decision-gated campaign for the full UI review Eston asked for (2026-07-02):
**accessibility, attractiveness, normalisation, standardisation, usability, and beauty** — run
end-to-end by a session with zero prior context.

## Overview — the core principle

**Success is measured, never judged by eye.** Every phase below defines its instrument (a grep, a
computed-style read, a counted walk, a persona task-completion rate) and its expected observation.
A finding without a measurement is a hunch; log it as `note`, not as a defect. The inverse rule is
equally binding: **measure before "fixing"** — in session S9 (2026-06-30) a persona claimed
`.actionBtn` gray was "~4.0:1, below AA"; measurement showed 4.83:1, exactly the documented AA
caption token (`$gray-500`), and the correct action was a no-op. (Recorded in project memory,
2026-06.)

**Nothing in this campaign ships by itself.** The campaign session is read-only + report. All fixes
route through change control: recommend-then-confirm with Eston for anything product-adjacent, a
normal build session for the fixes, Opus whole-branch review, and Eston's explicit green light
before any push (push to `ui` IS a production deploy of the live demo). See `gloki-change-control`.

### Vocabulary (defined once)

| Term | Meaning |
|---|---|
| **Token law** | DESIGN_SYSTEM.md's one rule: every colour/space/radius/shadow/font-size/transition comes from `src/styles/variables.scss`. Sass-derived tints (`rgba($primary, 0.1)`) allowed; literal `rgba(59,130,246,.1)` and raw hex are not. |
| **North stars** | MASTER_TODO.md §1, judged in order: (1) usability first — platform KPI **≥70% of participants complete the journey unaided** on a cheap Android; (2) a felt sense of transnational collaboration. All finding severities rank against these. |
| **Persona panel** | The 9 test-user personas in MASTER_TODO.md §5 (Amara, Chidi, Thandiwe, Pascal, Dr. Giorgia, Marie, James, Tomás, Viktor). |
| **Wire names** | Contract/URL identifiers that must match Ouri's real backend: the Solutions stage is `proposals` on the wire and in URLs (`/stage/proposals`) even though the UI label is "Solutions". Never "normalise" a wire name. |
| **Kit** | The shared component library at `src/components/shared/` (barrel `index.ts`): Card, Button, Modal, EmptyState, Banner, Badge, SegmentedControl, InfoDisclosure, UserIdentity, etc. — full inventory table in DESIGN_SYSTEM.md § Shared component inventory. |
| **Co-equal blocks** | Visually equal-weight stacked sections inside one card — the S15 composition metric (see Phase 3). |

## When NOT to use this skill

| You actually want to… | Use instead |
|---|---|
| Verify a single change is done / push-ready, drive the preview browser, seed demo login | `gloki-verification-and-qa` (owns preview-automation lore: localStorage auth seeding, controlled-input tricks, eval quirks) |
| Know whether a fix is allowed, what's locked, how pushes are gated | `gloki-change-control` |
| Run the fix session that this campaign's findings produce | `gloki-session-lifecycle` (spec → plan → build → review → push gate) |
| Fix or audit fr/sw translations, parity, packet | `gloki-i18n-playbook` |
| Delete/consolidate code a finding exposed | `gloki-refactor-and-dead-code` |
| Check whether a "bad pattern" is actually settled history (deleted PageHeader, PipelineView…) | `gloki-failure-archaeology` |
| Understand why a component/route is structured the way it is | `gloki-frontend-architecture` |
| Start the dev server, fix build/deploy problems found in Phase 0 | `gloki-build-env-run` |
| Update MASTER_TODO/changelog/memory with the outcome | `gloki-docs-and-writing` |

## Fenced-off: locked product decisions (never relitigate mid-review)

These WILL show up as apparent "findings". They are Eston's locked calls; report them at most as
`note (locked)` and move on:

| Locked decision | The trap |
|---|---|
| **Brand blue**: white on `$primary` `#3b82f6` = **3.68:1**, below the 4.5:1 normal-text bar — kept deliberately (Eston's call, confirmed at Batch-8 AND Batch-9b gates; DESIGN_SYSTEM.md § Accessibility) | Do NOT darken `$primary` "to pass AA". `$primary-dark #2563eb` exists for hover/active only. |
| **One person, one vote** — trust gates eligibility, never vote weight | Don't propose weighted/reputation voting as a "usability win". |
| **4-stage browse IA**: StageFooter = "Browse by stage" with Problem/Solutions/Vote/Mandate; Discussion is per-post, no `/stage/discussion` feed (S10 IA decision) | Don't file "Discussion missing from footer" as a defect. |
| **Single AppHeader**: exactly one `banner` landmark per page, no page-CTA prop by design; PageHeader/GlobalHeader/left menu are deliberately deleted | Don't propose per-page headers, header CTAs, or a nav drawer. |
| **HomeView landing** at `/` (first-run → `/welcome`) | Don't propose landing on a stage feed. |
| **Region names stay English** (data, not i18n) | Not an i18n gap. |
| New product choices of any kind | Recommend-then-confirm with Eston; never decide unilaterally. |

---

# The campaign

Run the phases in order. Each phase ends with a gate: **expected observation → proceed; anything
else → the named branch.** Log findings as you go using the taxonomy at the end. Total shape:
Phase 0 baseline → 1 mechanical gates → 2 accessibility measurement → 3 normalisation audit →
4 persona walks → 5 attractiveness/beauty → synthesis + fix-promotion.

Environment discipline throughout: the repo sits on a slow, flaky-under-parallel-I/O USB drive —
small sequential reads, targeted greps with explicit paths, never scan `node_modules/` or `dist/`.
Subagents (Phase 4) run **sequentially** — they share one preview browser; implementers never drive
it (standing rule; incident + preview lore: **gloki-verification-and-qa**).

## Phase 0 — Baseline inventory (is the ground solid?)

All work happens against a green build at a known commit. From the repo root:

```bash
git rev-parse HEAD && git status -sb        # note the SHA; expect a clean tree on ui
npx tsc -b                                  # expect: silent exit 0
npm run build                               # expect: tsc + vite build succeed (strict mode incl. noUnusedLocals)
```

- **If `tsc`/build fails** → stop; this is not a review problem. Branch to `gloki-build-env-run`
  (and `gloki-debugging-playbook` if the failure is mysterious). Do not review a red build.
- **If the tree is dirty** → ask the user whether the in-flight work should land or stash first.

Start the preview (config `gloki-dev` in `.claude/launch.json`, port 5173; the file is gitignored —
recreate it per the `preview_start` tool doc if missing), then record the route inventory. The
route map in `src/App.tsx` is FROZEN (comment block, lines 13–31); the walk list at HEAD c26cdc4:

| Route | Page | Notes |
|---|---|---|
| `/` | HomeView (or `/welcome` redirect on first run) | cross-community overview |
| `/welcome/*` | OnboardingFlow | the unaided-journey entry |
| `/stage/problem` `/stage/proposals` `/stage/vote` `/stage/mandate` | StageFeedView | wire name `proposals`, label "Solutions" |
| `/identity/*` | IdentityView | communities/profile/join/about/contact sub-routes |
| `/create-community` | CreateCommunityPage | |
| `/community/:communityId/*` | CommunityView | feed/collab/chat/currency/members… |
| `/initiative/:host/:agent/:cid/:iid/*` | InitiativeView | the 5-stage dashboard |
| `/mandate/:communityId/:mandateId/*` | MandatePage | published mandate |
| `/lab/presence` | PresenceLabRoute | dev-only; exclude from user-facing findings |
| anything else | NotFound | check it has the AppHeader too |

Community/initiative IDs for deep routes: navigate from HomeView in the preview and copy the URLs —
they're seeded demo IDs, not stable literals. For login/demo-state seeding in the preview, use the
recipe in `gloki-verification-and-qa` (real login cannot complete in the sandbox).

**Gate:** build green + preview serving + route list confirmed → Phase 1.

## Phase 1 — Mechanical standardisation gates (grep-measurable)

These are the token-law and structure checks with exact expected baselines, **verified 2026-07-02 @
c26cdc4**. "New hits vs baseline" is the defect condition — do not file the baseline itself as new
findings.

**1a. Banned caption gray (the documented regression gate, DESIGN_SYSTEM.md § Accessibility):**

```bash
grep -rn 'color: $gray-400' src --include='*.module.scss'
```

Expected: **no matches (exit 1)** — that is the current baseline. If matches appear, each is a
defect unless it's a decorative (`border-`/`background`) or `::placeholder` use per the documented
exception. `$gray-500` is the AA caption token (4.83:1 on white).

**1b. Raw hex in component styles:**

```bash
grep -rn --include='*.module.scss' -E '#[0-9a-fA-F]{3,8}\b' src | grep -v '//'
```

Expected: **0 lines**. (7 hex strings exist at baseline, all inside `//` comments explaining token
choices — the unfiltered grep showing exactly 7 comment lines is healthy.) Any non-comment hit =
token-law violation, severity major.

**1c. Literal rgba (numeric, not Sass-derived):**

```bash
grep -rn --include='*.module.scss' -E 'rgba\( *[0-9]' src | wc -l
```

Expected: **10** — a known, reviewed baseline of black/white scrims and dark-mode alpha overlays
(QRScannerDialog, MessageDialog, Modal, Button, Badge, SegmentedControl, LoginPage shadows,
CommunityView, IdentityTrust). **>10 → new violation(s), diff against the list with the same grep
minus `wc`.** The existing 10 are cleanup *candidates* for the Wave-1.5 "design-system
canonicalization" refactor lane (MASTER_TODO §7 P6) — recommend, don't fix in-campaign.

**1d. Raw pixel values — explicitly NOT a grep gate.** At baseline there are **622** raw-px
declaration lines in `*.module.scss`, dominated by legitimate structural values (44px touch
targets, 1–2px outlines/hairlines/offsets, sr-only 1px boxes). A naive "no raw px" sweep would be a
catastrophic false-positive storm. Spacing/typography token discipline is checked by *reading
diffs* and by Phase 3's rhythm audit, not by grep.

**1e. Single h1 per rendered page — runtime check, not static.** Many files legitimately contain
several `<h1>`s (mutually exclusive render branches — e.g. `Currency.tsx` has three). The gate is
per ROUTE in the preview:

```js
// preview_eval, on each route from the Phase 0 table:
JSON.stringify({ h1: document.querySelectorAll('h1').length,
                 headers: document.querySelectorAll('header').length,  // AppHeader renders <header>; nested card <header>s would inflate this — inspect before filing
                 mains: document.querySelectorAll('main#main').length })
```

Expected per route: `h1: 1`, exactly one AppHeader banner, `mains: 1` (each page wraps content in
`<main id="main" tabIndex={-1}>` — the skip-link target). 0 or ≥2 h1s = defect (major; it breaks
the screen-reader page model the Wave-1 redesign is built on).

**1f. Kit-adoption audit (one-off patterns vs the kit).** For each kit primitive, grep for the
hand-rolled equivalent. Leads, not verdicts — confirm each by reading the component:

```bash
# hand-rolled empty states not using <EmptyState>:
grep -rln --include='*.tsx' -iE 'nothing (here|yet)|no (items|results|posts)' src/components src/pages | xargs grep -Ln 'EmptyState'
# hand-rolled modals/overlays not using <Modal>:
grep -rln --include='*.module.scss' -E 'position: *fixed' src/components | grep -viE 'modal|footer|banner|toast'
# tab-like toggles not using <SegmentedControl>:
grep -rln --include='*.tsx' 'role="tab"' src/components src/pages
```

Expected: few or no hits; each confirmed hit is a `standardisation/minor` finding ("migrate to
kit X"). The kit inventory table in DESIGN_SYSTEM.md § Shared component inventory is the authority
for what SHOULD have been used.

**Gate:** record counts vs baselines in the findings log → Phase 2.

## Phase 2 — Accessibility measurement (computed, never eyeballed)

Target is **WCAG 2.1 AA** (DESIGN_SYSTEM.md § Accessibility). Instruments: `preview_inspect`
(computed styles + bounding boxes — more accurate than screenshots), `preview_eval`, and a keyboard
walk. The contrast math below reproduces every documented DESIGN_SYSTEM ratio exactly
(3.68 / 2.54 / 4.83 — re-verified in Node 2026-07-02).

**2a. Contrast, per token pair.** Expected values (calibration gate — the measurement must land
on these; if it doesn't, your sampling is wrong before the UI is). The settled-fact HOME is
gloki-verification-and-qa "Measure, don't eyeball" + DESIGN_SYSTEM.md; if this table ever
disagrees with them, they win — update this copy:

| Pair | Expected ratio | Verdict |
|---|---|---|
| `#ffffff` on `$primary #3b82f6` | **3.68:1** | LOCKED accepted deviation — note, never fix |
| `$gray-400 #9ca3af` on white | **2.54:1** | banned for text (Phase 1a gate) |
| `$gray-500 #6b7280` on white | **4.83:1** | THE AA caption token — a claim that it fails is a faulty premise |
| Body text on its real background | ≥ 4.5:1 | defect below |
| Large text (≥24px, or ≥18.66px bold), UI components, focus rings | ≥ 3:1 | defect below |

Sweep tool: paste the IIFE from
**`.claude/skills/gloki-verification-and-qa/scripts/contrast-eval.js`** (the ONE home of the
contrast code — never fork an inline copy) into `preview_eval` and call `glokiContrast()` per
route (up to 30 failing elements; large-text 3:1 threshold and ancestor-background walk built
in), or `glokiContrast('.selector')` for a single element.

Run in **both** color schemes (`preview_resize` with `colorScheme: 'light'` then `'dark'` — the
dark palette is a separate token set and has regressed independently before). Findings that are the
locked 3.68 pair: strike them. Everything else: verify the element with `preview_inspect` (colors
list), then file with the measured ratio.

**2b. Touch targets ≥44×44px.** Spot-check every icon-only / small control on each route:

```
preview_inspect selector:'<the control>' → boundingBox.width/height ≥ 44
```

Priority suspects: header icon buttons (bell, account, back — baseline-compliant at 44px), stage
footer items, `(i)` InfoDisclosure triggers (spec says ≥44px), card expand chevrons, chip removes.

**2c. Keyboard walk + focus order.** Per route: Tab from the top. Expected: first stop is the
"Skip to content" link → `#main`; every interactive element reachable; visible 2px `$primary`
focus ring on each (DESIGN_SYSTEM § Component states — "never remove the outline without
replacing it"); Modal/InfoDisclosure traps focus, Escape closes, focus restores to the trigger
(known past bug class: disabled controls as trap edges let Tab escape — fixed with
`:not(:disabled)`, so regression-check modals with disabled buttons). Deep-link focus: after
navigating to a deep-linked initiative card, focus must land on the stable wrapper (S10: the card
remounts when `get_stage` resolves async — focus on an inner control gets dropped).

**2d. SR basics + live regions.** Per route: exactly one h1 (Phase 1e), landmarks named uniquely
(the three nav-ish landmarks — StageStrip ol, StageFooter, InitiativeStageStrip — must not share an
accessible name), icon-only controls have `aria-label`, status messages use `role="status"`/
`aria-live` (Banner bakes in `alert` for error tone, `status` otherwise). Re-announce pattern for
repeated messages is: clear synchronously, set in a `setTimeout` (separate macrotask) — same-block
reset+set gets batched and stays silent (S9). Preview automation is unreliable for focus/announce
verification — drive it yourself as controller; don't delegate to a subagent.

**Gate:** contrast sweep clean-or-filed on all routes × 2 schemes; keyboard walk done → Phase 3.

## Phase 3 — Normalisation audit (same concept, same rendering everywhere)

Instrument: counted comparison across routes, using screenshots + `preview_inspect` for the
numbers. This is the S15 method — the audit that found "accretion-dilution" was concentrated in ONE
component (SolutionsBoard, ~9 co-equal blocks) while the other 9 card surfaces held discipline.
(Recorded in project memory, 2026-07-02.)

**3a. Composition metric — co-equal blocks per card.** For every card-like surface (feed cards,
SolutionsBoard items, MandateCard, vote card, community cards): count the visually co-equal stacked
blocks a user sees before interacting. **Flag > 5.** The crisp models to compare against are the
`InitiativeStageCard` shell and `MandateCard` (S15's named exemplars); recomposed SolutionsBoard
sits at ~4. Also count nesting depth of boxed surfaces (card-in-card-in-card was the S15 smell;
depth > 2 boxed surfaces = flag).

**3b. Concept-consistency matrix.** Build a small table: rows = concepts (page header, empty
state, error state, loading state, badge/status chip, byline/identity line, back navigation,
primary CTA placement, progress bar), columns = the Phase 0 routes. Cell = which implementation
renders it (kit component vs bespoke). Every row with ≥2 distinct implementations for the same
concept is a `normalisation` finding. Known correct answers: bylines use `UserIdentity`
(flag + name + verified shield) — a truncated raw public key in a byline is a defect (S12 class);
empty lists use `EmptyState`; status colour always pairs with icon or label (never colour alone);
stage colours appear ONLY for stage/status meaning.

**3c. Spacing rhythm.** `preview_inspect` padding/gap on sibling sections of 3–4 representative
pages: values must sit on the spacing scale (4/8/12/16/24/32px). Off-scale values are token-law
leads — trace to the SCSS before filing (a computed 13px can be a scale value plus border).

**Gate:** matrix complete, block counts recorded → Phase 4.

## Phase 4 — Usability persona walks (the REVIEW-WAVE method)

Template: `docs/session-prompts/REVIEW-WAVE.md` + panel definition in MASTER_TODO.md §5. Read both
first. **One deliberate override of the template:** it says "dispatch the 9 personas as parallel
subagents" — run them **SEQUENTIALLY**. Sequential-on-shared-preview is a standing rule confirmed
by Eston (2026-07-02); the S9 incident behind it is homed in **gloki-verification-and-qa**.

Per persona (subagent or self-driven, one at a time):
1. Assume the persona fully (country, language, device, literacy, motivation, lens).
2. Attempt the wave's key journeys **on the live preview** (`mcp__Claude_Preview__*` tools), at
   **360px width** (`preview_resize` width 360 — the flagship cheap-Android bar; the mobile preset
   is 375, use the explicit 360), in the persona's locale (`localStorage.setItem('gloki.locale','fr')`
   for Pascal, `'sw'` for Amara's Swahili pass). Review the running UI, never the code.
3. Judge against the two north stars: could *I* complete the task **without help** (the ≥70%
   unaided KPI framing — each persona's walk is a sample toward it; record complete/stalled/gave-up
   per journey so the synthesis can report an unaided-completion fraction across personas ×
   journeys)? Did I *feel* I was building something with people in other countries?
4. File findings as: severity (blocker/major/minor) + screen/step + what went wrong + concrete fix.

Persona-specific must-checks are listed in REVIEW-WAVE.md (Thandiwe: no jargon, icons+words,
slow-connection path; Pascal: complete French, nothing politically over-exposing; Tomás:
keyboard-only + labels + contrast — cross-fill from Phase 2 rather than re-measuring; Viktor:
consent, data use, "how my vote is counted" transparency; Dr. Giorgia: deliberation visibly
precedes voting; James: mandate credibility).

Trap for persona claims: personas assert measurements ("contrast is 4.0:1", "this key is
missing"). **Verify every quantitative persona claim against DESIGN_SYSTEM + a Phase 2-style
measurement before filing** (the S9 lesson). And a persona hitting a permission wall on vote/
mandate stages is often the trust model working as designed (fresh user = 2 vouches = not
verified) — check `gloki-governance-domain` before filing "can't vote" as a blocker; the `digital`
community's proposals+vote stages are deliberately open to 'anyone' for exactly this reachability.

**Gate:** 9 walks done, findings deduped (multiple personas hitting the same wall = priority
signal) → Phase 5.

## Phase 5 — Attractiveness & beauty (measurable proxies first, taste last)

The only partially-subjective phase. Squeeze it through proxies before any taste call:

| Proxy | Instrument | Flag when |
|---|---|---|
| Hierarchy depth | Count distinct type sizes/weights visible per viewport (`preview_eval` over computed font-size/weight) | > 4 distinct levels on one screen (the type scale has 4: xl/lg/sm/xs) |
| Whitespace consistency | Phase 3c rhythm data | sibling gaps varying without semantic reason |
| Information density @360px | Count tappable actions + co-equal blocks in the first viewport-height per route | actions > ~6 or blocks > 5 above the fold |
| Visual noise | Count simultaneous accent colours per screen | stage/status colours appearing without stage/status meaning |
| Consistency of "crisp" | Compare each card surface to the two exemplars (InitiativeStageCard shell, MandateCard) | it needs a paragraph to explain why it differs |

Anything left after the proxies — "this gradient feels dated", "the empty-state illustration is
charmless" — is a **taste call and therefore Eston's**: collect these as a separate
"recommend-then-confirm" list with a screenshot each and your recommendation. Never implement an
aesthetic change unilaterally, and never file taste items as defects.

---

## Findings taxonomy & the report

Severity ranks against the north stars, not generic code quality (this is the house taxonomy used
by REVIEW-WAVE and every session since):

| Severity | Meaning |
|---|---|
| **blocker** | A persona cannot complete a core journey unaided, or an AA failure on a primary path (excluding the locked 3.68 pair) |
| **major** | Materially degrades the unaided-completion KPI or the felt-collaboration star; token-law violations; broken h1/landmark model |
| **minor** | Inconsistency/normalisation debt with a workaround |
| **note** | Observation, lead, or `note (locked)` for fenced decisions |

Each finding: `severity | phase/instrument | route+element | measured evidence | concrete fix |
which sibling skill the fix belongs to`. Dedupe across phases/personas; multi-persona hits rank up.

Synthesize per REVIEW-WAVE.md: ranked blockers+majors, 3–5 "biggest wins to keep", and a proposed
MASTER_TODO update (diff-style, ready for §7/§8) — **proposed**, not applied, until Eston confirms.
The campaign session itself changes no code (REVIEW-WAVE: "Do not change code in this session").

## Fix-promotion protocol

Findings become work only through the normal machinery — never patched ad hoc from the review
session:

1. Present the synthesized report to Eston; batch the decisions recommend-then-confirm (which
   findings to accept, which taste items to adopt, what to defer).
2. Accepted fixes become a normal session: spec in `docs/superpowers/specs/YYYY-MM-DD-*.md` →
   plan → build → Opus whole-branch review → **Eston's explicit push green light**
   (see `gloki-session-lifecycle`; the Opus review is the standing quality gate — the local
   multi-model panel needs separate explicit confirmation and has a near-100% false-positive
   record, see `gloki-verification-and-qa`).
3. Design-drift fixes are **recomposition, never reverts** of shipped reviewed features (the S15
   rule: "restore the design" = re-compose the accreted component, e.g. inline expand folds — and
   note `InfoDisclosure` is a focus-trapped MODAL for explainer prose, NOT an accordion; per-item
   content folds use an inline expand with `aria-expanded` + chevron).
4. i18n-related fixes (English leaking, fr overflow at 360px): fix layout or key coverage via
   `gloki-i18n-playbook` — **never shorten fr/sw translations to fix a layout** without appending
   the change to the native-review packet.
5. Larger standardisation debt (the 10 baseline rgba scrims, kit migrations) → recommend routing
   into the Wave-1.5 "design-system canonicalization" refactor lane (MASTER_TODO §7 P6), not into
   the fix session.

## Known wrong paths (fenced, with the incident behind each)

- **Don't darken `$primary`** to fix 3.68:1 — locked at two separate gates; `$primary-dark` is
  hover/active only.
- **Don't add per-page headers, header CTAs, or a left menu** — PageHeader/GlobalHeader/left menu
  were deliberately deleted (Wave 1, 2026-06, "confirmed with Eston"); see
  `gloki-failure-archaeology` before resurrecting anything.
- **Don't relitigate the 4-stage browse IA** or add a `/stage/discussion` feed (S10 locked).
- **Don't grep-sweep raw px** (622 legitimate baseline hits) or mass-"fix" the 10 baseline rgba
  scrims inside the campaign.
- **Don't "fix" fr length by shortening translations** without the packet append (silent quality
  loss; the native review is human-gated).
- **Don't rename wire names while normalising vocabulary** — `/stage/proposals` and contract
  method names stay `proposal` even though every label says "Solutions" (`gloki-seam-and-demo-data`).
- **Don't file the trust gate as a usability blocker** without checking the stage-permission model —
  "the gate that makes the demo SAFE makes it EMPTY" was solved deliberately (S9) by opening only
  the `digital` community, not by weakening trust.
- **Don't review from a red PR #20** signal — its ✗ is an expected merge conflict with Ouri's
  diverged `main`, not a build failure.
- **Don't run REVIEW-AND-REFACTOR-WORKFLOW.md verbatim** — it's Wave-1-era (hard-coded lane PR
  numbers A=9…G=18, retired worktree model); mine its 8 audit dimensions for ideas, but this skill
  is the current campaign. `REVIEW-STRUCTURE.md` stays useful as the separate GitHub-hygiene
  mini-audit.

## Provenance and maintenance

Verified 2026-07-02 @ commit `c26cdc4` (branch `ui`, clean tree). Volatile facts and how to
re-verify each:

| Fact | Re-verify with |
|---|---|
| Route map (9 top-level routes, frozen) | `sed -n '13,31p' src/App.tsx` |
| Browseable stage URLs (`problem/proposals/vote/mandate`) | `grep -n "path: '/stage" src/components/shared/StageFooter.tsx` |
| gray-400 gate baseline = 0 matches | `grep -rn 'color: $gray-400' src --include='*.module.scss'` |
| Raw-hex baseline = 7 comment-only lines, 0 non-comment | Phase 1b commands |
| Literal-rgba baseline = 10 | Phase 1c command |
| Raw-px count ≈ 622 (not a gate) | `grep -rn --include='*.module.scss' -E '[0-9]px' src \| grep -vE '\$\|var\(\|//' \| wc -l` |
| Token values `$primary #3b82f6`, `$gray-400 #9ca3af`, `$gray-500 #6b7280` | `grep -nE '\$(primary\|gray-400\|gray-500):' src/styles/variables.scss` |
| Contrast expectations 3.68 / 2.54 / 4.83 | DESIGN_SYSTEM.md § Accessibility + the Node one-liner in this skill's history (math re-verified 2026-07-02) |
| Persona panel (9, names) | MASTER_TODO.md §5 |
| North stars + ≥70% KPI | MASTER_TODO.md §1 |
| Kit inventory | DESIGN_SYSTEM.md § Shared component inventory |
| S15 composition method, exemplars, block counts | project memory 2026-07-02 + `docs/superpowers/specs/2026-07-01-solutionsboard-recomposition-design.md` |
| Preview server name `gloki-dev`, port 5173 | `.claude/launch.json` (gitignored — may be absent on a fresh clone) |
| REVIEW-WAVE "parallel" wording overridden to sequential | standing rule, Eston-confirmed 2026-07-02; re-confirm with Eston if REVIEW-WAVE.md has been rewritten since |

Open/candidate items (not settled, labeled as such): the 2a sweep snippet is verified for math but
has not yet been run end-to-end against the live preview (do so at campaign time and refine the
selector list if noisy); the Phase 1f kit-adoption greps are heuristics — expect and prune false
positives; the unaided-completion fraction from Phase 4 is a *sample proxy* for the ≥70% KPI, not
the KPI itself (the real KPI needs real pilot participants).
