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

**Done — Wave 1** (Foundation + lanes A–G + the 2026-05-31 review wave): the 5-stage pipeline,
onboarding & identity, deliberation/co-authoring, the three mechanisms (QV + conviction; **liquid
delegation D3 still pending**), mandate & impact, presence/multilingual, community home. Full detail
and review findings: [docs/archive/WAVE_1_HISTORY.md](docs/archive/WAVE_1_HISTORY.md).

**Now — UX overhaul** (approved master plan; see project memory). Process reform first, then:

- **Batch 1 — Visual wins + global demo + cross-community home:**
  - Global demo reframing — drop the "Young Africa / climate" exclusivity; seed several globally diverse, multi-topic communities.
  - Visual / design-system fixes — proposal/vote toggle buttons, problem-title-vs-button hierarchy, whitespace, contrast.
  - New cross-community `HomeView` mixing problems / discussions / proposals / votes across communities.
- **Phase 2 — Navigation & IA:** one coherent menu model; promote "Start Initiative"; resolve the initiative-vs-problem overlap; prune the stepper to the create-initiative page only.
- **Phase 3 — Verification & permissions:** mock platform-wide web-of-trust verification; browse freely, verify/join prompts on interaction; a community settings screen for per-stage interaction requirements.
- **Phase 4 — Stage UX:** discussion-as-co-authoring (separate comments from contributions; kill the double "Join discussion" button); mandate card redesign (finite policy-style description + date + share + secondary actions; country data behind a button); vote demo content + button styling.
- **Phase 5 — Hand-holding + accessibility:** in-depth per-section welcome guide; diverse-persona accessibility reviews (the §5 panel).

**Still pending from Wave 1** (fold into the phases above where they fit): liquid delegation (D3);
the Wave 1.5 refactor lanes (design-system canonicalization, utils/types consolidation,
shared-affordances extraction, voting-flow consolidation, i18n parity) — see archive.
