# Gloki UI — Master TODO

> **Living strategy doc.** The "why" (north-stars, mission, design philosophy, deferred scope) is
> evergreen; the roadmap is refreshed as we ship. Wave 1 execution history (Foundation + lanes A–G
> + the review wave) is archived at [docs/archive/WAVE_1_HISTORY.md](docs/archive/WAVE_1_HISTORY.md).

---

## 1. Why this exists (the two north-star principles)

Everything in this roadmap is judged against **two principles**, in this order:

1. **Usability first.** A young person on a cheap Android with intermittent data and English as a
   third language must be able to participate *without anyone sitting next to them.* Our concrete
   bar is the platform KPI: **≥70% of participants complete the journey unaided.**
   Plain language, low cognitive load, guided steps, generous defaults, forgiving errors.
2. **A felt sense of transnational collaboration.** The product should make someone in Nairobi and
   someone in Lilongwe *feel they are building something together across borders* — through
   visible country presence, shared artifacts, live co-authoring, multilingual co-presence, and a
   collective output they can point to. Not a voting tool; a place where a global "we" forms.

If a task doesn't serve one of these, it is probably **Wave 2+** (deferred). See §6.

---

## 2. The mission this UI must enable

**The platform (primary):** Gloki is a **global direct-democracy platform** — any community,
anywhere, turning shared problems into collective mandates through the pipeline below. The seeded
demo reflects this: diverse communities and civic topics worldwide, no single campaign or region as
the frame.

**Near-term pilot (one concrete example):** Run **"Voices for the Climate"** — a 12-month
transnational deliberation for 500+ youth across **Kenya, Nigeria, Malawi, DRC**, producing a
published **"Young Africa Climate Mandate."** The app must support its four phases end-to-end (all
hardcoded UI for now; backend is Ouri's separate track):

| VftC Phase | What happens | Gloki surface |
|---|---|---|
| **1. Co-Design** (M1–3) | **Collective issue selection** (participants choose *what* to deliberate), agree rules, onboard, consent | Onboarding + Issue Selection |
| **2. Open Deliberation** (M4–7) | Draft / discuss / refine / merge proposals; multilingual co-authoring; expert review; **conviction signaling** + **liquid delegation** | Deliberation + Mechanisms |
| **3. Consolidation & Voting** (M8–9) | Consolidate to draft mandate; red-team review; **verified quadratic vote**; publish | Consolidation + QV + Mandate |
| **4. Distribution & Evaluation** (M10–12) | Present mandate to institutions; **adoption framework** (orgs subscribe & report progress) | Mandate & Impact |

> **Demo note:** the *near-term pilot* is Africa-focused, but the **product is a global platform**.
> Demo/sample content must feel worldwide and multi-topic — not VftC-specific (see Roadmap, Batch 1).

**Long-term vision:** the Business Plan's 8-step Global Community Principle (Identity → Problem
Collection → Problem Selection → Solution Collection → Solution Consolidation → Global Discussion →
Voting → Global Impact). Much of its heavier machinery is **deferred** (see §6).

---

## 3. Design philosophy (from the DAO research)

These are guardrails, not features:

- **Deliberation precedes aggregation.** Voting mechanisms live *inside* a deliberative process,
  never as a replacement for it. (DAOs that aggregate without deliberation fail democratically.)
- **One person, one vote — Sybil-resistant, never plutocratic.** No token-weighting, no
  pay-to-influence. Influence is earned through participation and trust, not wealth.
- **Progressive decentralization.** Start with simple, legible structures; phase in advanced
  governance (Council/DAO, delegation depth, points economy) only as real communities mature.
  Premature complexity is the documented DAO failure mode.
- **Three transferable mechanisms (no blockchain required):**
  - **Quadratic voting** — lets a minority register strong preference on what they care about. *(Have: `QVFlow`.)*
  - **Conviction signaling** — continuous support that accrues over time; rewards sustained commitment over momentary mobilization. *(Have: `ConvictionStaking`.)*
  - **Liquid delegation** — vote directly on what you understand, delegate to a trusted peer on the rest; revocable, **time-limited, capped, transparent delegate records**. *(Missing — build it.)*
- **Structured minority protection** — cooling-off periods and visible dissent, so majorities moderate proactively. *(Lightweight for now.)*

---

## 4. Working model (current)

We build on **`ui`** against the `src/services/demo/` **stub layer** — see the branch model and the
seam rule in [CLAUDE.md](CLAUDE.md). The earlier parallel-lane / worktree / "owned-paths" execution
model (Wave 1) is **retired**; its full record lives in
[docs/archive/WAVE_1_HISTORY.md](docs/archive/WAVE_1_HISTORY.md).

Rules that still hold:
- **Hardcoded UI only.** New data → a `src/services/demo/fixtures/*` file, read through the mock layer. No real backend; no `?raw` Python imports.
- **Design system is law.** Tokens + shared components from `src/components/shared` — no ad-hoc colours/spacing. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- **Every user-facing string** goes through `t('ns.key', 'English default')`.
- **Verify before "done":** `npx tsc -b` clean, `npm run build` clean, walk the routes in the preview (dark mode + 360px mobile + keyboard/screen-reader basics).
- **Ship in small, self-contained chunks**, each leaving `ui` runnable.

---

## 5. Test-user review panel (the diverse "users")

After a milestone, a **review session** dispatches these personas as subagents. Each one assumes the
persona, attempts the key journeys on the live preview build, and files findings with severity
(blocker / major / minor) against the two north-star principles. Their findings drive the roadmap.

| # | Persona | Lens |
|---|---|---|
| 1 | **Amara**, 24 — Nairobi, Kenya. Chapter organizer, mid-range Android, English + Swahili, moderate digital literacy | Core target user; can she lead her chapter through it? |
| 2 | **Chidi**, 21 — Lagos, Nigeria. Student, digital native, English | Speed, social feel, gamification expectations |
| 3 | **Thandiwe**, 26 — Lilongwe, Malawi. First smartphone, Chichewa-first, intermittent data, WhatsApp-native | Low literacy + low bandwidth + offline bridges |
| 4 | **Pascal**, 28 — Bukavu, DRC. French-first, very low bandwidth, politically cautious | Multilingual, SMS fallback, trust/safety |
| 5 | **Dr. Giorgia** — SDU evaluator | Deliberative quality (Fishkin/Habermas), usability metrics, research rigor |
| 6 | **Marie** — EU marine biologist / NGO | Domain expert; sources, legitimacy, co-authoring |
| 7 | **James** — DC policy advisor | Institutional adoption; does the mandate carry credible weight? |
| 8 | **Tomás** — screen-reader user, Chile | Accessibility, keyboard nav, contrast |
| 9 | **Viktor** — privacy-skeptic | Distrusts AI/data; transparency & consent stress-test |

> As the demo goes global (Roadmap Batch 1), expand this panel beyond the four pilot countries —
> e.g. an older Zimbabwean, a younger Dane, a Chinese mid-career professional, a low-literacy farmer.

Review prompt template: `docs/session-prompts/REVIEW-WAVE.md`.

---

## 6. Deferred (Wave 2+ — explicitly NOT now)

Kept here so we don't accidentally build them early (progressive-decentralization discipline):
- Biometric / hard identity verification (use lightweight invite + vouch + the web-of-trust *mock* for now)
- Council DAO, governor elections, full liquid-democracy depth
- Gloki Points economy, leaderboards, achievement/badge gamification depth
- Web5 / censorship-resistant transport, mirror apps
- AI automated debate summaries & public-opinion analysis (keep AI to translate + light co-writing)
- On-chain anything (Ouri's separate backend track)

---

## 7. Roadmap

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

---

## 8. Changelog

- **2026-07-06 — S22: Wave-1.5 living remainder — kit convergence + token-debt zero
  (SHIPPED+PUSHED `ce0251a..1d47118`, deploy green, live site 200; whole-diff review
  0 Critical / 0 Important / 3 minors fixed same-session; the first four commits had
  already gone live via Eston's parallel push, see note).** Spec
  `docs/superpowers/specs/2026-07-06-s22-wave15-kit-convergence-design.md` — its re-grounding
  table retired ~70% of the 2026-05-31 lane prompts (PageHeader/PipelineView already deleted,
  i18n lane already at parity, Modal focus trap already shipped, MASTER_TODO §10/§11 gone).
  Shipped: **SegmentedControl → WAI-ARIA radio-group** (S21 review note; roving tabindex +
  arrow keys, preview-verified); **Modal `aria-labelledby`** wiring (T1a — the one live remnant
  of the old lane-3 WCAG claim); **shared `<ProgressBar>`** (S18 m6) converging QVFlow (×2,
  incl. the fillPct-toward-target turnout bar), AdoptionFramework, SharedStatement — dark
  track canonicalized `$dark-surface`→`$dark-border` (visibility fix); **all 5 hand-rolled
  dialogs onto the Modal/Button/Banner kit** (MessageDialog deleted for `useAlert`;
  ApprovalDialog + QRScannerDialog also lost their raw-English strings — **+15 fr/sw keys,
  parity 1141**, packet appended); **raw-rgba debt → 0** (new `$dark-tint-subtle/-raised/
  -strong`, `$scrim-light`, `$shadow-xl` — byte-identical swaps; the no-ad-hoc-values law is
  now fully grep-enforceable); **utils/initials + utils/formatDateTime** consolidation (4→1,
  2→1 copies); **CountryFlag** `showName` double-announcement fix + ConvictionStaking/
  AdoptionFramework raw-flag swaps. DESIGN_SYSTEM gained the Modal law, ProgressBar spec (with
  honest exceptions), token rows; stale `$secondary` row deleted. **No DEMO_VERSION bump**
  (no seed-content change). Also at S22 open: Eston ratified the three S21 theme/language
  decisions; §7's stale S17-push line closed; Ouri ready-to-derive ping held at Eston's
  discretion. **Mid-session note:** Eston's parallel session pushed at 09:11 (favicon rebrand
  `ce0251a`) carrying the first four S22 commits to production mid-build — all were tsc-clean;
  ship-grade-every-commit held. ★ Learnings: (1) with a second writer in the same working
  tree the git INDEX is shared — a foreign staged deletion got swept into an S22 commit
  (caught, surgically rebuilt); `git status` before every commit, stage explicit paths only;
  (2) barrel imports defeat path-based consumer greps — grep the SYMBOL, not the path (a
  "Modal has zero consumers" false alarm nearly relaunched an adoption lane); (3) editing
  JSX before its import triggers an HMR ReferenceError ghost that survives reload — restart
  the dev server before debugging.
  LanguageSwitcher (M6). S18 UI CAMPAIGN COMPLETE — SHIPPED+PUSHED `0ba50e8..daf3fac`, deploy green, theme snippet + :where selectors verified in the live bundle.** Spec
  `docs/superpowers/specs/2026-07-05-s21-theme-toggle-design.md` (+2 addenda). Mechanism:
  `data-theme` on `<html>` (absent = Auto) + `gloki.theme` localStorage + zero-flash head
  snippet + `dark`/`dark-self` mixins in `variables.scss` whose `:where()` wrappers keep the
  Auto cascade identical to the old raw media queries; forced themes also override
  `color-scheme`. **Premise correction:** "nothing sets color-scheme" was false —
  `index.scss:14` already set it (the sweep grepped TS/HTML but not CSS). Codemod: all
  **300** raw `prefers-color-scheme` blocks across **105** scss files → `@include dark` as a
  machine-verified pure header swap (0 declaration bytes changed; CSS +7KB gzipped). Menu:
  shared `SlideOutMenu` footer slot + `MenuSettings` (SegmentedControl + LanguageSwitcher)
  in the global menu — **language switching no longer requires logout** (S17 Thandiwe major,
  pulled forward from Post-handoff). Found+fixed live: StageFooter painted over the menu
  panel (tied z:100, later in DOM; menu lifted to the modal layer z:1000). +5 fr/sw keys
  (parity 1126; packet appended + stale 1032-key header stamp refreshed). **No
  `DEMO_VERSION` bump** (no fixtures). Built directly on `ui` (8 commits: `dc6dbc1..5e96d20` + the closeout docs commit);
  5-lens whole-diff review **0 Critical / 0 Important** (4 minors fixed same-session, incl.
  a storage-blocked toggle desync verified by simulation; accepted notes: forced-dark prints
  dark, `:where()` ≈Chrome-88 floor, single-tab sync); 3-mode × system-scheme matrix
  preview-verified at 360px on the S19/S20 surfaces; en/fr/sw menu walk live; DESIGN_SYSTEM
  dark-mixin law added. ★ Learning: a codemod must EXCLUDE the file that defines its
  replacement (it rewrote its own mixin internals into recursion — caught by the count
  drifting 300→303); grep ALL file classes when verifying a premise. **Ratified 2026-07-06
  (Eston, at S22 open):** the three adopted S21 decisions — segmented Auto/Light/Dark control
  in the global-menu footer (Auto default), LanguageSwitcher in the same MenuSettings section,
  Auto = no `data-theme` attribute (falls through to the OS scheme) — are now locked.
- **2026-07-04 — S20: campaign Wave 3 shipped — stage-feed inline expansion (D1) (BUILT, push
  pending Eston's gate; W4 theme toggle + menu switcher remains).** Spec
  `docs/superpowers/specs/2026-07-04-s20-stage-feed-inline-expansion-design.md`. Three decisions
  locked (Eston): collapsed feed card stays the compact cross-community summary; discussion-stage
  initiatives surface in the Problem feed ("In discussion" badge, active DiscussionPill as their
  only engage — the re-verify table caught the prompt premise wrong: they previously appeared in
  NO global feed); expanded panels keep a quiet "Open in community" link. New `FeedEngagePanel`
  re-hosts the S19 engage stacks (ProblemEngage/SolutionEngage/VoteEngage + StageAdvanceBar +
  strip/pill row) under the feed summary with per-card community context; mandate keeps navigating
  (S18 D1). Vote panel re-measured in-feed: the same 4 QVFlow blocks as S19 M2. Review (8 angles,
  12/12 candidates CONFIRMED) fix wave: on-dark link token + 44px/focus ring (also fixed
  ActivityCard's deepLink dark colour, 3.97:1 → AA); `membersLoaded` readiness gate killing a
  zero-denominator premature-advance race (feed + ProblemActivityCard); per-feed expansion reset;
  live stage overlay in `useAllInitiatives` (redux `initiativeStages` over the local cache) so an
  in-feed advance updates the card; aria-controls only while expanded; problem-only reads scoped
  into `ProblemFeedBlock`; dead `/stage/discussion` banner + orphaned fr/sw key dropped. Parity
  fr=sw 1121 (scanner OK), gates clean, build green, no DEMO_VERSION bump. Learnings: 9th straight
  stale-premise catch; "Rendered more hooks" right after HMR-editing a mounted hook is the known
  ghost — restart the dev server before debugging it (lore #6 held).
- **2026-07-04 — S19: campaign Wave 2 shipped — card recomposition + title standard + sizing floors
  (BUILT, push pending Eston's gate; W3 stage-feed inline + W4 theme toggle remain).** Spec
  `docs/superpowers/specs/2026-07-03-s19-w2-card-recomposition-design.md`. Four decisions locked
  (Eston): strip = dotted pills as a PURE MARKER (nothing navigates), CommunityView keeps its
  hidden-h1 hero exception (title block non-sticky app-wide), hearts explainer first-visit-expanded
  (`welcomeHints` `qvGuide`), ballot items fold to ONE merged commitments+metrics expand with
  post-vote region bars staying visible. **M3**: InitiativeStageStrip 86px circles → 27px pills,
  zero buttons, `stage.goTo` retired. **M2**: vote engage panel 8 blocks/1,704px → 4 blocks/1,313px
  steady-state (first-visit 1,463px), boxed-surface depth 3→2; ballot items 384→~310px; write
  re-fetch verified; problem/solutions/mandate panels measured against the same bars — all pass,
  untouched. **D3**: sticky bar keeps only brand; eyebrow+h1 title block (S16 20px/700 pair) below
  a full-width rule, scrolling with content; adopted by Home/StageFeed/5 identity pages/
  CreateCommunity; fixed the pre-existing currency double-h1 (funds h1→h2 ×3). **D4/D5**: Button
  `md` 40→44px bare; interactive icons floored at 16px across ~20 files (badges/captions stay
  proportionate — m7 scopes to actions); ProblemVoteFlow icon squeeze fixed (svg flex-shrink 0).
  Parity fr=sw (scanner OK), gates clean, build green. Learnings: an inherited 0.7-text-opacity
  de-emphasis measured 3.56:1 (sub-AA) — de-emphasize via the dot, not label alpha; after flipping
  preview colorScheme on a loaded page RELOAD before screenshotting (computed styles read correctly
  while the compositor holds hybrid light/dark frames); DiscussionPill "13px icon" premise was
  stale (already 16) — 8th straight session the re-verify table caught rot.
- **2026-07-03 — S18 (in flight): full UI review campaign + Wave 1 mechanical fixes (PUSHED
  `5979ea7..21ccd4d` with the S17 range; Eston green-lit).** Eston declined the handoff freeze —
  cards messy, stage-feed teleport, suggestion-page spacing, rampant padding/icon issues, and a
  dark/light toggle request. Campaign ran (findings log
  `docs/superpowers/specs/2026-07-03-s18-ui-campaign-findings.md`: 6 majors, 7 minors) and
  measured all four complaints; decisions locked: D1 problem/solutions/vote expand inline in
  stage feeds, D3 app-wide title block + rule under the AppHeader, D4 buttons ≥44px, D5 icon
  floor 16/20, D6 four waves. **W1 shipped** (spec
  `2026-07-03-s18-wave1-mechanical-fixes.md`): the icon-button padding bug class (global
  `button { padding: 0.6em 1.2em }` reset crushed 11 fixed-box icon buttons — the suggestion
  send icon rendered 5.6px); SuggestionDmView recomposed (3-row composer, bottom-anchored bar);
  stage-feed chip/banner + dark footer-tab contrast (3.06–4.26 → 4.94–9.22); /welcome brought
  into the page model; one-shot creation confirmation (en+fr+sw, packet appended). Verified live
  360px both schemes; W1 diff reviewed 0 Crit / 0 Imp. **Remaining: W2 card recomposition
  (engage-panel ~12 blocks → ≤5, stage-strip circles) + D3/D4/D5; W3 stage-feed inline
  expansion; W4 theme toggle (297 media blocks / 104 files codemod) + menu language switcher.**

- **2026-07-03 — S17: S16 fix tail + persona sample + freeze for handoff (PUSHED with W1, see
  above).** Re-grounding shrank scope again (7th consecutive session): S16 was already pushed
  (`ui == origin/ui`) and N3 was already fixed in S16 `a7aa652` — no-op'd with citation. Shipped:
  C4 SegmentedControl unselected label `$gray-600`→`$gray-700` (4.34→8.7:1, lifts all 4 consumers);
  C5 dark adoption breakdown → `$dark-text` (4.04→12:1); N4 vote card gained the initiative title
  line above the demoted problem statement + `teaserAction` affordance styling for "Cast your vote"
  (Eston's call); T5 See-all 44px `::after` extension; T6 StageFooter recorded as sanctioned
  density exception; T7 meta-link 24px floor (both documented in DESIGN_SYSTEM Mobile Patterns);
  turnout footer → "{pct}% have voted" (en+fr+sw at parity, packet appended). 4-persona sample
  (Thandiwe/Pascal/Tomás/James, sequential, 360px): one blocker found & fixed — pending mandate
  rendered "Ratified {date}" beside the "Pending ratification" badge; one major filed to
  Post-handoff (no in-app language switcher after login); Pascal/Tomás clean. Whole-branch review
  (8 finder angles + verify): 0 Critical / 0 Important; one confirmed cleanup applied (dead
  duplicate `::after` in Banner) and two cleanup notes logged to Wave-1.5. All verified live at
  360px light+dark; parity fr=sw=1120; gates clean; build green. NO DEMO_VERSION bump (no fixture
  changes). Spec: `docs/superpowers/specs/2026-07-03-s17-fix-tail-design.md`.

- **2026-07-03 — S16: UI handoff readiness — review campaign + Discussion-as-function + fix wave +
  handoff docs (BUILT; push pending Eston).** Ran the full UI-review campaign (Phases 0–3+5:
  grep gates all at baseline, computed-style contrast sweeps light+dark, touch-target boxes,
  per-route h1/landmark checks; findings log
  `docs/superpowers/specs/2026-07-03-s16-ui-review-findings.md`) + the problem→mandate coherence
  walk (en+fr; QV heart math and post-vote re-fetch verified against the live preview).
  **Measure-before-fix paid again:** the header bell "30×30" was a false positive (a 44px
  `::after` pseudo-target already existed), the "32px h1" on stage feeds was the sr-only h1, and
  most "0 margins" were flex-gap spacing. **Shipped (7 feat/fix commits):** Discussion recast as a
  function — both strips now 4 stages matching the StageFooter, with a persistent `DiscussionPill`
  (live comment count via read-only `resolveInitiativeStageContract`, never `useFlowContract`;
  "In discussion" active state; in-discussion initiatives render in the Problem→Solutions gap);
  44px tap targets for Banner dismiss / MandateCard View-full/View-all / thread Like+Collapse;
  `$success-on-surface` for green text-on-white (was 2.54:1) with dark-mode overrides; new
  `$primary-on-dark` token (dark-scheme blue text; `$primary-dark` measured 2.83–3.45:1 in dark —
  two sites carried "$primary-light not defined" comments waiting for it); page-title tokens
  (`$page-title-size`/`-weight`/`$heading-gap`) applied to the four in-content page h1s;
  CreateCommunityPage gained the AppHeader banner; CommunityView loading/not-found branches
  joined the page model with translated strings (9 new + 5 changed fr/sw keys total, parity
  fr=sw=1120; **no `DEMO_VERSION` bump** — no fixture changes). **Handoff docs (Track D):**
  FOR_OURI_seam.md addendum (S13 `set_property`/`get_properties` + `mandate_ratification`
  property, S16 pill read path — closing the S13 doc gap); ARCHITECTURE.md StageFooter/landing
  corrected; DESIGN_SYSTEM.md typography standard + `$primary-on-dark` + DiscussionPill; §7
  restructured into **Handoff-blocking vs Post-handoff**. S17 = the small fix tail (C4/C5, N3,
  N4, T5–T7, turnout phrasing) then the push/handoff.
- **2026-07-02 — S15: card-cohesion fix + P5.5 generalize-Gloki (both shipped).** Two linked pieces.
  **Phase 0 — SolutionsBoard recomposition:** the card-cohesion audit (specs vs live code + 360px
  light/dark preview) found accretion-dilution **concentrated in `SolutionsBoard`** (nothing deleted —
  P0–P5 features stacked as ~9 co-equal blocks inside a card-in-a-card-in-a-card). Fix = **re-composition,
  no feature reverts**: flush solution list items + hairline dividers; indicators/sources/expert-review
  folded behind an inline **"Evidence & expert review"** expand (new local `SolutionEvidence`; expert
  review renders flush, green box gone); two threshold bars → one compact "progress to vote" line;
  text→commitments→byline hierarchy (~9 visible blocks → ~4). 4 new i18n keys at fr/sw parity.
  **Phase 1 — P5.5 generalize (surgical):** app was already ~90% general; neutralized the onboarding
  invite copy + the mandate "young people" line (en+fr+sw), removed Africa-centric `PILOT_COLORS`, and
  light-touch docs reframe (§1–2). Climate kept as one balanced community; **no `DEMO_VERSION` bump** (no
  fixtures touched). Both built directly (contained changes), `tsc -b` clean, preview-verified 360px
  light+dark. Specs: `2026-07-01-solutionsboard-recomposition-design.md`,
  `2026-07-02-p55-generalize-gloki-design.md`.
- **2026-07-01 — P5 Mission floor: offline anchor + localized country names shipped (S14).** Made the app
  usable by the pilot cohort on cheap Androids / intermittent data — the north-star-#1 usability floor.
  **Premise correction:** offline was *not* greenfield — a complete but orphaned "Lane F connectivity kit"
  (`useDataSaver`/`SmartImage`/`DataSaverToggle`/`SyncBadge`/`ChannelBadge`, i18n-wired) lived only in the
  `/lab/presence` dev route; this session **adopted it into the real app** rather than rebuilding. Shipped:
  `SmartImage` (data-saver initials placeholder + native lazy-load + async decode) at 4 avatar sites (Members,
  DigitalAgentCard, RoleDisplay, ReadyStep); `DataSaverToggle` in Profile preferences; a new provider-free
  `useOnline` hook + global `OfflineBanner` (shared `Banner` `tone="warning"` → `role="status"`, announced,
  mounted once in the App shell with **no route change**); and locale-aware `getCountryName(code, locale)` via
  `Intl.DisplayNames` (folding MandateCard's local helper) threaded through ~11 render/select sites incl. the
  onboarding + Profile country pickers. **Lighter in-app approach — no service worker/PWA** (avoids owning SW
  cache-invalidation against the GitHub-Pages basename + `404.html` shim + `DEMO_VERSION` reseed). No
  `DEMO_VERSION` bump (UI-only). 2 new banner keys + `profile.prefs` at fr/sw parity (fr=sw=1112), appended to
  the native-review packet. Built subagent-driven on `ui` (6 code commits `f0b4dbe..479ffdd`); each task +
  the whole branch reviewed (Opus final: **READY TO MERGE, 0 Crit / 0 Imp**, 3 non-blocking Minors);
  preview-verified 360px light+dark under en/fr/sw incl. offline banner, data-saver placeholder toggle
  (0 image fetches), and localized names ("Inde"/"Nigeria"). **Deferred (P5 tail):** last-view cache,
  WhatsApp-summary extension, Chichewa locale, content-translation strategy. **New:** Eston directed a
  **P5.5 "generalize Gloki beyond VftC/Africa"** workstream (see §7) — its own brainstorm next.
- **2026-07-01 — P4 Mandate rigor shipped (S13).** Made the published mandate defensible as an institution.
  Indicators now carry **target + baseline + measurement cadence**, entered on a new **host/expert-gated
  "Prepare for ratification" panel** (`RatificationPanel`, gated via `getInitiativeRoles`) that writes a
  `mandate_ratification` JSON property on the **initiative** contract — a NEW additive `set_property`/
  `get_properties` seam mirroring the community contract (the premise re-check found the initiative contract
  lacked those methods; the `wtdraft_` pattern runs on the *community* contract — Eston confirmed adding them).
  `useMandate` merges ratification per-indicator by label and derives `status:'ratified'` only when every
  indicator is complete (else `'published'` + a "pending ratification" badge). The artifact now states its
  **turnout denominator** ("X of N eligible members voted, Y%" — N = community member count, X = distinct QV
  allocators) and a static **Sybil/verification** statement (web-of-trust, 1p1v, no ID/biometrics — reconciled
  with the P0/P2 honesty copy), both also in `spec.json` `provenance`. Org endorsements marked **claimed vs
  verified** (`MandateAdopter.verified` + distinct badge + `adoption.{claimed,verified}` in spec; seeded 3+3).
  DEMO_VERSION `v15→v16`; fr/sw +22 keys at parity. Built on `ui` (7 commits `271d15a..a5e664a`); preview-
  verified 360px light+dark incl. the host-gated panel save→persist→re-fetch roundtrip. **★★ The 2026-06-29
  persona review's mandate findings (empty KPI targets, no turnout denominator, no Sybil statement,
  claimed-vs-verified ambiguity) are all closed.** Next: P5 mission floor.
- **2026-07-01 — P3 Evidence & expertise loop shipped (S12).** Closed the review's evidence/expertise
  convergence: credited expert reviews (name + verified-shield + credentials + structured assessment +
  evidence links, replacing the old anonymous metric flatten), a repeatable Sources field (URL + optional
  label) on the solution/write-together/comment composers via new shared `SourceLinks`/`SourcesInput`, and
  author-proposed indicators kept distinct from — and out of — the expert-first mandate derivation. Additive
  on the S4 spine (exact method names). Shipped `origin/ui` @ `796a620`; DEMO_VERSION `v14→v15`. Premise
  re-check found all 3 items narrower than the persona review framed them; Opus whole-branch review → 5 fixes
  (top: scoped expert community membership so it no longer inflates member counts / 50% gates on unrelated
  communities). ★ Learning: attributing a *seeded* reviewer needs 3 coordinated seam edits or the byline
  falls back to the raw key.
- **2026-06-30 → 07-01 — P0/P1/P2 shipped** (S9 pilot-readiness, S10 navigation & IA, S11 trust/privacy/
  consent). Detail in the respective project-memory files. The build order below is now at **P4**.

- **2026-06-29 — Nine-persona milestone review** (Amara, Chidi, Thandiwe, Pascal, Dr. Giorgia, Marie, James,
  Tomás, Viktor) against the live preview after the S1–S8 arc. Top convergences → P0–P5 above: claims-honesty
  contradictions (1p1v↔QV, no-ID↔real-world-ID, vote secrecy, blockchain) [3 personas]; the verification gate
  hides the whole back half of the pipeline (QV ballot + SolutionsBoard unreachable for a fresh user)
  [4 personas]; stage-footer breaks single-issue tracing + omits Discussion + Home-tap loses context
  [4 personas]; inviter-country default bug [3 personas]; identity exposure / weak consent [2 personas]; no
  low-bandwidth mode / no Chichewa [2 personas]; broken expert-review loop + no source fields [2 personas];
  empty mandate KPI targets + no turnout denominator [James]; a11y live-region + Like-label + base-button
  contrast [Tomás]. **Biggest wins to preserve:** the shareable onboarding guide; transnational presence that
  is *felt* and screen-reader-labeled; the credible Mandate artifact (provenance + spec.json + adoption
  framework); Write-Together co-production; the strong a11y foundation (skip link, landmarks, one h1, zero
  unnamed controls).
