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

- **2026-08-05 — S33: P9 actor completeness — conviction editing, the author's view, the
  organization actor (SHIPPED+PUSHED; `1094375..0381f7c`, 17 commits; Pages deploy green).** Spec
  `docs/superpowers/specs/2026-08-05-s33-conviction-author-org-design.md`. Driven by Eston's
  2026-08-05 review. Scope classes: UI + **two contract-method additions** + **one fixture change**
  (⇒ `DEMO_VERSION` `global-v16` → `global-v17`) + **one new top-level route** (flagged as an IA
  decision, spec §6).
  **Re-grounding first, as always** — 11 premises checked against `751c63a`; two changed the design.
  (a) The mandate route's `:mandateId` **is** the initiative contract id, so the mandate page can
  mount the *same* shared conviction contract the community page uses — the fix is one surface
  moved, not a second copy. (b) `useFlowContract` **deploys** when a parent has no registered
  sub-contract, so the backing panel mounts lazily on expand; and `useMandate` deploys *two* stage
  contracts, so the organization's mandate list is built on the read-only `useAllInitiatives`
  instead (one `useMandate` per row would have written a contract per listed mandate).
  **W1 conviction.** `MandateBacking` (new) replaces `MandatePage`'s navigate-away `onShowSupport`
  with an inline expandable panel; `MandateCard`'s CTA expands + scrolls to it. New wire methods
  `update_stake { duration, country }` and `withdraw_stake {}` on the conviction contract: duration
  is the only thing that moves (calling `stake` twice would have *added* to the amount, breaking
  one-person-one-commitment), lengthening preserves the original `timestamp`, shortening resets it
  so a long record can't be harvested then downgraded. "Backing since {date}" makes the time
  dimension visible; an `InfoDisclosure` states there is no bank — one backing per person, length
  is the only lever. **The conviction subsystem had no entry in `FOR_OURI_seam.md` at all**; a full
  section now documents every method plus the auth the real contract must enforce.
  **W2 the author's perspective.** The app had none: an expert-review request rendered as the same
  anonymous counter for author, requester and stranger, and — the sharper finding — a merge
  suggestion was **write-only**, stored by `suggest_proposal_merge` and read by *no UI anywhere*, so
  the person it was addressed to could never learn it existed. New `SolutionAuthorPanel` renders
  only on a solution you authored (named requesters + the honest note that only an expert can grant
  a review; merge suggestions with **Accept the merge / Keep mine separate**). New
  `decide_merge_suggestion { source_id, target_id, decision }`, gated on `caller === source
  proposal author`; accepting sets `mergedInto` and deliberately does **not** move approval counts.
  One `databroker` solution is now seeded **authored by the viewer** with two pending review
  requests and one merge suggestion — the demo user authors nothing else by design, which is
  precisely why the author branches were unreachable. Bonus: the same board now shows your solution
  (author view) beside personas' (member view), which answers "show me both perspectives" without a
  simulated toggle.
  **W3 the organization actor.** Organizations are modelled as a *parallel actor*, not a permission
  level — 1p1v means an institution isn't a small person. `services/organizationActor.ts` +
  `useOrganization` persist `{ name, type, country }` locally like `DigitalAgent` (no contract, no
  wire method for Ouri yet; `MandateAdopter.verified` is the existing attestation hook, so org
  endorsements stay "claimed"). `OrganizationSignIn` is a quiet secondary path on `LoginPage`; new
  **`/organization`** route lists finished mandates and nothing else; `RootRoute` sends org sessions
  there instead of `/welcome`. `StageGate` blocks organizations **before** the trust checks —
  pilot communities force stages to `'anyone'`, which would otherwise have let an institution vote.
  `MandateBacking` shows orgs the backer count without the control; `AdoptionFramework` binds
  endorse/subscribe to the signed-in org (CTA names them, modal pre-fills). `logout()` clears the
  org record, which otherwise outlives `user` and would strand the next person on the device.
  **Verification.** `tsc -b` + `npm run build` clean; grep gates clean; i18n +53 keys at fr/sw
  parity **1190/1190**. Preview walk at 360px, light + dark, en/fr/sw: backing 15→16 backers on
  stake; **edit 1m→1y kept backers at 16 and moved strength 58→68** (proving the amount never
  inflates) and preserved the backing date; **shortening 1y→1w reset the clock** (verified in
  contract state) and moved strength 68→57; withdraw restored 15/56 exactly; the author panel
  rendered on exactly **one** card with a real decision persisting to the contract; org sign-in
  landed on `/organization`, endorsed as "Mercy Corps" (6→7 organizations), and was blocked with
  the org banner on a community participation surface while still able to read. Two defects the
  build could not catch were found in that walk and fixed: the viewer's byline rendered as the raw
  key `aaaaaaaa…` (now "You"), and `SolutionAuthorPanel`'s muted lines measured **4.04:1** on
  `$info-surface-dark` (below AA) — switched to `$dark-text`, now 9.45:1 dark / 7.15:1 light.
  **Opus whole-branch review found 2 blockers + 5 majors — all fixed in `a03b38d`.** Both
  blockers were the same class of mistake, and worth recording: **a new surface inherited none of
  the old surface's gates.** (1) `MandateBacking` mounted the identical `ConvictionStaking` that
  `MandateEngage` has always wrapped in `<StageGate stage="mandate">`, and `mandate` defaults to
  `'verified'` — so W1 created an *ungated route to a gated action*. (2) The organization block sat
  in `StageGate`, which wraps only four surfaces; deliberation, chat and Start-an-initiative
  consult `canCurrentUserParticipate` directly or nothing at all, so an institution could still
  deliberate and open initiatives. The fix moved the check into the **predicate** every surface
  shares, plus an explicit guard on `CreateInitiativePage`. Majors: `stake` was still additive and
  reachable when a `get_my_stake` read failed (one-person-one-commitment was being enforced by an
  optimistic client read — now rejected in the contract); two members suggesting the same merge
  target left all but the first suggestion permanently undecidable; the mandate page showed the
  fixture's `760` backers directly above the contract's real `15`; an interrupted org sign-in
  stranded `gloki.organization` and trapped the next person in an org session.
  **Push (2026-08-06).** `origin/ui` had moved: Ouri's PR #21 dependency bump (`1094375`) landed
  2026-07-17, including **two major jumps** — `lucide-react` 0.525→1.24 and `jspdf` 3→4. Rebased
  the 17 commits onto it (no content conflicts — the bump touches only `package.json` +
  lockfile), then **reinstalled and re-verified against the new majors** rather than trusting the
  earlier green build: `tsc -b` + `npm run build` clean on lucide 1.24 / jspdf 4.2.1, gates clean,
  parity 1190/1190. `npm install` on macOS stripped Linux-only `libc` hints from the lockfile —
  reverted rather than pushing lockfile churn into an Ubuntu CI. Deploy green (run 31085623145,
  5m13s); live site verified serving the serif display face.
  **Follow-ups logged to §7** (unreachable `/collaboration` route, permanently-empty
  `NotificationsBell`, no conviction time-accrual, only one published mandate).

- **2026-07-14 — S32: Walkthrough-campaign Wave D — mandate-page recompose (SHIPPED+PUSHED;
  `a98cb8f..ffa3878`, 9 commits; deploy green). CLOSES the P8 walkthrough campaign.** Spec
  `docs/superpowers/specs/2026-07-14-mandate-page-recompose-design.md`; decisions D6 (keep shield),
  D7 (two-tone chin + extend the chin law), D8 (hand-rolled chrome in place), D9 (skip the extra
  share) locked by Eston at kickoff. UI-only — no contract methods, fixtures, routes, or DEMO bump.
  **F1:** `padding-top: $spacing-lg` on `.page` (the hero tucked -2.5px under the sticky bar); owned
  there, not in `Container.module.scss` (five other pages add their own top air). **F2/D6:** the hero
  `MandateCard` eyebrow changes from the brand label "Gloki Mandate" to the section label "Mandate
  summary" so it stops echoing the document card — the orphaned `mandate.card.aria` (the section's
  invisible aria-label) is retired into a new **visible** `mandate.card.eyebrow` (same fr/sw values),
  and the section switches to `aria-labelledby` on the visible span (id on the text node, so the
  Pending badge isn't swept into the name); shield kept. The shared `mandate.card.brand` is untouched
  (document card + MandateEngage still use it). **F3:** the document status Badge moves into a new
  `.eyebrowRow` (`justify-content: space-between`) top-right; `.metaRow` dissolves; the "Ratified
  {date}" line moves under the title, still gated by `status === 'ratified'` (never beside a Pending
  badge — S17). **F4/F5/D7:** the turnout line + Sybil-resistance (i) + plain/spec `SegmentedControl`
  relocate from directly-after-masthead to a bottom **two-tone provenance chin** (`$footer-*` tokens).
  Because the document card keeps its W4 4.5 uniform `$spacing-lg` inset (unlike the engage chins,
  whose hosts are `padding:0; overflow:hidden`), the chin bleeds with `margin: 0 -$spacing-lg
  -$spacing-lg` + matching `border-bottom-*-radius` — a new **padded-card bleed variant**; `.turnout`
  drops its own pill surface. Accepted trade-off: the view toggle now follows the content it swaps.
  **F6/D8:** `AdoptionFramework` "From mandate to action" gains hand-rolled sibling card chrome
  (white/`$dark-bg`, `$gray-200` border, `$radius-lg`, `$shadow-sm`, `$spacing-lg`); the white-on-white
  AdopterCard `<li>` → `$gray-50` (light) / `$dark-surface` (dark) so nested items stay distinct; the
  `$info-surface` summary box re-checked (dark ~9.5:1). **D9:** skipped (the hero's S11 pubkey-free
  Share already sits on the page). i18n (fr/sw only; en.ts is a partial dict): −1 `mandate.card.aria`
  +1 `mandate.card.eyebrow` (parity 1137/1137). Opus whole-branch adversarial review (4 dimensions →
  per-finding verify) = 0 blocker / 0 major; 1 minor applied (the engage-chin "one interaction
  grammar" rule now self-marks its scope so the provenance-chin carve-out is greppable at the rule),
  2 findings refuted with evidence. Verified 360px light+dark en/fr/sw on the published-mandate page:
  chin bleed measured exact (1px border gaps, rounded bottom corners), dark turnout ≈4.76:1 + info-box
  ~9.5:1 (AA), F2 eyebrow localizes + shield kept, F3 badge top-right + ratified date under title, F6
  nested AdopterCard distinct, `#docAnchor` "View full" lands the title, no console errors. DESIGN_SYSTEM
  "provenance / utility chin" variant codified; i18n native-review packet S32 section appended.
- **2026-07-14 — S31: Walkthrough-campaign Waves B+C — suggest-flow recompose + action-button
  captions (SHIPPED+PUSHED; `1d8a996..555d090`, 7 commits; deploy green on `5009ef1`).** Spec
  `docs/superpowers/specs/2026-07-14-suggest-flow-captions-design.md`; decisions D1 (pinned above
  composer) + D5 (fix the heart) locked by Eston. UI-only — no contract methods, fixtures, routes,
  or DEMO bump. **Wave B (A1/A3, D1):** on the suggest-to-author page the problem `ContextCard` moved
  from the top of `<main>` to a persistent "you're responding to" bar pinned directly above the
  composer (sibling of `<main>`, wrapper carries `@include page-column` so the card border stays
  inset); `$spacing-lg` top air added on `.dmMain`; header keeps eyebrow "Suggestion" + author-name
  h1 (one-h1 law); autoscroll-on-send re-verified. **Wave C (D1 finding, D5):** SolutionsBoard's three
  action buttons stack an icon+count row over a short visible caption (Back this / Request expert /
  Suggest merge) — they were icon-only; the sentence-length aria-labels were dropped so the visible
  caption is the accessible name (WCAG 2.5.3 Label-in-Name / voice control), and `aria-pressed` was
  added to the two toggles (upvote, request-review) — merge stays a plain action. ThreadedDiscussion's
  icon-only Heart gained a visible "Like (n)" label matching its labeled Reply/Delete neighbours.
  i18n (fr/sw only; en.ts is a partial dict): +3 caption keys, revived the orphaned
  `deliberation.thread.like`, retired the 3 approval aria keys + `deliberation.thread.likeCount`
  (parity 1137/1137). Opus whole-branch adversarial review (5 dimensions → verify) = 0 crit / 0
  important, 1 minor applied (the DESIGN_SYSTEM context-header rule now states the placement is
  context-dependent, since D1 moved the suggest card). Verified 360px light+dark en/fr/sw on the
  suggest page (caption contrast light 4.76 / dark 5.71, no fr/sw caption overflow), SolutionsBoard
  stage feed (active/backed state legible), and the discussion heart (liked red state). DESIGN_SYSTEM
  icon+caption action-button law codified; i18n native-review packet S31 section appended.
- **2026-07-13 — S30: Walkthrough-campaign Wave A — card anatomy unification (SHIPPED+PUSHED;
  `b87608e..6abc429`, 8 commits; deploy green on `5009ef1`).** First wave of the 2026-07-13 walkthrough campaign (P8).
  UI-composition only — no contract methods, fixtures, routes, or DEMO bump. (A-1) `.stageNavRow`
  insets to `$content-gutter`/`$spacing-md` — the 4-stage strip was flush to the card edge while
  every sibling row sat 16px in (C2). (A-2, **D2**) de-buttonized the current stage pill — dropped
  its fill + border (it read as an interactive button, borrowing DiscussionPill's grammar); "you
  are here" now rides the full-colour dot + `$gray-900` semibold label. (A-3/A-4) ProblemVoteFlow's
  bespoke threshold track/fill/marker → the shared `ProgressBar` kit: the redundant gray end-line
  (`thresholdMarker` `left:100%`) dies, `role=progressbar`+ARIA arrives, and the floating "Agreed by
  at least half…" `<p>` relocates from ProblemEngage's body into the bar block as its caption. (A-5,
  **D3**) new `chinExtras` slot on InitiativeStageCard + shared `ProblemChinExtras` (a "Suggest" pill
  — short label, full string as aria-label — + the copyable code chip) moved out of ProblemEngage's
  body into the chin of all three hosts; ProblemEngage slimmed to just the vote flow. (A-5.2, **D4**)
  the stage-feed card was restructured (card `padding:0; overflow:hidden`, inset `.summary`+`.body`,
  chin a full-width sibling) so its chin now carries the **same two-tone `$footer-surface` fill** as
  the community card — chin tint parity achieved, reversing the deliberate S25 §1.3 rule-only call;
  "Open in community" text link → outlined pill. i18n +1 key `card.suggestToAuthorShort` (parity
  1137→1138). Review: Opus whole-branch **0 blocker / 0 major**; 3 minor fixes applied (clamp bar
  `value` so aria-valuenow ≤ valuemax past the halfway mark; `order:1` on the code chip so the
  stage-feed Open pill groups with the actions instead of below the code reference; raw `600` →
  `$font-semibold`). Verified 360px light+dark en/fr/sw on community feed + stage feed (Discussion +
  "Suggest"/"Suggérer"/"Pendekeza" share row 1 in all three; S20 ::after hit-area survives the
  restructure — confirmed via elementFromPoint). **Limitation (honest):** the ProblemVoteFlow bar
  stayed StageGate-gated for the default demo visitor across all 4 seeded communities (join routes
  to onboarding) — the bar's kit swap is code-verified + build-green, the same limit the review
  session documented; a member/author persona is needed to see it render live. **Catches:** the
  campaign doc's `ProblemVoteFlow.tsx` path was stale (`initiative/stages/` → actually
  `collaboration/flows/voting/`); `$spacing-md`=12px (not 16px) so A-1 needed a 360px override the
  one-liner omitted; the DESIGN_SYSTEM `InitiativeStageStrip` section was itself stale (described a
  tappable/router-aware strip with `communityId`/`initiativeId` props — S19 W2 had already made it a
  pure non-interactive `<ol>`), corrected in the codification. DESIGN_SYSTEM: universal chin law +
  strip gutter/de-buttonize codified. Spec `docs/superpowers/specs/2026-07-13-card-anatomy-design.md`.
- **2026-07-12 — S29: UI-polish campaign Wave 6 — community chrome & collab polish (SHIPPED +
  PUSHED; `bfc9124..39c2d1f`, 7 commits, deploy run 29204217793). ★ CLOSES THE UI-POLISH CAMPAIGN —
  all 6 waves shipped.** The final, taste-heavy wave. (6.1) Hero secondary "Menu"→"Community
  options" (now its aria-label) + `aria-haspopup` `menu`→`dialog`. (6.2, **Eston, revised
  mid-session**) a visible full label can't fit beside "Start an initiative" at 360px across locales
  (row ≈286px / primary ≈172px, wider in fr), so the secondary became a compact **44×44 icon button
  + short "Options" caption** below it, side-by-side with the dominant primary (`community.menuCaption`
  new key). (6.3) deleted the blue `border-left:3px $primary` test artifact in CollabList — light +
  the orphaned dark override (W5 lesson: base sweeps miss `@include dark` overrides). (6.4, **Eston**)
  the global account menu is now **context-aware** — inside a community it prepends that community's
  8 mini-app sections (reusing `community.menu.*`), making every mini-app reachable from every
  section page via the one always-present hamburger, honoring the locked single-AppHeader model (no
  2nd header, no left drawer). (6.5/6.6) verify-only: createBtn AA (4.62 light / 6.23 dark) + 44px;
  no `800px` owner exists; collab header 16px gutter, 1 h1/1 header. **Re-grounding (15th straight
  catch):** the "800px owner" premise was dead; 6.1's aria was a fix not an add. i18n +1 key, parity
  1136→1137; UI-only → no DEMO bump. Review: adversarial Opus fleet (5 dims × refute) 0 findings +
  focused hero skeptic NO DEFECTS; grep gates clean; 360px preview light+dark+fr. DESIGN_SYSTEM:
  context-aware account-menu rule codified. Spec
  `docs/superpowers/specs/2026-07-12-w6-community-chrome-design.md`; memory
  `project_session29_jul2026`. **Next: `ui` is at its handoff-ready bar — coordinate the Ouri
  handoff (not ours to drive); optional post-handoff = the W5 tail (Currency/Members-Card/
  BallotSolutionCard).**

- **2026-07-11 — S28: UI-polish campaign Wave 5 — kit-first normalization + spacing/touch floors
  (SHIPPED + PUSHED; `8005caf..719f8b5`, 17 commits, deploy run 29169104710 green, live 200).** One mechanical sweep
  replacing bespoke controls with the shared kit + enforcing the DS floors. Kit adoption:
  `SegmentedControl` (StartDraft mode toggle, discussion sort), `ProgressBar` (IdentityTrust verify
  bar + SolutionsBoard's two threshold bars — the S22 all-determinate-bars law), `EmptyState` (chat
  error/not-found/empty, members, collab — loading stays bespoke since the kit requires a title),
  `Button` (stage-card open CTA, chat create/retry/back). **D1 (Eston):** SolutionsBoard folds
  commitments + evidence under one "Details" inline disclosure → 4 co-equal blocks (S15 principle);
  the two progress bars stay combined (no S15 regression). Floors: chat send 40→44, chat/topic
  inputs 44, mandate copyBtn 36→44; icon→label 8px (`$spacing-sm`) across ThreadedDiscussion,
  SolutionsBoard, MandateDocument, QVFlow, InitiativeStageCard; ProblemEngage rule-8 fix
  (`Send`→`leftIcon`; icon-as-child gate = 0). **D3 (Eston):** 5 controls DESIGN_SYSTEM carves out
  stay **bespoke** (CollabList `createBtn`, chat/DM `sendBtn`, `openLink`, QV stepper, mandate
  `copyBtn`) — W5 fixed only their contrast/floors, not swapped to `<Button>` (no kit variant
  matches without regressing). Dead CSS deleted (Members `.memberName`/`.section`). i18n: +1
  (`trust.your.barLabel`, an a11y-gain accessible name), 2 renamed (`evidence*`→`details*`), parity
  1136. **UI-only → no DEMO_VERSION bump.** Re-grounding (14th straight catch): the campaign kit list
  mis-scoped the 5 keep-bespoke controls, a phantom "collab ×", a non-existent CollabList 800px, and
  Button `md`=44 (doc said 40); §6#7 was already resolved in S27. The 360px preview walk caught + fixed
  a real dark-contrast bug (`createBtn` `$primary-dark` 3.45:1 in dark → `$primary-on-dark` 7.0:1 —
  the §241 dark-authoring trap). Review: adversarial Opus fleet (6 dimensions × refute-by-default) →
  0 blocker / 0 major, 3 minor (2 orphaned dark overrides left by deletions + 1 stale DS exemplar),
  all fixed (`651a1c9`); 3 grep gates clean; `tsc -b && vite build` green. Deferred (W5 tail, §7):
  Currency cluster (entangled), Members row→Card (consistency-only), BallotSolutionCard extraction
  (partial dedup, voting-core risk). Spec `docs/superpowers/specs/2026-07-11-w5-kit-floors-design.md`,
  plan `.../plans/2026-07-11-w5-kit-floors.md`.
- **2026-07-11 — S27: UI-polish campaign Wave 4 — context restoration + mandate composition
  (SHIPPED + PUSHED `929817e..940b03a`, deploy run 29153336157).** Gives acted-on sub-pages the item
  they act on, and composes the published mandate onto a coherent left edge with progressive
  disclosure — no long-scroll blow-up. **Eston locked (2026-07-11):** inline-expand depth (hero +
  commitments + turnout open; indicators + full adopter list collapse inline; verification prose →
  `(i)` modal); ContextCard = title+body only; raise the hero MandateCard; document the §6#7
  open-item affordance (no code change). (4.1) New shared **`ContextCard`** (`title?`/`body?`/
  `ariaLabel?`; renders `null` when empty; body `-webkit-line-clamp:4`) rendered on the discussion
  page **body-only** (header h1 is the initiative title, S23 → no double-title) from a `description`
  threaded through `InitiativeView`/`get_details`. (4.3) suggest-to-author renders it **title+body**
  (header h1 is the author) — `SuggestionDmView` self-fetches `get_details` via `contractRead` (no
  prop-threading through `ProblemEngage`). (4.4) MandateCard actions one row (drop `fullWidth`, both
  `size=md`, `.supportBtn{flex:1}`/`.shareBtn{flex:0}`) — verified 360px in en **and** fr
  ("Soutenir ce mandat" 171px + "Partager" 115px, one row, both 44px). (4.5) unify inset: MandateCard
  + MandateDocument `$spacing-xl`→`$spacing-lg` (RatificationPanel/AdoptionFramework already aligned).
  (4.6) raise the hero: MandateCard dark bg `$dark-surface`→`$dark-bg` (the campaign named the
  doc/ratification cards, but those were already raised — the hero was the flat one). (4.7)
  progressive disclosure: verification prose → `(i)` `InfoDisclosure` on the turnout strip; indicators
  `<dl>` behind an inline heading toggle (`aria-expanded`/`aria-controls`, chevron); full adopter list
  behind an inline toggle (`mandate.adoption.showAll {n}`/`hideList`). DESIGN_SYSTEM §5-rule-11
  (ContextCard/context-header pattern) + §6#7 (per-context open-item affordance) codified; ContextCard
  added to the primitive inventory. i18n +4 keys fr+sw (parity 1135); **English inline in `t()`,
  en.ts untouched**. UI-only → **no DEMO bump**. **3 stale-premise corrections** (4.2 already fixed by
  W1b; 4.5 only 2 files not 4; 4.6 named the wrong cards). Review: adversarial Opus Workflow fleet (5
  dims × adversarial refute) → **0 findings**, corroborated by grep gates (token-clean, no dead CSS,
  no dangling refs, single h1, parity OK). **One collapse bug caught in the 360px preview walk & fixed
  (`940b03a`):** the collapsed adopter `<ul>`'s `hidden` was defeated by `.list{display:flex}` →
  scoped `.list[hidden]{display:none}`. Specs
  `docs/superpowers/specs/2026-07-11-w4-context-mandate-design.md` + plan
  `docs/superpowers/plans/2026-07-11-w4-context-mandate.md`.
- **2026-07-10 — S26: UI-polish campaign Wave 3 — discussion-as-function + redundancy removal
  (SHIPPED + PUSHED `1b03eb1..f0400e8`, deploy run 29143572642).** Kills every UI holdover that made
  Discussion read as a 5th pipeline stage, and the duplicate controls the campaign flagged — WITHOUT
  adding a Discussion feed/stage/route (locked IA). **Eston locked (2026-07-10):** neutral pill +
  count (border as-is); fold the extra "In discussion" instances into Problems; CTA vocabulary
  Send points / Back this mandate / Add your organization; URL-addressable write-together sub-views.
  (3.1) **DiscussionPill** drops the `active` prop + `.active` warning skin — always the neutral
  "Discussion" label; the live comment count carries activity. (3.2) **`STAGE_META.discussion`
  deleted** — discussion-data cards fall back to the Problem badge (`|| STAGE_META.problem`);
  stage-feed compact-card "In discussion" badge removed. **Extra (re-grounding caught 2 instances
  beyond the campaign list):** HomeView "In discussion" section folded into Problems (real + sample
  buckets); the stage feed already surfaced them there. (3.3) SAMPLE_FEED s2 discussion→problem
  (component constant, **no DEMO bump**); CommunitySettings renders the 4 pipeline stages only (the
  stored discussion rule round-trips untouched). (3.4/3.5) duplicate "Discuss this problem" button +
  DiscussionActivityCard's second open action removed — the card-chin `DiscussionPill` is the single
  entry. (3.6) **WriteTogetherPage** sub-views moved from local state to `?draft=new`/`?draft=<id>`
  search params (S23 URL precedent) — both local back arrows gone, ghost **Cancel** added, header +
  hardware back pop editor→list; start→editor replaces the spent form entry. (3.7) **VoteExplainer**
  renders only for gated-out visitors (participants get the ballot's own "How hearts work"); the S11
  pre-gate auditability is preserved. (3.8) support-CTA vocabulary unified (§5 rule 20). **i18n:** 4
  keys retired (`stage.discussionPillActive`, `home.discussions`, `card.discussProblem`,
  `deliberation.discussion.open`), 4 re-worded (`currency.sendTitle`/`sendButton`,
  `mandate.card.showSupport`, `mandate.adoptCta`) — fr+sw in-commit, `stage.discussion` KEPT (3
  dynamic `` t(`stage.${id}`) `` consumers); parity 1135→1131; packet Session-26 section added.
  **DESIGN_SYSTEM §5-rule-10 codified** ("Discussion is a function, not a stage" — banned wordlist,
  no STAGE_META peer, no permission row, single chin entry; data stage stays real). **Verified:**
  `npx tsc -b` + `npm run build` clean; parity OK; preview 360px light+dark, en+fr (stage feed with a
  discussion-stage item, community cards, Home, settings, full write-together round trip incl.
  history-back, vote gated+ungated, currency, mandate). **Review:** adversarial Opus whole-branch
  fleet (5 finders → verifiers) — 2 minor comment-only findings (stale JSDoc/filter comments this
  wave's deletions orphaned) fixed; 1 refuted (participation-history badge in an untouched fixture →
  campaign round-2 backlog). Spec `docs/superpowers/specs/2026-07-10-w3-discussion-function-design.md`,
  plan `docs/superpowers/specs/2026-07-10-w3-plan.md`.
- **2026-07-10 — S25: UI-polish campaign Wave 2 — card-chin footer separation (BUILT + reviewed;
  push HELD for Eston's gate).** Spec'd 2026-07-09 (paused at the spec gate for handoff prep),
  resumed + built 2026-07-10. Tokens/SCSS/TSX-structure on 2 card components + docs, **no product
  behaviour, no fixtures → no DEMO_VERSION bump, no i18n**. (1) **`$footer-*` token family**
  (`$footer-surface`=`$gray-100`, `$footer-surface-dark`=`$dark-tint-subtle`,
  `$footer-border`=`$gray-200`, `$footer-border-dark`=`$dark-border`) — placed by the dark-tint
  block, deliberately NOT the Layout block (StageFooter `$footer-height` conflation). (2)
  **InitiativeStageCard `.actionsRow`→`.chin`**: hairline rule + recessed fill, moved OUT of
  `.engage` to be the `overflow:hidden` card's terminal child → two-tone footer
  (`$gray-50` well → `$gray-100` chin), radius-clipped; lands on all 5 community stage cards
  (shared shell). (3) **FeedEngagePanel `.actionsRow`→`.chin`**: separator rule ONLY (padded host,
  no clip) + `.openLink` `$primary`→`$primary-dark`, fixing a **pre-existing light-mode AA fail**
  (3.68:1→5.17:1; dark stays `$primary-on-dark` 5.75:1). (4) **DESIGN_SYSTEM "Card chin / footer"
  pattern codified** (fill only on full-bleed terminal-child chins; rule-only in inset hosts; chin
  link colours incl. rule-only chins; `$footer-surface-dark` locked to the `.06` tint — `.08`/`.10`
  drop chin text below AA). **Verified:** `npm run build` clean; preview 360px light+dark (two-tone,
  rule, flush/clipped corners, 44px controls, wrap-not-crush); live ratios (openLink 5.17 light/5.75
  dark; dark pill on composited chin ≈4.74); sweep = zero chin-attributable fails; 1 h1 + 1 header
  per route. **Review:** inline 0/0/0 + adversarial Workflow fleet (5 finders): 2 confirmed docs
  findings (this ledger flip; DESIGN_SYSTEM link-rule scope) — both fixed; 2 refuted; adjudicated
  notes: author-only double hairline (StageAdvanceBar rule + chin rule 12px apart) accepted as
  header-body-footer rhythm, W5 candidate; DiscussionPill dark border on the chin fill 1.61:1
  (was 2.36:1 — both sub-3:1; text 4.74:1 AA) surfaced to Eston as a taste call. Spec
  `docs/superpowers/specs/2026-07-09-w2-card-chin-design.md`, plan
  `docs/superpowers/plans/2026-07-09-w2-card-chin.md`.
- **2026-07-08 — S24: UI-polish campaign Wave 1b — canonical page-container (SHIPPED + PUSHED
  `2aa4e4e..215a772`, deploy run 28999082628 green, live site 200; adversarial 5-dimension review
  found + fixed 2 desktop defects, 9 findings refuted).** Continuation of W1 (Eston asked to do the
  deferred D-stretch same session). Tokens/SCSS/1 doc, **no product behaviour, no fixtures → no
  DEMO_VERSION bump, no i18n**. Spec `docs/superpowers/specs/2026-07-08-w1b-canonical-page-container-design.md`.
  (1) New **`@mixin page-column`** (`max-width: $content-max-width` + `margin-inline: auto` +
  `padding-inline: $content-gutter`) + **`$footer-clearance`** (80px = `$footer-height` + `$spacing-lg`).
  (2) The AppHeader `.bar` + `.titleBlock` and every outer scroll wrapper (Container `.content`,
  CommunityView `.body`, StageFeedView `.feedContainer`, HomeView `.home`, NotFound `.main`,
  CreateCommunityPage `.page`, OnboardingFlow `.flowMain`) `@include page-column` → on desktop
  (>640px) the header and content share ONE centred 640px column (verified at 1024px: bar/title/
  content all at the same left edge). (3) **Inner wrappers fill the column** — the bespoke
  600/680/720/800 max-widths on identity pages, community mini-apps, chat, writeTogether, funding,
  CreateInitiative, DiscussionStageView `.main` were dropped (the outer owns the column). (4) Footer
  clearance unified to `$footer-clearance` (killed the 64/72/80 drift). **Decisions (Eston):** full
  unification; canonical width 640; SCSS-mixin approach; **the mobile gutter is also normalized to
  16px on pages that were off it (12/24/32/40 → 16)** — a correction to W1b's initial "360px
  unchanged" framing: `max-width` caps are inert at 360px, but the inner-strip removed double-gutters,
  which IS the gutter law applied at mobile (all verified: content at 16px, no overflow). **Review
  fixes:** SuggestionDmView `.inputBar` (a full-width sibling of the centred `<main>`) → `@include
  page-column`; CollaborationPage (nested `cs.content` inside `.body` → double-column) →
  `styles.embedded` neutralizes the nested page-column. Codified the primitive + model in
  DESIGN_SYSTEM.md. Deferred beyond W1b: none (D-stretch fully landed). Next: W2 card-chin.
- **2026-07-08 — S24: UI-polish campaign Wave 1 — DS foundation (SHIPPED + PUSHED
  `5be46a2..8862197`, deploy run 28971810816 green, live site 200; adversarial review
  0 confirmed findings across 5 dimensions).** First wave of the P7 UI-polish campaign
  ([docs/ui-polish-campaign-2026-07.md](docs/ui-polish-campaign-2026-07.md)); tokens + SCSS + one
  doc, **no product behaviour, no fixtures → no DEMO_VERSION bump, no i18n**. Spec
  `docs/superpowers/specs/2026-07-08-w1-ds-foundation-design.md`. Shipped, all against existing tokens:
  (1) **Dark-mode contrast blocker cleared** — new `$success-on-dark` (#34d399) / `$warning-on-dark`
  (#fbbf24) complete the on-dark TEXT family; ProblemVoteFlow's dark `@include dark` re-themed the
  vote-button *background* but not its text, so `.upBtn`/`.downBtn` were ≈1.9/2.3:1 — re-declared to
  the on-dark tints (measured **7.6 / 5.3:1**), `.voteCount` inherits, captions
  (`.thresholdLabels/.yourVote/.undoHint`) `$gray-500`→`$dark-text-secondary` (**6.96:1**);
  `Button.secondary` resting state on dark `$primary`≈3.98:1 → `$primary-on-dark` (**5.75:1**).
  (2) **Header-gutter law** — new `$content-gutter` (16px = `$spacing-lg`) is THE one horizontal edge:
  AppHeader `.titleBlock` + brand `.header` 12→16, and every content column (Container `.content`
  24→16, CommunityView `.body`/StageFeedView `.feedContainer` mobile 12→16, DiscussionStageView
  `.main` double-pad collapsed to 0 so `.content` is the sole gutter). Mobile media queries no longer
  re-specify horizontal (vertical-only). Header vertical rhythm: top air 12→16, bottom 4→`$heading-gap`
  (8), eyebrow→h1 gap raw `2px`→`$spacing-xs`. Verified at 360px light+dark: header + body share the
  16px edge on stage-feed/community/discussion. (3) **Codified in DESIGN_SYSTEM.md** — the header-gutter
  law, the complete on-dark TEXT family + the on-dark-vs-on-surface rule, and the dark-authoring rule
  (re-theme a bg → re-declare its text/icon colour). **Decisions (Eston, 2026-07-08):** gutter = 16px;
  header top air = 16px; the D-stretch canonical page-container + desktop >640px alignment split to
  **W1b**. Known accepted side-effect: Container's mobile `.content` now inherits the base 72px bottom
  (more StageFooter clearance). CreateCommunity/CreateInitiative (24px) left for their Round-2 review.
- **2026-07-06 — S23: header/nav cohesion & stage↔community seams (SHIPPED + PUSHED
  `865819e..d9170d4`, deploy run 28855877263 green, live site 200; reviewed 0 Crit / 0 Imp).**
  Eston-directed pre-handoff UI polish; the prepared S23 kit-convergence prompt was
  superseded and **liquid delegation D3 was PAUSED by Eston** ("will happen later"). Spec
  `docs/superpowers/specs/2026-07-06-s23-header-nav-cohesion-design.md`. UI-only class →
  **no DEMO_VERSION bump**. Shipped, all against the seam, zero contract/wire changes:
  (1) **AppHeader gains `subtitle`** — a page's intro renders inside the title block under
  the h1 (one box, tight spacing); new DESIGN_SYSTEM law: no floating intro paragraphs below
  the header. HomeView `.introSubtitle` + StageFeedView's four blue `.thresholdBanner` info
  cards folded in; the stage-feed "Browse by stage" eyebrow dropped (the StageFooter already
  says it). (2) **Community mini-app headers → AppHeader + universal back** — `CommunityView`
  derives a per-section header from the URL (`matchPath`): a back button on every community
  route (history-pop when `location.key !== 'default'`, else a hierarchical fallback),
  eyebrow = community name, h1 = section title, subtitle = section intro. Eight mini-apps
  (Collab/Members/Funds/Chat/Identity/Settings/WriteTogether/CreateInitiative) dropped their
  duplicated in-content `<h2>+<p>` headers and private back buttons; CollaborationPage lost
  dead `title`/`subtitle` props + its in-content back header; ChatTopic lost its own back
  button. (3) **Card actions anchored to the footer** — `DiscussionPill` left the top
  `stageNavRow` and joined a bottom actions row beside "Open in community" / the blue open
  button in both card shells; SolutionsBoard's floating (i) moved beside the "Add a solution"
  control. (4) **Card expansion survives back-nav** — new `useUrlExpandedSet` hook keeps
  expanded-card ids in a `?open=` search param (replace-writes), so tapping Discussion and
  coming back restores the expansion (StageFeedView + CommunityHome; the `?initiative=` deep
  link seeds it). (5) **Anchor landings clear the sticky bar** — new `$sticky-scroll-offset`
  (76px) on CommunityHome's deep-linked card + MandatePage's doc anchor (was 32px < the ~61px
  bar; titles landed cut off). (6) **Discussion page headlines the discussed item** —
  DiscussionStageView h1 = the initiative title, "Discussion — {community}" demoted to the
  eyebrow. (7) **One mandate identity across the page + community card** — MandateDocument's
  masthead eyebrow unified to the "Gloki Mandate" brand (was "A global community mandate");
  the document shed its participants/countries/conviction stat trio + provenance line as dups
  of the hero card; MandateEngage (community card) now leads with the same "Gloki Mandate" +
  winning-solution title so "Show your support" → community page lands on a recognisably
  identical mandate — winner text from the **read-only** `useMandateJourney`, NOT `useMandate`
  (which deploys). Fixture `PublishedMandate.subtitle` field + 6 orphaned mandate i18n keys
  removed; **fr/sw parity 1134 = 1134**. Review: an adversarial 3-dimension whole-branch pass
  (correctness / a11y+structure / dead-code+design-system, Opus, 127 tool calls) returned
  **zero findings**. ★ Learnings: (1) removing a JSX usage *and* its import together STILL
  throws a stale HMR `ReferenceError` ghost at old line numbers that survives reload — restart
  the dev server; tsc-clean is the truth. (2) `useMandate` is NOT read-only — it calls
  `useFlowContract` (shared mode deploys if the sub-contract is absent); for a display-only
  mandate summary use `useMandateJourney`'s `vote.winnerText`. (3) universal back = history-pop
  with a hierarchical fallback, gated on `location.key !== 'default'` so a fresh deep-link still
  goes UP, not to a foreign site; hub tabs (Home/stage feeds/Identity) keep no back button.
  (4) all 9 of Eston's reported issues reproduced against HEAD — no stale premises this session.

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
