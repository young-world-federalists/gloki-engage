# Gloki UI — Master TODO

> **Living document.** It is refactored after every review wave (see §6). Treat it as the single
> source of truth for what to build, in what order, and who owns which files when multiple
> Claude Code sessions run in parallel.

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

If a task doesn't serve one of these, it is probably **Wave 2+** (deferred). See §7.

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

**Long-term vision:** the Business Plan's 8-step Global Community Principle (Identity → Problem
Collection → Problem Selection → Solution Collection → Solution Consolidation → Global Discussion →
Voting → Global Impact). Much of its heavier machinery is **deferred** (see §7).

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

## 4. The parallel-session operating model

This roadmap is built to be executed by **many Claude Code sessions at once** without merge
collisions. The rules:

### 4.1 Foundation first (sequential, ONE session)
Phase 0 (§8) runs **alone and merges to `ui` before any lane starts.** It establishes shared
primitives and — critically — **pre-partitions the conflict-prone central files** so lanes never
touch them:
- `src/App.tsx` routing: Phase 0 pre-registers **every** lane's routes pointing at lazy placeholder
  components. Lanes only edit *their own* component file, never `App.tsx`.
- `src/services/demo/fixtures/`: Phase 0 splits sample data into **one file per lane**. Lanes edit
  only their fixture file.
- Design tokens, the shared component kit, and the i18n string scaffold are finalized here so lanes
  inherit them read-only.

### 4.2 Lanes own disjoint file trees
Each lane (§9) has an explicit **owned paths** list. **A lane may only edit files it owns.** If a lane
needs a change in a shared file, it records a request in §10 (Coordination log) for the Foundation
owner to apply between waves — it does **not** edit the shared file itself.

### 4.3 One worktree + branch per session
```
git worktree add .worktrees/<lane> -b lane/<lane> ui
# work, commit, verify (tsc + build + preview)
# open PR lane/<lane> → ui ; rebase on ui before merge
```
Because owned paths are disjoint and central files are pre-partitioned, merges are conflict-free.

### 4.4 Guardrails every session obeys
- **Hardcoded UI only.** No real backend. New data → add to your lane's fixture file and route reads
  through the existing `src/services/demo/` mock layer. Never reintroduce `?raw` Python imports.
- **Every string is translatable** (use the i18n scaffold from Phase 0; default English copy is fine,
  but no hardcoded user-facing strings outside the scaffold).
- **Design system is law.** Use tokens and shared components; no ad-hoc colors/spacing.
- **Verify before "done":** `npx tsc -b --noEmit` clean, `npm run build` clean, walk your routes in
  the preview, confirm dark mode + 360px-wide mobile + keyboard/screen-reader basics.
- **Stay in your lane.** Touching another lane's files is how we get conflicts — don't.

---

## 5. Test-user review panel (the diverse "users")

After each wave, a **review session** dispatches these personas as subagents. Each one assumes the
persona, attempts that wave's key journeys on the live preview build, and files findings with
severity (blocker / major / minor) against the two north-star principles. Their findings drive the
§6 refactor.

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

Review prompt template lives at `docs/session-prompts/REVIEW-WAVE.md` (generated before the first review).

---

## 6. The iterative loop

```
Wave N lanes  →  merge to ui  →  review session (panel walks preview)
      ↑                                      │
      └──────  refactor THIS file  ←─────────┘   (add/repri­oritize tasks → §11 changelog)
```
Each refactor: append findings to §11, re-sort the backlog, promote/deprioritize tasks, then write
the next wave's lane prompts.

---

## 7. Deferred (Wave 2+ — explicitly NOT now)

Kept here so we don't accidentally build them early (progressive-decentralization discipline):
- Biometric / hard identity verification (use lightweight invite + vouch for now)
- Council DAO, governor elections, full liquid-democracy depth
- Gloki Points economy, leaderboards, achievement/badge gamification depth
- Web5 / censorship-resistant transport, mirror apps
- AI automated debate summaries & public-opinion analysis (keep AI to translate + light co-writing)
- On-chain anything (Ouri's separate backend track)

---

## 8. Phase 0 — Foundation  *(SEQUENTIAL · one session · merge before lanes open)*

**Owner:** the first session (prompt: `docs/session-prompts/00-foundation.md`). **Goal:** make the
board safe for parallel play.

- [x] **F1 — Design-system hardening.** Audit `DESIGN_SYSTEM.md` vs reality; finalize tokens
  (color incl. full dark mode, spacing, type, radius, shadow) in `src/styles/`; document the rule
  "no ad-hoc values." Files: `src/styles/**`, `DESIGN_SYSTEM.md`.
- [x] **F2 — Shared component kit.** Consolidate the reusable primitives every lane needs:
  `Card`, `Button`, `Stepper`, `Modal`, `EmptyState`, `Banner`, `CountryFlag/Badge`,
  `CountryPresence` (who's here, from where), `PageHeader`, `StageFooter`. Files: `src/components/shared/**`.
- [x] **F3 — i18n scaffold.** Lightweight translation layer (`t('key')` + an English dictionary +
  a visible language switcher stub for EN/FR/SW). Every lane writes strings through it. Files:
  new `src/i18n/**`, `src/components/shared/LanguageSwitcher.tsx`.
- [x] **F4 — Information architecture + route pre-registration.** Define the VftC journey route map;
  in `src/App.tsx` register **all** lane routes pointing at lazy placeholder components (one stub
  file per lane, each in that lane's owned folder). After this, **no lane edits `App.tsx`.**
- [x] **F4b — Decompose the shared stage hosts (critical for conflict-free lanes).** `StageFeedView`
  and `InitiativeDashboard` are single files that render all five stages inline — a guaranteed merge
  hotspot. Extract each stage's content into its own component under `src/components/stages/`
  (`ProblemStage`, `DiscussionStage`, `ProposalsStage`, `VoteStage`, `MandateStage`), and make
  `StageFeedView`/`InitiativeDashboard` thin shells that just compose them. Lanes then own their stage
  component; **no lane edits `StageFeedView` or `InitiativeDashboard` after Phase 0.**
- [x] **F5 — Sample-data partition + VftC seed.** Split `src/services/demo/fixtures/` into one file
  per lane. Seed the flagship: a "Voices for the Climate" community, the 4 countries, ~12 youth
  personas with photos/countries/languages, and a climate initiative mid-deliberation so every
  lane opens onto realistic, populated, *collaborative-feeling* content. Files: `src/services/demo/fixtures/**`.
- [x] **F6 — Legacy cleanup.** The `ui` branch still carries pre-pipeline cruft (`IssueView`,
  `WishView`, `AgreementView`, `src/components/issue/**`, old flows: budget/qa/document/
  fundraising/scheduling/taskboard/ranking/scoring). Decide keep-vs-remove and delete the dead
  ones so lanes aren't confused. Files: those paths.
- [x] **F7 — Lane map + contribution protocol** committed as `docs/LANES.md` (owned-paths table from
  §9 + the §4 rules), so every session has the boundaries in-repo.
- [x] **Gate:** `tsc` + `build` clean; preview boots to a populated VftC community; merge to `ui`.

---

## 9. Wave 1 lanes  *(PARALLEL · one session each · start after Phase 0 merges)*

> Each lane: **Goal** (tied to a VftC phase / principle), **Owned paths** (edit only these),
> **Tasks**, **Done when**. Sessions may claim more than one lane.

### Lane A — Onboarding & Identity *(VftC Phase 1 · usability)*
**Goal:** A newcomer with an invite gets from "link" to "ready to participate" unaided, in their
language. Lightweight trust, not biometrics.
**Owned paths:** `src/pages/IdentityView.*`, `src/components/identity/**`, new `src/components/onboarding/**`, fixture `identity.ts`.
- [x] A1 Guided first-run: invite → vouch (Web-of-Trust *lite*: "a friend vouched for you") → create Digital Agent (name, photo, country, languages) → consent to deliberation rules. Stepper, plain language, skippable-but-nudged.
- [x] A2 Profile = "Digital Agent" card: country flag, languages, participation history, trust ("vouched by N"). Defer badges/Council.
- [x] A3 Empty/again states + dark mode + 360px + screen-reader pass.

### Lane B — Issue Selection & Problem framing *(VftC Phase 1→2)*
**Goal:** The *participatory* choice of what to deliberate — the moment a crowd becomes a "we" with a shared subject. Then frame the chosen problem.
**Owned paths:** `src/components/stages/ProblemStage.*` (created in Phase 0), fixture `problems.ts`. *(The `ProblemVoteFlow` mechanism lives in Lane D — you import it, you don't edit it.)*
- [x] B1 Issue-selection surface: propose/second/discuss candidate issues; show momentum; "this is what we chose together" payoff. Climate pre-seeded but not imposed.
- [x] B2 Problem framing: plain-language template, required sources (gentle), country relevance, SDG tag *(optional, light)*.
- [x] B3 Simplify ProblemVoteFlow copy ("Is this a shared problem?") + thresholds legible. *(ProblemStage frames the wrapped flow + a legible threshold line; in-flow copy change requested in §10 for Lane D.)*

### Lane C — Deliberation & Co-authoring *(VftC Phase 2 · collaboration heart)*
**Goal:** Where transnational collaboration is *felt* — co-writing across borders and languages.
**Owned paths:** `src/components/stages/DiscussionStage.*` + `src/components/stages/ProposalsStage.*` (created in Phase 0), `src/components/collaboration/flows/discussion/**`, `flows/modifications/**`, `flows/merge/**`, `src/components/collaboration/DiscussionStageView.*`, fixture `deliberation.ts`. *(Approval/QV mechanisms live in Lane D — import, don't edit.)*
- [x] C1 Threaded discussion with country presence, "hearts," categories; live-feeling co-presence ("3 people from 2 countries are here").
- [x] C2 Track-changes co-authoring: suggest edit → author accept/reject → co-author credit shown.
- [x] C3 Merge similar proposals (visible "your idea joined another") + expert-review affordance.

### Lane D — The three mechanisms *(VftC Phase 2–3 · DAO research)*
**Goal:** QV, conviction, and (new) liquid delegation — each explained in one plain sentence, each usable without a tutorial.
**Owned paths:** ALL of `src/components/collaboration/flows/voting/**` (`ProblemVoteFlow`, `ApprovalFlow`, `QVFlow`, `ConvictionStaking`, + new `Delegation*`), fixture `mechanisms.ts`. *(Stage shells in Lanes B/C/E import these components.)*
- [ ] D1 QV refine: frame as "spread your support — care a lot about one thing? spend more on it." Minority-empowerment, not math homework.
- [ ] D2 Conviction refine: "support that grows the longer you back it." Show accrual simply.
- [ ] D3 **Liquid delegation (new):** per-topic "vote yourself or delegate to someone you trust," revocable anytime, **capped + expiring**, transparent "here's how your delegate voted." This is the headline new build.

### Lane E — Mandate & Impact *(VftC Phase 3–4 · the payoff)*
**Goal:** The collective output you can point to, and the bridge to real-world adoption.
**Owned paths:** `src/components/stages/VoteStage.*` + `src/components/stages/MandateStage.*` (created in Phase 0), `src/components/collaboration/InitiativeDashboard.*` (thin shell + completed-state summaries), new `src/components/mandate/**`, fixture `mandate.ts`. *(QV/conviction mechanisms live in Lane D — import, don't edit.)*
- [x] E1 Consolidation → a readable published **Mandate** artifact (plain-language + "machine-readable spec" view). *(`MandatePage` at `/mandate/:communityId/:mandateId`; `MandateDocument` with plain/spec toggle + Copy JSON; provenance/legitimacy strip from the vote + conviction backing.)*
- [x] E2 Adoption framework: orgs "endorse / subscribe / report progress"; show who's adopted it. *(`AdoptionFramework`: seeded adopters with progress bars + notes; viewer can endorse/subscribe optimistically.)*
- [x] E3 Completed-stage summaries on the dashboard (participants, top proposal, winner) so the journey reads as a story. *(`JourneyRecap` "story so far" band stitches the existing stage summaries + a "View the published mandate" CTA.)*

### Lane F — Transnational presence, multilingual & low-tech *(cross-cutting · both principles)*
**Goal:** Make "across borders, across languages, on any connection" felt everywhere.
**Owned paths:** `src/components/shared/AITools.*`, new `src/components/shared/presence/**`, new `src/components/shared/connectivity/**`, i18n dictionaries `src/i18n/**` (content only).
- [x] F1 Live-translation affordance on posts (toggle "show in my language"); language switcher real. → `ShowInMyLanguage` (`shared/AITools`) + `LanguageBar` (`shared/presence`).
- [x] F2 Transnational presence motifs: country-flag clusters, "participants from N countries," world-map-lite. → `ParticipationSummary` + `WorldMapLite` (`shared/presence`).
- [x] F3 Low-bandwidth + offline UX: data-saver mode, "works offline / syncs later" indicators, WhatsApp/SMS-bridge *representation* (how a low-tech participant appears). → `useDataSaver`/`DataSaverToggle`/`SmartImage`/`SyncBadge`/`ChannelBadge` (`shared/connectivity`).

### Lane G — Community home & Currency *(lighter · collaboration)*
**Goal:** The community as a welcoming transnational "town square." Defer points economy.
**Owned paths:** `src/components/community/**` (except `chat/**` if another session takes chat), `src/pages/CommunityView.*`, `Currency.*`, fixture `community.ts`.
- [ ] G1 Community home: activity feed framed around the shared mission + country participation.
- [ ] G2 Currency page: keep simple; reframe as "community support points" explainer; defer mint/burn depth.
- [ ] G3 Consistency/dark-mode/mobile pass across community surfaces.

---

## 10. Coordination log *(cross-lane requests for the Foundation owner)*
> Lanes append here instead of editing shared files. Foundation owner applies between waves.

### Wave 1 batch 1 *(from open PRs #3, #4, #5, #6 — apply after they merge)*
- **[A → Foundation]** Post-login first-run routing. `/welcome/*` is built and reachable via the invite deep-link (`/welcome?invite=CODE`, e.g. `CLIMATE24`→Amani/KE) and a HomepageMenu entry, but `App.tsx` still redirects `/` → `/stage/problem`. Send first-run users (no `gloki.digitalAgent` in localStorage, or `gloki.onboarding.completed` false) to `/welcome` instead. Lane A cannot edit `App.tsx`.
- **[A → Foundation, minor]** Hide global `StageFooter` on `/welcome/*` — the 5-stage footer frames the first-run flow oddly for a newcomer.
- **[A → Lane F]** Promote inline `onboarding.*` and `agent.*` English defaults into `src/i18n/en.ts` + FR + SW overlays (Lane F owns `src/i18n/`).
- **[B → Lane D]** In `ProblemVoteFlow.tsx`, simplify copy: heading `"Does this problem truly cross borders?"` → `"Is this a shared problem?"`; buttons `"Problem for me"` / `"Not a problem for me"` → `"Second it"` / `"Not for me"`. `ProblemStage` (Lane B) wraps the flow with its own framing and passes empty `evidenceLinks`/`countries` on purpose so the flow stays focused on tally + progress bar.
- **[F → Foundation]** Add a durable dev route `/lab/presence` → `PresenceShowcase` (`src/components/shared/presence/PresenceShowcase.tsx`) so the cross-cutting primitives stay viewable after merge. Lane F verified via a temporary, reverted mount; no `App.tsx` change is on the Lane F branch.
- **[F → all lanes, FYI / non-blocking]** Reusable primitives ready to import: `ShowInMyLanguage` (`shared/AITools`); `LanguageBar`, `ParticipationSummary`, `WorldMapLite` (`shared/presence`); `DataSaverToggle`, `SmartImage`, `SyncBadge`, `ChannelBadge`, `useDataSaver` (`shared/connectivity`). Sample data: `services/demo/fixtures/presence.ts`.

## 11. Refactor changelog *(review-wave outputs)*
> Appended after each review wave: top findings + resulting task changes. Lane self-reports
> (pre-review-wave) also go here for traceability, clearly labeled.

### Wave 1 batch 1 — lane self-reports *(pre-review-wave)*
**Status (as of this entry):** Foundation (F1–F7) merged to `ui` ✅ at `fb64534`. Lane PRs **#3 Lane C**, **#4 Lane B**, **#5 Lane F**, **#6 Lane A** are **OPEN against `ui`** — merge them (in any order; files disjoint) to roll up into the next Pages deploy. Lanes **D, E, G not yet run.**

**What shipped (highlights — full detail in each PR body):**
- **Foundation** — semantic tokens incl. full dark mode; shared kit (`Button`/`Card`/`Modal`/`Stepper`/`EmptyState`/`Banner`/`Badge`/`CountryFlag`/`CountryPresence`); i18n scaffold + `LanguageSwitcher` (EN/FR/SW); `App.tsx` frozen with VftC route map; all 5 stages decomposed under `src/components/stages/*` (F4b); per-lane fixtures; Voices-for-the-Climate seed (12 personas across KE/NG/MW/CD, 5 initiatives one per stage); ~60 legacy files removed.
- **Lane A — Onboarding & Identity (PR #6)** — `/welcome/*` 5-step first-run (invite → vouch → Digital Agent → consent → ready); Digital Agent profile card with edit modal; invite deep-links (e.g. `CLIMATE24`→Amani/KE); agent persisted in localStorage.
- **Lane B — Issue Selection & Problem (PR #4)** — slate of candidate problems on `/stage/problem`; "We chose this together" payoff at ≥50%; "Propose a different problem" template (plain language, gently-required source, country chips, optional SDG); legible "X of Y agree — N more to go" threshold framing.
- **Lane C — Deliberation & Co-authoring (PR #3)** — `DeliberationThread` with hearts + category filters; `CoPresenceBar` ("12 from 4 countries", live ticker gated by `prefers-reduced-motion`); `CoAuthoringPanel` with track-changes + co-author credit; `ProposalMergePanel` with merge celebration + expert-review badge.
- **Lane F — Presence, Multilingual & Low-tech (PR #5)** — `ShowInMyLanguage` (fixture-driven, offline); `LanguageBar`; `ParticipationSummary`; `WorldMapLite`; `useDataSaver` + `DataSaverToggle` + `SmartImage`; `SyncBadge`; `ChannelBadge` (WhatsApp/SMS/USSD); full FR + SW dictionaries with parity to EN.

**Reusable primitives now available to all lanes (use, don't rebuild):**
| From | Components |
|---|---|
| `shared/AITools` | `ShowInMyLanguage` |
| `shared/presence` | `LanguageBar`, `ParticipationSummary`, `WorldMapLite` |
| `shared/connectivity` | `DataSaverToggle`, `SmartImage`, `SyncBadge`, `ChannelBadge`, `useDataSaver` |

**Known limitations / carry-forward to backlog:**
- **[C]** On the Initiative Dashboard, `ProposalMergePanel`'s optimistic state resets once if you act within ~1s of load (Lane E's dashboard remounts the active stage subtree when contract data resolves). Stable thereafter. A shared module-level store would harden it — defer until reviewers flag it as a real issue.
- **[A]** Created Digital Agent is **not yet injected into community member lists** (community-contract writes are out-of-lane) — Wave 2 task.
- **[B]** "Propose a different problem" deploys via the demo mock layer with the proposer's own second seeded — works, but no test of large slates yet.
- **[F]** `PresenceShowcase` verification page lives only in the Lane F worktree; needs `/lab/presence` route (see §10).

**Next step:** merge the four open PRs into `ui`, then either run lanes D/E/G **or** run the formal **`REVIEW-WAVE.md`** persona panel against the merged build now and let findings shape the rest of Wave 1.

### Wave 1 — Lane E self-report *(pre-review-wave)*
**Lane E — Mandate & Impact** shipped E1–E3 (`lane/lane-e` → `ui`). UI-only, hardcoded via `mandate.ts`; QV/conviction mechanisms imported from Lane D, not edited.
- **E1** `MandatePage` (`/mandate/:communityId/:mandateId`) renders the published **Mandate artifact** (`MandateDocument`): masthead (ratified badge, date, jurisdictions), provenance/legitimacy strip (participants · countries · conviction backers), and a **plain-language ↔ machine-readable spec** toggle with **Copy JSON**. Resolves the mandate from the initiative title, falling back to the flagship water mandate so the page always renders a credible artifact.
- **E2** `AdoptionFramework`: seeded adopters (youth network, ministries, NGOs, university, intergov) with adoption level, reported-progress bars + notes, an aggregate summary, and a viewer **Endorse / Subscribe** action that adds optimistically (session-local store).
- **E3** `JourneyRecap` on the dashboard at the mandate stage: a "story so far" timeline built from the already-fetched problem/discussion/proposals/vote summaries (live data where present, plain narration otherwise), plus a prominent **"View the published mandate"** CTA — mirrored as a compact link in the feed's `MandateStage` (derives `communityId` from the store; no shell change).
- **Verify:** `tsc -b` + `npm run build` clean; preview-walked dashboard recap → mandate artifact → plain/spec toggle → optimistic endorse (dark + light + 360px; no console errors).
- **Owned paths only:** `stages/VoteStage.*` (unchanged), `stages/MandateStage.*`, `collaboration/InitiativeDashboard.*` (recap + CTA), new `components/mandate/**`, fixture `mandate.ts`. **No `App.tsx` change** — the `/mandate/*` route was pre-registered by Foundation, so no §10 coordination entry is needed.

### Wave 1 — formal review-wave findings *(pending)*
- _(empty — run `docs/session-prompts/REVIEW-WAVE.md` against the merged build)_
