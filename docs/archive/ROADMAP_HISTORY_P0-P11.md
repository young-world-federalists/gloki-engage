# Roadmap history — P0 to P11, the handoff tail and the parked lists

> **Archived 2026-10-22** from `MASTER_TODO.md` §7 during a roadmap clean-up. This is a verbatim
> move: the text below is exactly what §7 said on 2026-10-22 (from `### Done` through
> `### Blocked / coordination`), nothing edited or summarised. Statuses are as recorded at the time, and some
> were already stale (for example P7's "IN PROGRESS" header, or P9's note that `NotificationsBell`
> is permanently empty, which S39 replaced). Open items from these tiers were carried into the new
> §7 "Open work" list. Read §7 for current state; read this file for evidence and history.

### Done (the build so far)

- **Wave 1** (Foundation + lanes A–G + the 2026-05-31 review wave): the 5-stage pipeline, onboarding &
  identity, deliberation/co-authoring, the three mechanisms (QV + conviction; **liquid delegation D3 still
  pending**), mandate & impact, presence/multilingual, community home. Detail:
  [docs/archive/WAVE_1_HISTORY.md](docs/archive/WAVE_1_HISTORY.md).
- **UX-overhaul arc** (the old "Batch 1 + Phases 2–5" plan — now substantially shipped): global multi-topic
  demo + cross-community Home; nav/IA pass + AppHeader; web-of-trust verification + per-stage permissions;
  stage-UX redesigns (threaded discussion, SolutionsBoard, vote card, MandateCard); welcome guide;
  whole-platform hierarchy/a11y review; full fr/sw + LanguageSwitcher.
- **Design-consistency / pipeline roadmap (S1–S6)**: the commitments→metrics spine flows end-to-end
  Solutions → Vote → Mandate. **S7** dead-code sweep + `docs/FOR_OURI_seam.md`. **S8** 3 a11y/contrast Minors
  + i18n native-review packet refresh. Per-session detail lives in project memory.

> The redesign arc is **complete**. The roadmap below is the **next build**, ordered so foundations and
> cheap high-trust fixes come first and each phase leaves `ui` runnable. It is driven by the
> **2026-06-29 nine-persona review** (see §8 changelog); severities are that panel's.

### Build order (next)

**P0 — Pilot-readiness quick wins** ✅ **DONE (S9, 2026-06-30)** *(shipped `origin/ui`; claims-honesty copy,
`digital` community opened for reachability + `databroker` initiative seeded, aria-live comment announce,
inviter-country fix, a11y micro-fixes. Detail: project memory `project_session9_jun2026`.)*
- [BLOCKER] **Claims honesty.** Reconcile copy with the real mechanism everywhere: "one person, one vote" ↔
  the quadratic ballot; "no ID papers / face scan" ↔ "confirming real-world identity"; qualify/substantiate
  "blockchain-backed / transparent". Add a plain "what's public · private · permanent" line at the **ballot**
  and the **comment composer**.
- [BLOCKER] **Make the back half reachable (demo data).** Seed ≥1 un-gated initiative sitting at Solutions &
  Vote so a fresh user can actually reach the QV ballot + interactive SolutionsBoard. Seed discussion threads
  consistently (some are currently empty but for the user's own comment).
- [BLOCKER] **A11y: announce comment posts.** Add `aria-live` status ("Comment posted") + move focus to the
  new comment on the discussion thread (WCAG 4.1.3).
- [MAJOR] **Inviter-country default bug.** Profile country pre-fills the *inviter's* country (🇮🇳) and rides
  to the profile/mandate. Default empty (or locale-guess); required + visibly unset.
- [MAJOR] **A11y micro-fixes.** Like button `aria-label` must include the count; extend the S8 `.liked` AA
  contrast fix to the base `.actionBtn` (gray-500 ≈ 4.0:1 → AA). Localize `<title>`; fix "across 1 countries"
  pluralization; add stage to the discussion `<h1>`; de-dupe the community heading; `aria-haspopup` on menu.
- [MINOR] Threshold bar reacts to an upvote (momentum); whole card tappable (not only the inner button).

**P1 — Navigation & IA** ✅ **DONE & verified (S10, 2026-06-30)** *(coherent unit; foundational to "follow
one idea through its stages"). Spec: `docs/superpowers/specs/2026-06-30-s10-navigation-ia-design.md`.*
- [MAJOR] ✅ New **`InitiativeStageStrip`** (router-aware sibling of the read-only `StageStrip` primitive)
  rendered atop the expanded `InitiativeStageCard` panel — the *follow-this-initiative* control. Highlights the
  initiative's current stage (`get_stage`); tappable **only where a real surface exists** — Discussion
  (`/initiative/.../discussion`) and Mandate (`/mandate/cid/iid`); other stages are progress markers (the inline
  dashboard exposes only the *current* stage, so there's no past-stage surface to link). Global `StageFooter`
  relabelled **"Browse by stage"** + visually demoted (caption eyebrow, lighter weight) so it reads as
  cross-community discovery, not next-step nav.
- [MAJOR] ✅ **Discussion is first-class in the strip** (all 5 stages). Per the locked IA decision the global
  *browse* footer stays 4 stages (honors S2's "discussion is per-post, not browsed" — no `/stage/discussion`
  feed exists).
- [MAJOR] ✅ Tapping a Home/feed card opens the item **in focus**. (Cards already deep-linked via
  `?initiative=` which auto-expands; the real gap was **no scroll-into-view** — fixed: `CommunityHome` scrolls
  the deep-linked card into view + moves focus to its stable wrapper, surviving the async `get_stage` remount.
  Reduced-motion safe.)
- [MINOR] ✅ **Verified MOOT — nothing dangling.** No `/stage/` nav exists anywhere outside
  `StageFooter`/`StageFeedView`. The mandate "View full" already scrolls to the same-page doc anchor; there is
  **no** provenance "Vote" link in the code (the S6 mandate redesign / S9 work removed the surfaces the persona
  review flagged). The new strip additionally gives a per-initiative path to Discussion/Mandate.

**P2 — Trust, privacy & consent depth** ✅ **DONE (S11, 2026-07-01)** *(shipped `origin/ui` @ `a112893`;
pre-gate vote explainer + read-only `VotePreview`, attributable-vote disclosure + opt-in `displayName`,
non-skippable consent w/ what-we-collect, share drops pubkey. Detail: project memory
`project_session11_trust_privacy_jul2026`).* *(builds on P0 honesty copy).*
- [BLOCKER→here] Read-only / teaser **ballot + "how this vote works" explainer** (QV cost curve; conviction's
  time dimension) visible *before* the verification gate, so the mechanism is auditable without participating.
- [MAJOR] Disclose vote visibility (secret vs attributable) at the ballot; reconcile with "open to the whole
  community". Offer a **pseudonym / display-name** option for posts & votes.
- [MAJOR] Real **consent step**: link actual privacy/data terms, list what's collected (public key, profile,
  participation/votes, server); don't let core consent be "Skip for now". Drop the full public key from
  shareable URLs.

**P3 — Evidence & expertise loop** ✅ **DONE & verified (S12, 2026-07-01)** *(shipped `origin/ui` @ `796a620`;
tsc+vite clean, preview-verified 360px light+dark, Opus whole-branch review + 5 fixes). Premise re-check found
all 3 items narrower than framed — see project memory `project_session12_evidence_expertise_jul2026`.*
- [MAJOR] ✅ Expert-review loop **enriched** (it was *enrich*, not build — the isExpert-gated submit modal
  already existed). `add_expert_review` gains **assessment + credentials + sources**; each review renders an
  attributed block (`UserIdentity` name + country + verified-shield + credentials + assessment + that
  reviewer's metrics + evidence links), and a requested review visibly **resolves** ("requested by N ·
  reviewed by {names}" / "…awaiting an expert"). Reviewer credentials captured **on the review submission**
  (decision ①). ★ Attributing a seeded reviewer needed 3 coordinated seam edits (`profileRead` expert
  fallback + community `get_partners` profile pointer + scoped `become_member`) or the byline shows the raw key.
- [MAJOR] ✅ Repeatable **Sources** field (URL + optional label, decision ②) on the solution, write-together,
  and comment composers, via new shared `src/utils/sources.ts` + `SourceLinks`/`SourcesInput` primitives;
  threaded through `add_proposal` / write-together / `add_comment` (re-fetch after write).
- [MAJOR] ✅ **Author-proposed indicator metrics** (decision ③): new `Proposal.metrics`, rendered
  "Indicators proposed by the author" — kept **out of `useMandate`** so mandate indicators stay derived from
  `expertReviews[].metrics` (expert-first spine untouched). DEMO_VERSION `v14→v15`; 27 new fr+sw keys.

**P4 — Mandate rigor (institutional credibility)** ✅ **DONE & verified (S13, 2026-07-01)** *(built on `ui`,
7 commits `271d15a..a5e664a`; DEMO_VERSION `v15→v16`; Opus whole-branch review; push pending Eston)*
- [MAJOR] ✅ Require **target + baseline + measurement cadence** per indicator before ratification. `MandateIndicator`
  gains `baseline`/`cadence`; new host/expert-gated **"Prepare for ratification"** panel (`RatificationPanel`,
  gated via `getInitiativeRoles`) writes a `mandate_ratification` JSON property on the initiative contract (new
  additive `set_property`/`get_properties`, mirroring the community contract); `useMandate` merges per-indicator
  by label and reads `status:'ratified'` only when every indicator is complete (else `'published'` + a "pending
  ratification" badge on card/document). (`articles[].title` stays derived-empty — out of P4 scope.)
- [MAJOR] ✅ **Turnout denominator** (X of N eligible, Y%) — `MandateProvenance.eligible` (N = community member
  count, the vote-stage denominator) + `voters` (X = distinct QV allocators), rendered on the document + in
  `spec.json` `provenance.turnout`. ✅ Static, honest **Sybil / verification** block (web-of-trust, 1p1v, no
  ID/biometrics — matches the P0/P2 copy) on the document + `provenance.verification` in `spec.json`. ✅ Org
  endorsements marked **claimed vs verified** (`MandateAdopter.verified` + distinct badge + `adoption.{claimed,
  verified}` in spec).

**P5 — Mission floor (pull forward from Wave 2 — north-star #1 gaps the pilot will hit).**
- [BLOCKER-class] **Low-bandwidth / offline mode** — ✅ **partly shipped (S14, offline anchor):** adopted the
  orphaned "Lane F connectivity kit" into the real app (`SmartImage` data-saver placeholder + native lazy-load
  at 4 avatar sites; `DataSaverToggle` surfaced in Profile), + new `useOnline` hook + global `OfflineBanner`
  (`role="status"`, mounted in the App shell). *Remaining (deferred):* last-view cache + WhatsApp-shareable
  summary extension (mandate already has S11's share); service-worker/PWA path deliberately NOT taken (lighter
  in-app approach). (Thandiwe/Pascal on intermittent, expensive data.)
- [MAJOR] **Localized country names** — ✅ **shipped (S14):** `getCountryName(code, locale)` via
  `Intl.DisplayNames`, threaded through ~11 country render/select sites (incl. onboarding + Profile pickers).
- [MAJOR, large] **More UI locales incl. Chichewa** (and other widely-spoken African languages that exist as
  *profile* tags but not UI locales) — **moved to Post-handoff (S16)** (a new `src/i18n/ny.ts` ≈1120 keys +
  `Locale` union + `LanguageSwitcher`; widens the human-gated native-review backlog).
- [MAJOR, coordinate w/ backend] **Content-translation strategy** — fixture/content text (problem titles,
  comments, solutions, mandate body) is English in every locale; decide per-card translation vs a "traduire"
  affordance. Backend-adjacent → coordinate with Ouri. **Moved to Post-handoff (S16).**

**P5.5 — Generalize Gloki beyond the VftC/Africa pilot (Eston direction, 2026-07-01). ✅ SHIPPED (S15,
2026-07-02).** The audit found the app was **already ~90% generalized**: homepage/welcome copy already global,
`PILOT_COUNTRIES` = all 197 countries, `regions.ts` already the global 6-region set, and the seeded communities
already diverse (Global Health, Digital Rights, Climate Resilience, Fair Futures, …) — **"Voices for the
Climate" survived only in the onboarding invite copy** (never a seeded community). Anchor = **surgical
neutralization** (Eston): (1) onboarding `invite.lead` → cause/region-agnostic (en+fr+sw); (2)
`mandate.provenanceLine` "young people" → "people" (en+fr+sw); (3) removed the Africa-centric `PILOT_COLORS`
(KE/NG/MW/CD) so every country uses the neutral deterministic `hashColor`; (4) light-touch docs reframe (§1 KPI
relabelled "platform KPI"; §2 now leads with the global-platform mission, VftC kept as *one named pilot
example*). Climate stays **one balanced community among several** — no fixture reskin → **no `DEMO_VERSION`
bump**. fr/sw parity held (2 changed keys, no new keys). Spec:
`docs/superpowers/specs/2026-07-02-p55-generalize-gloki-design.md`.

**P6 — UI handoff readiness ✅ BUILT (S16, 2026-07-03; push pending Eston's gate).** Full UI-review
campaign phases 0–3+5 (findings log:
[docs/superpowers/specs/2026-07-03-s16-ui-review-findings.md](docs/superpowers/specs/2026-07-03-s16-ui-review-findings.md))
+ problem→mandate coherence walk (en+fr, QV math & post-vote re-fetch verified live). Shipped:
**Discussion recast as a function, not a pipeline step** (4-stage strips matching the StageFooter +
persistent `DiscussionPill` with live comment count, read-only resolver); measured a11y fixes (44px
tap targets via the bell's pseudo-target pattern; `$success-on-surface` for green text-on-white;
new `$primary-on-dark` token for dark-scheme blue text); page-title tokens
(`$page-title-size/-weight`, `$heading-gap`); CreateCommunityPage gained its AppHeader banner;
CommunityView loading/not-found branches joined the page model (+ fr/sw keys). Handoff docs:
FOR_OURI addendum (S13 `set_property`/`get_properties` + `mandate_ratification`, S16 pill read
path); ARCHITECTURE StageFooter/landing fixed; DESIGN_SYSTEM typography + primitives updated.
Spec: `docs/superpowers/specs/2026-07-03-s16-discussion-ia-and-fix-wave-design.md`.

**P7 — UI polish & design-system enforcement (Eston walkthrough, 2026-07-08). 🔨 IN PROGRESS.**
Read-only 14-agent review (83 findings) → [docs/ui-polish-campaign-2026-07.md](docs/ui-polish-campaign-2026-07.md).
Six dependency-ordered waves; through-line: **codify the missing rules/tokens in DESIGN_SYSTEM.md**
(campaign §5) so drift can't recur. Each wave = a normal spec→build→review→push session; 10 taste
calls await Eston (§6); a Round-2 backlog covers uncovered surfaces (§7).
- ✅ **W1 — DS foundation (S24, 2026-07-08) — SHIPPED + PUSHED `5be46a2..8862197`, deploy run
  28971810816 green, live 200; adversarial review 0 confirmed findings.** New tokens
  `$content-gutter` (16px), `$success-on-dark`/`$warning-on-dark`; the **header-gutter law** (AppHeader
  title block + brand bar + every content column share ONE 16px edge — mobile media queries tighten
  vertical only); dark-mode contrast blocker cleared (vote buttons 7.6/5.3:1, captions 6.96:1,
  secondary Button 5.75:1); codified in DESIGN_SYSTEM.md (header-gutter law + on-dark family +
  dark-authoring rule). UI-only → **no DEMO_VERSION bump, no i18n**. Spec
  `docs/superpowers/specs/2026-07-08-w1-ds-foundation-design.md`.
- ✅ **W1b — canonical page-container (S24, 2026-07-08) — SHIPPED + PUSHED `2aa4e4e..215a772`,
  deploy run 28999082628 green, live 200; adversarial review found + fixed 2 desktop defects.**
  New `@mixin page-column` (max-width `$content-max-width` + margin-inline auto + `$content-gutter`)
  + `$footer-clearance` (80px). The AppHeader `.bar`/`.titleBlock` and every outer scroll wrapper
  `@include page-column`, so on desktop (>640px) header + content share ONE centred 640px column;
  inners fill it (dropped bespoke 600/680/720/800 widths). Full unification (Eston): the mobile
  gutter is also normalized to 16px on the pages that were off it (12/24/32/40 → 16). Review caught
  the suggest-composer full-width sibling + the collab-workspace double-column; both fixed. Codified
  in DESIGN_SYSTEM.md. UI-only → **no DEMO_VERSION bump, no i18n**. Spec
  `docs/superpowers/specs/2026-07-08-w1b-canonical-page-container-design.md`.
- ✅ **W2 — card-chin footer separation (S25, 2026-07-10) — BUILT + verified + adversarially
  reviewed; push PENDING Eston's gate.** Commits `ccf0093..` (spec/plan docs + `bf17744` `$footer-*`
  tokens, `74da3d6` InitiativeStageCard chin, `9e23de9` FeedEngagePanel chin, `a9a037e`
  DESIGN_SYSTEM). One shared `.chin` (hairline `$footer-border` rule + recessed `$footer-surface`
  fill) on the shared `InitiativeStageCard` shell → all 5 community stage cards; moved out of
  `.engage` as the radius-clipped terminal child (two-tone `$gray-50`→`$gray-100` footer). Stage-feed
  `FeedEngagePanel` = rule only (padded host, no `overflow:hidden`) + `.openLink` `$primary-dark`
  (fixes a pre-existing 3.68:1 light AA fail → 5.17:1). Locked (Eston 2026-07-09): rule+fill; all-5
  scope; stage-feed rule-only. UI-only → **no DEMO_VERSION bump, no i18n**. Verified 360px both
  schemes + contrast sweep (zero chin-attributable fails). Review: inline 0/0/0 + Workflow fleet — 2
  docs findings fixed; known cosmetic note: author-only double hairline (StageAdvanceBar rule 12px
  above chin rule) → W5 candidate. Spec `docs/superpowers/specs/2026-07-09-w2-card-chin-design.md`.
- ✅ **W3 — discussion-as-function + redundancy removal — SHIPPED + PUSHED 2026-07-10**
  (`1b03eb1..f0400e8`, deploy run 29143572642). Pill reframe (neutral "Discussion" + count, no
  `active` skin); `STAGE_META.discussion` deleted (cards fall back to Problem badge); stage-feed
  badge + HomeView "In discussion" section folded into Problems; sample re-stage + settings row
  drop; duplicate discussion buttons removed (chin pill is the single entry); write-together
  sub-views URL-addressable (`?draft=`, no local back arrows, ghost Cancel); VoteExplainer gated to
  non-participants; support-CTA vocabulary (Send points/Send · Back this mandate · Add your
  organization, fr+sw). DESIGN_SYSTEM §5-rule-10 codified; i18n 4 retired / 4 re-worded (parity
  1131). UI-only → no DEMO bump. Review: adversarial Opus fleet — 2 minor comment-only findings
  fixed, 1 out-of-scope refuted (→ round-2 backlog). Spec
  `docs/superpowers/specs/2026-07-10-w3-discussion-function-design.md`.
- ✅ **W4 — context restoration + mandate composition — SHIPPED + PUSHED 2026-07-11**
  (`929817e..940b03a`, deploy run 29153336157). New shared `ContextCard` primitive (title?/body?;
  renders null when empty; body line-clamped) — the discussion page shows the problem body (header
  h1 stays the initiative title, S23), suggest-to-author shows problem title+body (self-fetches
  `get_details` through the seam, no prop-threading). MandateCard: support+Share one row (drop
  `fullWidth`, size=md, flex 1/0) holding at 360px incl. fr "Soutenir ce mandat"; card inset
  `$spacing-xl`→`$spacing-lg`; hero raised in dark (`$dark-surface`→`$dark-bg`). MandateDocument:
  inset →`$spacing-lg`; verification prose → `(i)` InfoDisclosure on the turnout strip; indicators
  `<dl>` collapses behind an inline heading toggle. AdoptionFramework: full adopter list collapses
  (fixed `.list[hidden]` defeated by `display:flex`). DESIGN_SYSTEM §5-rule-11 (ContextCard pattern)
  + §6#7 (per-context open-item affordance) codified. i18n +4 keys fr+sw (parity 1135). UI-only → no
  DEMO bump. 3 stale-premise corrections (4.2 already fixed by W1b; 4.5 only 2 files; 4.6 named the
  wrong cards — the hero was the flat one). Review: adversarial Opus fleet (5 dims × refute) 0
  findings + grep gates clean; one collapse bug caught in the 360px preview walk & fixed (`940b03a`).
  Spec `docs/superpowers/specs/2026-07-11-w4-context-mandate-design.md`.
- ✅ **W5 — kit-first normalization + spacing/touch floors — SHIPPED + PUSHED 2026-07-11**
  (`8005caf..719f8b5`, 17 commits, deploy run 29169104710 green, live 200). Kit adoption: `SegmentedControl` ← StartDraft
  mode toggle + discussion sort; `ProgressBar` ← IdentityTrust verify bar + SolutionsBoard's two
  threshold bars (S22 law); `EmptyState` ← chat (4 states) / members / collab empties (loading
  stays bespoke — kit needs a title); `Button` ← stage-card open CTA + chat create/retry/back.
  **D1 (Eston):** SolutionsBoard folds commitments+evidence into one "Details" disclosure → 4
  co-equal blocks; S15 two-bars-combined intact. Floors: chat send 40→44, textarea/inputs 44,
  mandate copyBtn 36→44; icon→label 8px (`$spacing-sm`) sweep across 8 files; ProblemEngage
  rule-8 (`Send`→`leftIcon`, gate=0). **D3 (Eston): 5 controls the DS carves out stay BESPOKE**
  (createBtn / chat+DM send / openLink / QV stepper / mandate copyBtn) — only floors/contrast
  fixed, not swapped (the campaign's "swap to Button" was stale for all 5). Dead CSS deleted
  (Members `.memberName`/`.section`). i18n +1 new (`trust.your.barLabel`) / 2 renamed
  (`evidence*`→`details*`), parity 1136. UI-only → **no DEMO bump**. **Re-grounding: 14th straight
  catch** — the campaign's kit-swap list mis-scoped 5 keep-bespoke controls, a phantom "collab ×",
  a non-existent 800px literal, and Button `md`=44 (doc said 40); §6#7 already resolved in S27.
  **360px preview walk caught + fixed a real dark-contrast bug** (createBtn `$primary-dark`
  3.45:1 dark → `$primary-on-dark` 7.0:1). Review: adversarial Opus fleet (6 dims × refute) →
  0 blocker/0 major, 3 minor (2 orphaned dark overrides + 1 stale doc exemplar) all fixed
  (`651a1c9`); all 3 grep gates clean; full `tsc -b && vite build` green. **Deferred to the W5
  tail (below):** Currency cluster, Members row→Card, BallotSolutionCard extraction. Spec
  `docs/superpowers/specs/2026-07-11-w5-kit-floors-design.md`.
  - 📋 **W5 tail (deferred, low priority):** (a) Currency — EmptyState + 44px input floors + 8px
    gaps (entangled: shared `.stateMessage`, `<li>`-in-`<ul>` empties, non-reusable nested
    `.inputField`); (b) Members rows → `Card` (consistency-only; deeply-nested surface + dark/mobile
    overrides); (c) **BallotSolutionCard** — extract one card shared by QVFlow (unvoted+voted) +
    VotePreview (partial dedup: only solHead/solText/details are shared, hearts/results/byline
    diverge; risk concentrated in the voting core — do in a focused session with full preview verify).
- ✅ **W6 — community chrome & collab polish — SHIPPED + PUSHED 2026-07-12**
  (`bfc9124..39c2d1f`, 7 commits, deploy run 29204217793). **This closes the UI-polish campaign
  — all 6 waves shipped.** (6.1) `community.menuButton` "Menu"→"Community options" (now the
  secondary's aria-label) + `aria-haspopup` `menu`→`dialog` (it opens the `role=dialog`
  SlideOutMenu). (6.2, **Eston**) hero: a *visible* full label can't fit beside "Start an
  initiative" at 360px across locales (row ≈286px, primary ≈172px, wider in fr), so the secondary
  is a compact **44×44 icon button + a short "Options" caption** beneath it, side-by-side with the
  dominant primary (new key `community.menuCaption`; Eston revised stack→side-by-side→icon+caption
  mid-session). (6.3) deleted the blue `border-left` test artifact in CollabList — light **and**
  the orphaned dark override (uniform border both schemes). (6.4, **Eston**) the global account
  menu is now **context-aware**: inside a community it prepends that community's 8 mini-app nav
  items (reusing `community.menu.*`), so every mini-app is reachable from every **section** page
  via the one always-present hamburger — the reachability fix that honors the locked
  single-AppHeader model (no 2nd header/left drawer). (6.5/6.6) verify-only: createBtn AA
  (4.62 light / 6.23 dark) + 44px confirmed, **no `800px` owner exists** (dead premise); collab
  header inherits the header-gutter law (16px, 1 h1/1 header). i18n +1 key (`menuCaption`), parity
  1136→1137; UI-only → **no DEMO bump**. **Re-grounding: 15th straight catch** (no 800px owner;
  6.1 aria was a *fix* not an *add*). Review: adversarial Opus fleet (5 dims × refute) 0 findings +
  focused hero skeptic NO DEFECTS; 3 grep gates clean; `tsc -b && vite build` green; 360px preview
  light+dark+fr. DESIGN_SYSTEM: context-aware account-menu rule codified. Spec
  `docs/superpowers/specs/2026-07-12-w6-community-chrome-design.md`.
  - 📋 **W5 tail still deferred** (unchanged from S28): (a) Currency EmptyState + 44px input floors
    (needs the global-`.input-field` blast-radius decision); (b) Members rows → `Card`; (c)
    **BallotSolutionCard** extraction (own focused session — risk is in the voting core).

**P8 — Walkthrough campaign (Eston click-through, 2026-07-13). ✅ DONE — all four waves (A–D) SHIPPED+PUSHED; campaign complete.**

- ✅ **W-A — card anatomy unification (S30) — SHIPPED+PUSHED (deploy green on `5009ef1`).** Spec
  `docs/superpowers/specs/2026-07-13-card-anatomy-design.md`; commits `b87608e..6abc429`.
  Shipped: strip gutter (`.stageNavRow` → `$content-gutter`); de-buttonized current stage pill
  (D2); bespoke threshold bar → shared `ProgressBar` kit (gray end-line + ARIA gap gone, A-3/A-4);
  universal two-tone chin — stage feed restructured to tint like the community card, `chinExtras`
  slot + shared `ProblemChinExtras` (Suggest pill "Suggest"/D3 + code chip moved out of the body);
  stage-feed "Open in community" → pill (D4). +1 i18n key `card.suggestToAuthorShort` (parity 1138).
  Opus review 0 blocker / 0 major (3 minor fixes applied). Verified 360px light+dark en/fr/sw; the
  ProblemVoteFlow bar itself stayed StageGate-gated for the demo visitor (verified via code path +
  build, same limit the review session hit). DESIGN_SYSTEM chin/strip law codified.
- ✅ **W-B/C — suggest-flow recompose + action-button captions (S31) — SHIPPED+PUSHED (deploy green on `5009ef1`).**
  Spec `docs/superpowers/specs/2026-07-14-suggest-flow-captions-design.md`; commits `1d8a996..555d090`.
  **W-B (D1):** the problem `ContextCard` moved from the top of `<main>` to a persistent "you're
  responding to" bar pinned directly above the composer (wrapper carries `@include page-column`; the
  card border stays inset); `$spacing-lg` top air on `.dmMain`; autoscroll-on-send re-verified.
  **W-C (D5):** SolutionsBoard action buttons stack an icon+count row over a short visible caption
  (Back this / Request expert / Suggest merge); the sentence aria-labels dropped (the visible caption
  is the accessible name — WCAG 2.5.3 / voice control), `aria-pressed` added to the two toggles;
  ThreadedDiscussion's Heart gains a visible "Like (n)" label matching Reply/Delete. i18n: +3 caption
  keys, revived `deliberation.thread.like`, retired 4 keys (parity 1137/1137). Opus whole-branch
  review 0 crit / 0 important (1 minor doc-of-record fix applied: context-header rule now states the
  context-dependent placement). Verified 360px light+dark en/fr/sw on the suggest page (light 4.76 /
  dark 5.71 caption contrast, no fr/sw overflow) + SolutionsBoard stage feed + discussion heart.
  DESIGN_SYSTEM icon+caption action-button law codified.
- ✅ **W-D — mandate-page recompose (S32) — SHIPPED+PUSHED (deploy green on `ffa3878`).** Spec
  `docs/superpowers/specs/2026-07-14-mandate-page-recompose-design.md`; commits `a98cb8f..ffa3878`.
  UI-only — no contract methods, fixtures, routes, or DEMO bump. **F1** top air on `.page`. **F2/D6**
  hero eyebrow "Gloki Mandate" → "Mandate summary" (retired the orphaned `mandate.card.aria` aria-label
  into a new visible `mandate.card.eyebrow`; section now `aria-labelledby` the visible span; shield
  kept). **F3** document status Badge → top-right of a new `.eyebrowRow` (space-between); `.metaRow`
  dissolves; the "Ratified {date}" line moves under the title, still gated by status (S17 rule).
  **F4/F5/D7** turnout line + Sybil (i) + plain/spec toggle relocated to a bottom **two-tone
  provenance chin** — a new padded-card bleed variant (`margin: 0 -$spacing-lg -$spacing-lg` +
  matching bottom radius) since the doc card keeps its W4 4.5 uniform inset; `.turnout` drops its own
  pill surface. **F6/D8** `AdoptionFramework` "From mandate to action" gains hand-rolled sibling card
  chrome; the white AdopterCard `<li>` → `$gray-50`/`$dark-surface` so nested items stay distinct.
  **D9** skipped (the hero's S11 clean-link Share already sits on the page). i18n: −1 aria +1 eyebrow
  (parity 1137/1137). Opus whole-branch adversarial review (4 dimensions → verify) = 0 blocker / 0
  major; 1 minor applied (engage-chin grammar rule now self-marks its scope), 2 refuted. Verified
  360px light+dark en/fr/sw on the published-mandate page (chin bleed measured exact; dark turnout
  ≈4.76:1, info-box ~9.5:1; `#docAnchor` "View full" lands the title). DESIGN_SYSTEM "provenance /
  utility chin" variant codified; i18n packet S32 section appended.
Eston's live walkthrough (~20 critiques) verified same-day against `c91bd86` (7-unit read-only
fleet + controller preview walk) → [docs/ui-walkthrough-campaign-2026-07-13.md](docs/ui-walkthrough-campaign-2026-07-13.md)
(verified findings + 4 waves + 9 open decisions for Eston §6). W-A card anatomy (strip gutter +
de-buttonize pill, bespoke threshold bar → ProgressBar kit killing the gray end-line, universal
two-tone chin w/ `chinExtras` slot, suggest-btn + problem-code → chin) = S30, prompt
`docs/session-prompts/session-30-card-anatomy-unification.md`; W-B suggest-flow recompose
(ContextCard → pinned above composer) + W-C solution-button captions = S31; W-D mandate-page
recompose (top air, "Mandate summary" eyebrow, status top-right, provenance strip to card bottom,
AdoptionFramework gets card chrome) = S32. UI-only campaign: no contract methods, no fixtures, no
DEMO bump. Key premise corrections baked into the doc: "initiative view" = the stage feed
(`/initiative/*` root redirects, 16th stale-premise catch); the stage-feed chin's missing tint was
the *deliberate* S25 §1.3 rule-only call being reversed; the gray line is ProblemVoteFlow's
bespoke `thresholdMarker` (not the kit); en.ts is a partial dictionary (English lives in inline
`t()` fallbacks — copy changes touch tsx + fr + sw, never en.ts).

**P9 — Actor completeness (Eston review, 2026-08-05). ✅ SHIPPED+PUSHED** (`1094375..0381f7c`, 17 commits; deploy green, run 31085623145). Spec
[docs/superpowers/specs/2026-08-05-s33-conviction-author-org-design.md](docs/superpowers/specs/2026-08-05-s33-conviction-author-org-design.md).
Five asks from Eston's review, all built in S33. Not a polish campaign — each one closes a hole
where a role in the product had no interface.

- ✅ **W1 — back a mandate from the mandate page + an editable commitment.** "Back this mandate"
  teleported to the community page; it now expands in place, resolving the *same* shared conviction
  contract (the mandate route's `:mandateId` IS the initiative contract id). New `update_stake` /
  `withdraw_stake`: a commitment is changeable, amount never moves, lengthening preserves your
  backing date and shortening resets it. An (i) answers "how much conviction do I have?" — there is
  no bank.
- ✅ **W2 — the author's perspective.** `SolutionAuthorPanel` on your own solution: who asked for
  expert review, and merge suggestions with Accept / Keep mine separate. Closes a real dead end —
  `mergeSuggestions` was **write-only**, stored by the contract and read by no UI at all. New
  author-gated `decide_merge_suggestion`. One seeded solution is authored by the viewer, which is
  what makes the author view reachable (the demo user authors nothing else, by design).
- ✅ **W3 — the organization actor.** Organizations sign in, see only finished mandates at
  `/organization`, and endorse or subscribe. Blocked from every participation surface *before* the
  trust checks (pilot communities open stages to `'anyone'`). A parallel actor, not a permission
  level — because 1p1v means an institution isn't a small person.
- 🔨 **W4 — the "looks AI-generated" audit.** Research → audit → adversarial verification; applied
  findings recorded in §8.

**Open follow-ups this session surfaced (not built):**
- **The `/…/collaboration` route is unreachable.** It hosts the only cross-initiative merge and
  modification decision UI, and nothing in the app navigates to it. Either wire it up or retire it.
- **`NotificationsBell` is permanently empty** — one event type (`merge_absorbed`), produced only
  on that unreachable route. The author panel is per-solution; a real inbox is the general answer.
- **Conviction has no time-accrual clock.** Weight is the pledged duration, not time held, and
  withdrawal is free — so nothing stops declaring `1y` for maximum weight and withdrawing a moment
  later. S33's lengthen-preserves/shorten-resets timestamp rule is implemented and documented, but
  it protects nothing until weight accrues from time *held*; `timestamp` is display metadata today
  (flagged as such in FOR_OURI_seam.md). A real accrual model is a mechanism change with results
  implications — Eston's call.
- **Only one published mandate exists**, so the organization home reads thin until more communities
  finish a pipeline.

**P10 — Causes · status · impact assessment (S34 design, 2026-09-02). ✅ SHIPPED+PUSHED (S35,
2026-09-05/06)** (`101e4a3..03d6f5d`, 49 commits, pushed to `origin/ui` 2026-09-06 — includes the
2026-09-05 final-review fix wave and the 2026-09-06 adversarial-panel R3 judge MUST fix wave).
A push to `ui` does **not** deploy (verified: no workflow run fired); the deploy happens when Ouri
merges `ui` → `server-side`. Spec
[docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md](docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md);
decision record
[docs/superpowers/specs/2026-09-02-s34-decision-record.md](docs/superpowers/specs/2026-09-02-s34-decision-record.md)
(D1–D12, F1–F10); plan
[docs/superpowers/plans/2026-09-02-prompt1-causes-impact-status.md](docs/superpowers/plans/2026-09-02-prompt1-causes-impact-status.md).
Three Sonnet advocates argued, an Opus judge ruled. Scope classes: UI + **five contract-method
additions** (`vote_comment`, `get_comment_votes`, `add_proposal.cause_id`, `add_impact_assessment`,
`get_impact_assessments`) delivered as a patch for `server-side`
(`docs/contracts/s34-initiative-contract-additions.py` + a FOR_OURI S35 addendum) + **fixture
change** (⇒ `DEMO_VERSION` `global-v17` → `global-v18`).

- ✅ **W0 — deploy-branch reality + demo defects.** `CLAUDE.md`/skills corrected: Ouri merges `ui` →
  `server-side`, which deploys; a push to `ui` alone does not (**D11**). Fixed two pre-existing demo
  stub defects found while re-grounding: `add_comment` dropped `parent_id`, and `get_roles` /
  `endorse_expert` had no demo handlers.
- ✅ **W1 — Causes (the Discussion rename).** Root comments on a per-problem discussion are now
  votable, ranked "Causes" — up/down is roots-only, **enforced in the demo contract stub** mirroring
  the real-contract patch (**D4**); rank chips on the top 15; a once-per-user dismissible hint above
  the first list (**F6**); labels renamed "Discussion" → "Causes" app-wide, URL/`stageKey`/contract
  slot unchanged (**D3**). New `src/utils/causes.ts` (`rankCauses`), `voteComment`/`getCommentVotes`
  wrappers, Causes UI in `ThreadedDiscussion`.
- ✅ **W2 — discussion status pill.** `src/utils/discussionStatus.ts` computes a five-band read
  (New/Contested/Divided/Converging/Consensus) over the ≤10 most-voted root comments, with sparse-
  data floors (**D6, F3**); `DiscussionStatusPill`/`DiscussionStatusBadge` on every initiative card,
  `DiscussionPill`, the community feed summary and the Causes page subtitle; off-app "Consensus"
  always carries the scoped `{n} Gloki participants in {community}` string, never bare (**F4**); the
  pill word never truncates — degrades to dot + accessible name at 360px (**F5**). DESIGN_SYSTEM rows
  added.
- ✅ **W3 — Causes → Solutions.** New solutions require picking a top-5 cause, pre-selected to #1,
  changeable, never empty (**D5**); demo stub gained `cause_id` on `add_proposal`; a solution's
  addressed cause is immutable once written, with a neutral "no longer ranked" / "before any cause
  was ranked" chip on demotion or absence (**F2**) — shared `CauseLine` component adopted on the
  Solutions board, QV ballot, vote preview and mandate card; `TopCausesPanel` shows the ranked list
  above the Add-solution row; "Implementation measures" relabel disambiguates from the new
  cause-alignment prompt in the same modal.
- ✅ **W4 — impact assessment.** Any of the top-10 writers by `causeScore + solutionScore` (with a
  self-dealing exclusion on the solution's own authors and co-authors across every solution sharing
  its cause, and a documented 3-rung relaxation ladder when too few qualify) can submit a structured
  assessment — target, cause-vs-symptom, mechanism, broader effects, risks, opportunity costs, time
  horizon — on a solution they didn't write (**D7, F7, F8**). New `src/utils/writerRank.ts`
  (`eligibleAssessors`/`canAssess`), `add_impact_assessment`/`get_impact_assessments` demo stub +
  wire patch, form/card/board CTA/QV-ballot and results folds/mandate "Why we expected this to
  work" section. **D12 — accepted and logged, not fixed:** eligibility is UI-gated only; the
  contract enforces no self-dealing/floor/rank checks server-side (follow-up filed below).
  `DEMO_VERSION` bumped to seed comment votes, cause links and impact assessments across both demo
  discussions.

**Verification.** i18n +64 keys / 1 retired (`mechanisms.qv.commitsMetricsN` → split into
`mechanisms.qv.measuresN` + `mechanisms.qv.metricsN` + the new `impact.foldN`) at fr/sw parity
1246/1246, appended to the native-review packet. `tsc -b` + `npm run build` clean at every wave;
each of the 14 build tasks passed its own subagent review (several with 1 fix round; task 14 caught
an Important — the impact CTA/rung computing from empty discussion data before `TopCausesPanel`'s
fetch resolved — same session). Preview-walked 360px light+dark on the databroker and misinfo demo
communities: Causes voting, the five status bands ("Divided"/"Converging" verified against the
actual seeded vote counts), required cause pre-select with truncation/clamp fixes at 360px, and one
full impact-assessment submission end to end. **Not pushed** — awaiting Eston's explicit go; the
whole-branch Opus review (0 Crit/0 Imp target) runs as part of that gate. **D2** (the sample-content
fallback ruled "restore" in the decision record) was **not built this session** — it stays Eston's
call, filed as optional Task 16 in the plan.

**2026-09-06 update — adversarial panel R3 (whole-branch gate).** Two Sonnet advocates (prosecutor
P1–P15, defender D1–D13) argued the branch at `18b54c6`; an Opus judge, with a read-only copy of
Ouri's real initiative contract the panellists didn't have, ruled 34 MUST fixes (docs only: D1, D2;
formula guards: P6/D4 via a third `MIN_PARTICIPANTS` floor and a net-score band cap, both additive
to the D6/F3-ruled formula) applied as 9 further commits before push, plus 11 LATER items ledgered for S36 in the
judge ruling's §B (four fr/sw register items additionally routed into
`docs/i18n-native-review-candidates.md`, below). Full ruling:
[docs/superpowers/specs/2026-09-06-s35-panel-verdict.md](docs/superpowers/specs/2026-09-06-s35-panel-verdict.md) (the session scratch workspace it was
written in has been deleted; that spec is the durable record). i18n +2 keys
(`causes.vote.locked`, `impact.allRequired`) this wave, fr/sw parity 1251/1251 — see the changelog
entry below for the full-wave i18n delta. **Pushed to `origin/ui` 2026-09-06** on Eston's explicit
go, after the adversarial panel.

**P11 — Prompt 2: Community verification (S34 design §3, 2026-09-02).** 🔨 **Waves 1–4 BUILT +
reviewed and PUSHED to `origin/ui` through S39 on 2026-09-16.** W1 (S36,
2026-09-06; `628b574..dc213f9`, 14 commits) moved `DEMO_VERSION` v18 → **v19** and was pushed to
`origin/ui` 2026-09-06 — Ouri's merge to `server-side` deploys.
Spec addendum
[docs/superpowers/specs/2026-09-06-s36-verification-w1-design.md](docs/superpowers/specs/2026-09-06-s36-verification-w1-design.md)
(E1–E3 rulings + §8 post-review amendments); plan
[docs/superpowers/plans/2026-09-06-s36-verification-w1.md](docs/superpowers/plans/2026-09-06-s36-verification-w1.md).
Scope classes: UI + **fixture change** (30-member verification fixture, seeded requests, scenarios ⇒ v19) +
**seam surface** `src/services/verification.ts` documented for Ouri (FOR_OURI S36 addendum: `request_vouch`,
`vouch`, `decline_vouch`, `get_vouches`, and a needed `list_verified_members` read — no patch file; the Digital
Agent contract has none of these yet).

- ✅ **W1 — hub · request · approve · invite** at `/identity/verification/*` (D8 platform-wide, D9 nested):
  segmented "{X} of 4" bar, two pathway cards (E3), approval history with method + time, requests-to-vouch
  row; request page with optimistic "Requested ✓" and deterministic simulated outcomes (E2: 4 decliners among
  the 14 non-member fixture people, E1); approve page with slide-out; invite page (verified form / unverified
  request list); demo-honesty line on both simulated-judgement surfaces; dev-only scenario switcher. Kit:
  `Toast` (one polite live region), `ProgressBar segments`, `MemberCard` (44px hit-area on `size="sm"`
  actions). `vouchMeta` on the Digital Agent; `useCommunityTrust` counts the user's own vouches
  platform-wide (E1). `trust.meetMember` retired. Opus whole-branch review 0 Critical / 5 Important / 16 Minor
  → one fix wave, scoped re-review clean, preview-verified 360px light+dark en/fr/sw.
- ✅ **W2 — verification call BUILT + reviewed** (S37, 2026-09-07; `64c3abe..666a8e5`, 22 commits;
  **no `DEMO_VERSION` bump** — UI + a demo module only, no fixture or seed data changed). Spec addendum
  [docs/superpowers/specs/2026-09-07-s37-verification-w2-design.md](docs/superpowers/specs/2026-09-07-s37-verification-w2-design.md)
  (E4–E7 rulings, C1/R9–R13 as-built notes); plan
  [docs/superpowers/plans/2026-09-07-s37-verification-w2.md](docs/superpowers/plans/2026-09-07-s37-verification-w2.md).
  Four screens at `/identity/verification/call` (D9 nested, `App.tsx` untouched): `VerifierPicker`
  ("Available now" only — E4 dropped the 7×12 availability grid, logged below), `WaitingRoom` (live
  "{n} of {m} joined", Start at ≥1, 20 s simulated timeout that keeps both actions live), `InCallView`
  (**both roles**, E6), `CallSummary`. Simulation in `src/services/demo/verificationSim.ts` — in-memory,
  no localStorage, no contract; 8 seam functions incl. `joinAsVerifier` (C1), all documented in the
  FOR_OURI S37 addendum as **simulation-only, invent no `start_call`**. Kit: `VerifyButton`, `VideoTile`,
  `CountdownTimer` + `useCountdown`; `MemberList` extracted (closes the S36 parked duplication). F10's
  camera/data line on both entry points with the text-vouch path linked, non-video pathways first; the
  demo honesty line on every surface where a fixture person judges the user, in a role-accurate variant
  (E7, R11). 46 new keys at fr/sw parity (1312 → 1358). Opus whole-branch review **0 Critical / 2
  Important / 7 Minor** → one fix wave, scoped re-review clean. Preview-verified at 360px light+dark in
  en/fr/sw, **both roles walked end to end**.
  - 🔒 **DECIDED (Eston, 2026-09-07) — the daily session (W3) is the verifier's door.** A standing
    "verify someone now" entry would invite idle judgement; arriving via a session the verifier opted
    into gives the act a reason, and W3 already selects verifiers. Build the entry point as part of W3;
    do NOT add a hub card for it. Original finding (I2, S37 Opus whole-branch review):
    the verifier role has no in-product entry point.
    `VerificationHub` renders `PathwayCards` only for unverified users, and that card is the only
    in-product link to `/identity/verification/call` — so the verifier half of this wave (its own
    honesty line, its own `CallSummary` branch, its share of the 46 new strings) is reachable only by
    typing the URL or via the dev scenario switcher. Needs a founder IA decision on where a verifier's
    door lives; the existing pathway card's copy is candidate-framed and cannot simply be shown to
    verified users without its own verifier-framed strings. Design doc §6.7.
- ⬜ **W2 follow-up — "Schedule for later" (E4).** The spec's `AvailabilityGrid` (7 days × 12 hours +
  timezone select + "Find matching times") did not ship: a simulation cannot honour a future slot, and
  an honest version needs W4's notification centre to exist first. Revisit with W4.
- ✅ **W3 — daily session BUILT + reviewed + PUSHED** (S38, 2026-09-09; `ac8523b..5aaa30a`, five
  implementation commits plus review fix `95d5bad`; pushed with S39 to `origin/ui` 2026-09-16).
  `/identity/verification/daily` now covers pre-session, lobby,
  deterministic selection, candidate, selected-verifier, observer, empty/partial and result states.
  The candidate pathway card and verified-volunteer hub row are both live product doors. Eight daily
  seam functions are simulation-only; daily vouches persist through the existing Digital Agent write.
  Shared countdowns now follow absolute deadlines and reconcile visibility return. No fixture/seed
  change and no `DEMO_VERSION` bump (`global-v19`). French/Swahili parity is 1413/1413; native review
  remains open. Task reviews and whole-session review findings were fixed; controller browser walks
  covered both roles, 0/2 approvals, empty/partial/observer, cancellation, dark 360px en/fr/sw. The
  local multi-model panel was not run because its separate authorization was not given.
- ✅ **W4 — notification centre + bell BUILT + reviewed + PUSHED** (S39, 2026-09-15/16; 12 commits
  from `74fe1a0` through closeout `0563d22`; pushed to `origin/ui` 2026-09-16). The nested
  `/identity/notifications` centre renders seven event families with persisted read/unread state,
  safe expired fallbacks and valid route actions; the direct-link bell exposes the real unread count
  (`99+` visual cap, exact accessible count). Storage is scoped by encoded server URL + public key,
  strictly sanitized, deduplicated and capped at 100; account transitions synchronously hide any
  stale scope. W1/W2/W3 producers use stable ids behind service seams, and daily reminders survive
  route changes only while the tab and authenticated owner remain active. No fixture/seed edit;
  `DEMO_VERSION` remains `global-v19`. French/Swahili parity is 1449/1449 (+36 keys, 1 reframed);
  native review remains open. Browser coverage included all seven families, malformed/expired data,
  persistence, 0/1/9/100 counts, back navigation, 360×780 light/dark and en/fr/sw. Adversarial review
  found two major owner-isolation defects; both were fixed in `289863c`, with scoped re-review clean.
  Audible screen-reader verification remains manual. The separately authorized local review panel
  was not run.

**Open follow-ups (parked, S36 final review):** focus management after an approved card leaves; focus ring
under the hub card's `overflow: hidden`; `listVerifiedMembers` can list the current user; demo verification
state is per-browser, not per-key; ~~the member-list render duplicated across request/invite~~ (**DONE S37 Task 1** — `MemberList` extracted, now three consumers); the demo sidecar ships inert in prod (`React.lazy` behind
`import.meta.env.DEV` is the hardening).

### Handoff-blocking (finish before Ouri derives `new-features`)

- ✅ **S17 — small fix tail from the S16 findings log — DONE 2026-07-03** (C4 SegmentedControl
  label → `$gray-700`; C5 dark adoption breakdown → `$dark-text`; N3 verified already fixed in
  S16 `a7aa652` — Mandate doc-title h2 stays the documented sanctioned exception; N4 vote card
  gained the initiative title line + "Cast your vote" affordance styling — Eston's call; T5
  See-all `::after` extension; T6 StageFooter documented sanctioned exception; T7 source-chip
  24px floor; turnout → "{pct}% have voted"; 4-persona sample ran (Thandiwe/Pascal/Tomás/James)
  — one blocker found & fixed (pending mandate showed a ratification date). Spec:
  `docs/superpowers/specs/2026-07-03-s17-fix-tail-design.md`.)
- ✅ **S16 push — DONE** (green-lit and deployed; `ui == origin/ui` verified at S17 open).
- ✅ **S17 push — DONE** (landed with S18-W1; pushes have since landed through S21 + the
  404-title fix — `ui == origin/ui` @ `142f83b`, deploy green, live-site theme toggle
  spot-checked 2026-07-06). The "tell Ouri `ui` is ready to derive" ping is **held at Eston's
  discretion** (Eston, 2026-07-06 — timing is his call).


### Post-handoff (explicitly parked until after the handoff)

- ✅ **In-app UI-language switcher — DONE 2026-07-05 (S21**, pulled forward into campaign W4
  because the menu work overlapped): `MenuSettings` in the global menu's footer hosts the
  LanguageSwitcher + the D2 Auto/Light/Dark theme control — switching language no longer
  requires logging out.
- Liquid delegation (**D3**) — the one named-but-missing core mechanism (only a fixture stub today).
- More UI locales incl. **Chichewa** (`ny.ts`); the fr/sw **native review** stays human-gated.
- **Content-translation strategy** for user-generated/fixture text (needs Ouri).
- **Offline last-view cache** + WhatsApp-shareable summary (S14 deliberately shipped the lighter
  in-app anchor; no service worker).
- Points/currency depth, leaderboards (also §6).
- ✅ **Wave 1.5 refactor lanes — living remainder DONE in S22 (2026-07-06)**; the 2026-05-31 lane
  prompts are superseded by `docs/superpowers/specs/2026-07-06-s22-wave15-kit-convergence-design.md`
  (its re-grounding table records what was already dead). Shipped: dialog convergence onto shared
  Modal (5 dialogs; MessageDialog deleted for useAlert), `<ProgressBar>` kit (m6), SegmentedControl
  radio-group semantics, raw-rgba debt → 0 (new `$dark-tint-*`/`$scrim-light`/`$shadow-xl` tokens),
  `utils/initials` + `utils/formatDateTime` consolidation, CountryFlag convergence + its
  double-announcement fix. Lane 4's D3 half stays below; still open from the old lane notes:
  the 44px `::after` hit-area mixin (4×), `teaserTone` enum, FundingFlow empty-state/tabs
  kit adoption, VotingFlowShell extraction. From the S22 review: ProblemVoteFlow's threshold
  bar → `<ProgressBar>` (needs marker-overlay support) — it also lacks `role="progressbar"`
  today.
- **Engage-stack wiring dedup (S20 review):** the member-fetch + threshold wiring now has 4 copies
  (Problem/Solution/Vote ActivityCards + `FeedEngagePanel`) and the engage+advance composition is
  hand-wired in 4 hosts — extract `useCommunityMemberCounts` + a `StageEngageStack`; same pass
  should share the panel/deepLink SCSS (`FeedEngagePanel.module.scss` duplicates ActivityCard/
  InitiativeStageCard blocks) and give CommunityHome the same redux stage overlay + `membersLoaded`
  patterns S20 added to the feed path.
- **StageGate loading-grace deploy gap (pre-existing, S20-review-confirmed):** `StageGate` renders
  children while trust is loading, so shared-mode `useFlowContract` consumers (QVFlow,
  SolutionsBoard) can start a deploy for a user the gate is about to block. Needs a deliberate fix
  (hold children until `isReady`, or make shared-mode mount lazily) — touches vote UX, so product
  care required.

### Blocked / coordination (not ours to drive on `ui`)
- **A — land `ui` → `main`.** `origin/main` is Ouri's real-server layer (mid-QA, 341-vs-2 diverged). Per the
  branch model he *derives* `new-features` from `ui` and pushes to `main`. Eston coordinates; not a merge we run.
- **D-apply — fr/sw native review.** The packet is verified-current
  ([docs/i18n-native-review-candidates.md](docs/i18n-native-review-candidates.md)); needs an actual native
  fr + sw speaker, then apply confirmed fixes.
- **D12 follow-up — server-side eligibility enforcement** for `add_impact_assessment` (top-10
  writers, `causeScore > 0`, no self-dealing) and `add_proposal.cause_id` alignment; UI-gated only
  on `ui`. Ouri's contract roadmap; patch in `docs/contracts/s34-initiative-contract-additions.py`.

