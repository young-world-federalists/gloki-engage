# Gloki UI — Master TODO

> **Living strategy doc.** The "why" (north-stars, mission, design philosophy, deferred scope) is
> evergreen; the roadmap is refreshed as we ship. Wave 1 execution history (Foundation + lanes A–G
> + the review wave) is archived at [docs/archive/WAVE_1_HISTORY.md](docs/archive/WAVE_1_HISTORY.md).

---

## 1. Why this exists (the two north-star principles)

Everything in this roadmap is judged against **two principles**, in this order:

1. **Usability first.** A young person on a cheap Android with intermittent data and English as a
   third language must be able to participate *without anyone sitting next to them.* Our concrete
   bar is the Voices-for-the-Climate KPI: **≥70% of participants complete the journey unaided.**
   Plain language, low cognitive load, guided steps, generous defaults, forgiving errors.
2. **A felt sense of transnational collaboration.** The product should make someone in Nairobi and
   someone in Lilongwe *feel they are building something together across borders* — through
   visible country presence, shared artifacts, live co-authoring, multilingual co-presence, and a
   collective output they can point to. Not a voting tool; a place where a global "we" forms.

If a task doesn't serve one of these, it is probably **Wave 2+** (deferred). See §6.

---

## 2. The mission this UI must enable

**Near-term, concrete:** Run **"Voices for the Climate"** — a 12-month transnational deliberation for
500+ youth across **Kenya, Nigeria, Malawi, DRC**, producing a published **"Young Africa Climate
Mandate."** The app must support its four phases end-to-end (all hardcoded UI for now; backend is
Ouri's separate track):

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
  *profile* tags but not UI locales) — **still open** (deferred from S14; a new `src/i18n/ny.ts` ≈1109 keys +
  `Locale` union + `LanguageSwitcher`; widens the human-gated native-review backlog).
- [MAJOR, coordinate w/ backend] **Content-translation strategy** — fixture/content text (problem titles,
  comments, solutions, mandate body) is English in every locale; decide per-card translation vs a "traduire"
  affordance. Backend-adjacent → coordinate with Ouri. **Still open.**

**P5.5 — Generalize Gloki beyond the VftC/Africa pilot (Eston direction, 2026-07-01).** The app reads as the
"Voices for the Climate / youth across Africa" campaign, not Gloki-the-global-platform. Scope a dedicated pass
(brainstorm first) across four aspects: (1) **UI copy & mission framing** (onboarding/homepage/about/stage
copy — e.g. the invitation "Voices for the Climate — jeunes de toute l'Afrique"); (2) **sample/fixture
content** (climate-themed problems/solutions/mandates → varied civic topics); (3) **geographic assumptions**
(`PILOT_COLORS` KE/NG/MW/CD, default/inviter country, pilot-country lists, region taxonomy defaults →
globally neutral); (4) **docs & positioning** (this file's §1–2 mission, memory). Sizable; its own spec→plan.

**P6 — Remaining Wave-1 debt.**
- Liquid delegation (**D3**) — the one named-but-missing core mechanism (only a fixture stub today).
- Wave 1.5 refactor lanes (design-system canonicalization, utils/types consolidation, shared-affordances
  extraction, voting-flow consolidation) — see archive.

### Blocked / coordination (not ours to drive on `ui`)
- **A — land `ui` → `main`.** `origin/main` is Ouri's real-server layer (mid-QA, 341-vs-2 diverged). Per the
  branch model he *derives* `new-features` from `ui` and pushes to `main`. Eston coordinates; not a merge we run.
- **D-apply — fr/sw native review.** The packet is verified-current
  ([docs/i18n-native-review-candidates.md](docs/i18n-native-review-candidates.md)); needs an actual native
  fr + sw speaker, then apply confirmed fixes.

---

## 8. Changelog

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
