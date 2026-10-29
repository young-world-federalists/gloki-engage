# Wave 1 — execution history (archived)

> Archived from `MASTER_TODO.md` on 2026-06-01 when the parallel-lane execution model was
> retired. This is the historical record of Foundation (Phase 0), the Wave 1 lanes (A–G),
> the cross-lane coordination log, and the 2026-05-31 review-wave findings + Wave 1.5 plan.
> Still-actionable items (liquid delegation D3, the Wave 1.5 refactor lanes) are summarized
> in the current `MASTER_TODO.md` roadmap. Evergreen strategy stayed in `MASTER_TODO.md`.

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
- ✅ **[A → Foundation] — DONE (foundation/batch-2).** Post-login first-run routing. `/welcome/*` is built and reachable via the invite deep-link (`/welcome?invite=CODE`, e.g. `CLIMATE24`→Amani/KE) and a HomepageMenu entry, but `App.tsx` still redirects `/` → `/stage/problem`. Send first-run users (no `gloki.digitalAgent` in localStorage, or `gloki.onboarding.completed` false) to `/welcome` instead. Lane A cannot edit `App.tsx`.
- ✅ **[A → Foundation, minor] — DONE (foundation/batch-2).** Hide global `StageFooter` on `/welcome/*` — the 5-stage footer frames the first-run flow oddly for a newcomer.
- **[A → Lane F]** Promote inline `onboarding.*` and `agent.*` English defaults into `src/i18n/en.ts` + FR + SW overlays (Lane F owns `src/i18n/`).
- **[B → Lane D]** In `ProblemVoteFlow.tsx`, simplify copy: heading `"Does this problem truly cross borders?"` → `"Is this a shared problem?"`; buttons `"Problem for me"` / `"Not a problem for me"` → `"Second it"` / `"Not for me"`. `ProblemStage` (Lane B) wraps the flow with its own framing and passes empty `evidenceLinks`/`countries` on purpose so the flow stays focused on tally + progress bar.
- ✅ **[F → Foundation] — DONE (foundation/batch-2).** Add a durable dev route `/lab/presence` → `PresenceShowcase` (`src/components/shared/presence/PresenceShowcase.tsx`) so the cross-cutting primitives stay viewable after merge. Lane F verified via a temporary, reverted mount; no `App.tsx` change is on the Lane F branch.
- **[F → all lanes, FYI / non-blocking]** Reusable primitives ready to import: `ShowInMyLanguage` (`shared/AITools`); `LanguageBar`, `ParticipationSummary`, `WorldMapLite` (`shared/presence`); `DataSaverToggle`, `SmartImage`, `SyncBadge`, `ChannelBadge`, `useDataSaver` (`shared/connectivity`). Sample data: `services/demo/fixtures/presence.ts`.

### Wave 1 batch 2 additions
- **[D → Lane F]** New `mechanisms.*` i18n keys (`mechanisms.problem.*`, `mechanisms.qv.*`, `mechanisms.conviction.*`) ship with inline English defaults — please add FR/SW overlays in `src/i18n/{fr,sw}.ts`.
- **[G → Lane F]** New `community.*` / `stage.*` / `journey.*` / `currency.*` keys also need FR/SW backfill — folds into the existing onboarding i18n promotion above.

### Foundation batch-2 outputs *(applied 2026-05-31 on `foundation/batch-2`)*
Applied the 3 Wave 1 Foundation items above (first-run `/welcome` redirect, hide `StageFooter` on
`/welcome/*`, `/lab/presence` dev route) plus 6 §11 quick wins (#1–4, #6, #8). New cross-lane
requests this batch generated:
- **[Foundation batch-2 → Wave 1.5 lanes owning `src/pages/IdentityView.tsx` + `src/pages/StageFeedView.tsx`]**
  `PageHeader` now accepts an optional `menuOpen?: boolean` and renders `aria-expanded={!!menuOpen}` on
  the homepage menu button (the `aria-label="Open menu"` is already live). Pass `menuOpen={menuOpen}`
  from the two homepage `PageHeader` call sites — both already hold the `menuOpen` state that drives
  `onMenuClick` — so `aria-expanded` tracks the real open/closed state. Those page files are outside
  batch-2's owned paths, so this is deferred here rather than edited (per house rules).
- **[Foundation batch-2 → FYI]** Quick win #4 (remove unused `collaborationId` from
  `DiscussionStageView`) required a **1-line touch to the non-owned** `src/pages/collaboration/InitiativeView.tsx`:
  dropped `collaborationId={initiativeId!}` from the `<DiscussionStageView>` invocation only (the
  `CollaborationFullView` + `InitiativeDashboard` invocations keep it — they use it). The §11 prompt
  predicted "likely none" callers; there was exactly one, and no Wave 1.5 lane references
  `InitiativeView.tsx`, so the touch is collision-safe.

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

### Wave 1 batch 2 — lane self-reports *(pre-review-wave)*
**Status:** Lanes **D, E, G** merged into `ui`; DRAFT PRs **#16 E**, **#17 D**, **#18 G** opened against `main` alongside the earlier #9–#12 (A/B/C/F) and Foundation #8.

**What shipped:**
- **Lane D — Voting mechanisms (PR #17)** — *Usable without a tutorial.* **D0** ProblemVoteFlow copy ("Is this a shared problem?" / "Second it" / "Not for me", per [B→D] §10 item). **D1** QVFlow with tactile ♥ hearts; quadratic cost *felt, not shown* (draining support meter, hidden sqrt math, whole-vote results). **D2** ConvictionStaking: removed the free Amount field — duration is the sole lever, strength-fill meter ("How long will you back this?"). Prop shapes unchanged. **D3 (liquid delegation) intentionally deferred** to a later session.
- **Lane E — Mandate & Impact (PR #16)** — `/mandate/:communityId/:mandateId` with `MandateDocument` (masthead, provenance strip, plain-language ↔ machine-readable JSON spec toggle + Copy JSON), `AdoptionFramework` (seeded adopters with progress, optimistic Endorse/Subscribe), `JourneyRecap` timeline on the dashboard mandate stage with "View the published mandate" CTA.
- **Lane G — Community home & Currency (PR #18)** — Extracted `CommunityHome` + `MissionBanner` out of the 554-line `CommunityView`; 3 stacked bands (mission → country-presence via Lane F's `ParticipationSummary` → activity feed). Currency reframed as "Community Support Points"; mint/burn governance card removed (deferred §7). Removed redundant inline tab bar; backlog logged.

**New §10 coordination items added by this batch:**
- **[D → Lane F]** New `mechanisms.*` i18n keys (`mechanisms.problem.*`, `mechanisms.qv.*`, `mechanisms.conviction.*`) ship with inline English defaults — please add FR/SW overlays.
- **[G → Lane F]** New `community.*` / `stage.*` / `journey.*` / `currency.*` keys also need FR/SW backfill (folds into the existing onboarding i18n promotion).

**Carry-forward / backlog:**
- **[D]** Liquid delegation (D3, the headline new mechanism) was deferred — Wave 1.5 or 2 priority.
- **[G]** 5 orphaned components + dialog dark-mode gaps logged in Lane G's spec §9 (community-surface backlog).
- **[E]** No new coordination requests.

### Wave 1 — formal review-wave findings *(2026-05-31 · 22-agent workflow)*

Source: `wave-1-review-and-refactor` Workflow (8 dimension audits × 7 per-lane code reviews × 1 synthesis × 5 prompt generators). Read the workflow at `docs/session-prompts/REVIEW-AND-REFACTOR-WORKFLOW.md`; the generated Wave 1.5 lane prompts live in `docs/session-prompts/wave-1.5/`.

**Top 10 issues** (ranked by impact on usability × collaboration × Ouri-reviewability):
1. **Nine dialogs hand-roll modal/button/error markup** instead of using the shared `Modal` + `Button` + `Banner` — blocks reviewing dialog logic separately from chrome.
2. **Liquid delegation (D3) is still entirely missing** — the third transferable DAO mechanism, deferred during Lane D.
3. **Color tokens violated everywhere** — hardcoded pink-hex logout buttons, `rgba(0,0,0,0.5)` backdrops, locally-redefined `$initiative/$collab/$chat` colors across 6+ files.
4. **Modal lacks aria-labelledby + focus trap** — WCAG blocker inherited by every dialog.
5. **Time formatters + tree-builders duplicated across 5+ files** — silent maintenance tax.
6. **Country flags rendered three different ways** (`getCountryFlag()` string, inline emoji, `<CountryFlag>`) — breaks the felt-collaboration principle by making cross-border cues inconsistent.
7. **Mega-components** (ProblemStage 512, IdentityCardSVG 455, DeliberationThread 385, AdoptionFramework 359, CoAuthoringPanel 326) bundle orchestration + helpers + state.
8. **Voting flows duplicate pool-meter / country-breakdown / tap-submit loops** with zero structural sharing — blocks D3 from slotting in elegantly.
9. **i18n fragmented**: dialogs/onboarding/login hardcode English; fr.ts and sw.ts (~70 lines each) starved of parity vs en.ts.
10. **MandatePage mixes real `getInitiative` call with demo fixtures** — contradicts the UI-only contract.

**Themes:**
- Every lane reinvented its own dialog, button, empty state, and error banner instead of importing from `src/components/shared`.
- Tokens defined but not enforced — local hex/rgba literals proliferate.
- "Presentational" components absorbed orchestration + fixture-shaping + modal state, ballooning past 300 lines.
- Utility logic (time, tree, initials, author-name, country-flag) lives in 3–5 copies.
- i18n promotion on perpetual back-burner — every lane drops inline defaults.
- Accessibility an afterthought across lanes (missing aria-labels, no focus trap in Modal, `role='button'` on divs without keyboard handlers).

**Refactor plan → Wave 1.5 (5 lanes, fully written under `docs/session-prompts/wave-1.5/`):**

| # | Lane | Size | Depends on | Headline |
|---|---|---|---|---|
| 1 | `design-system-canonicalization` | medium | none | Make `variables.scss` the single source of truth; delete every local hex/rgba override. |
| 2 | `utils-and-types-consolidation` | medium | none (parallel to #1) | Move dup'd formatters/builders/types into `src/utils` + `src/types`. |
| 3 | `shared-affordances-extraction` | large | #1 | Canonicalize `Modal` (add focus trap + aria-labelledby), `Button`, `EmptyState`, `Banner`, `CountryFlag`, new `AuthorCard`; refactor 9 dialogs onto them. |
| 4 | `voting-flow-consolidation-and-D3-liquid-delegation` | large | #3 | Extract `VotingFlowShell` + `PoolMeter` + `CountryBreakdownChart`; **build the missing D3 liquid delegation** on top of them; split ProblemStage. |
| 5 | `i18n-promotion-and-multilingual-parity` | medium | #3 | Promote every inline default into `en.ts`; backfill `fr.ts` + `sw.ts` to parity; add missing-key dev warning. |

**Wave 1.5 run order:**
- **Batch 1 (parallel):** lanes #1 + #2.
- **Batch 2 (alone):** lane #3 (it's the largest; touches 25+ files).
- **Batch 3 (parallel):** lanes #4 + #5.

**Wave 1.5 quick wins** — Foundation batch-2 applied #1–4, #6, #8 (✅ below). #5, #7, #9, #10 are
deferred to the Wave 1.5 lane that owns each file (#5→lane 1 design-system, #7→lanes 3/4, #9→lane 3,
#10→lane 5):
1. ✅ `aria-label="Send message"` on ChatTopic send button. *(done — foundation/batch-2)*
2. ✅ `aria-label="Back to chat topics"` on ChatTopic back button. *(done — foundation/batch-2)*
3. ✅ `aria-label="Open menu"` + `aria-expanded` on PageHeader menu button. *(done — foundation/batch-2; live `aria-label` + `aria-expanded={!!menuOpen}`; parent `menuOpen` wiring requested in §10)*
4. ✅ Remove unused `collaborationId` prop from `DiscussionStageView`. *(done — foundation/batch-2; required a 1-line touch to non-owned InitiativeView, logged in §10)*
5. Document or delete unused `$secondary` token. *(deferred → Wave 1.5 lane 1)*
6. ✅ Wire `MandatePage` to read initiative title from `mandate.ts` fixture instead of `getInitiative`. *(done — foundation/batch-2; now reads the Redux store title — verified 0 backend calls on the mandate page)*
7. Add section-header comments every ~80 lines in DeliberationThread, CoAuthoringPanel, AdoptionFramework. *(deferred → Wave 1.5 lanes 3/4)*
8. ✅ Add ≥1 evidence URL per non-problem-stage initiative in `problems.ts`. *(done — foundation/batch-2; reforestation→IPCC, floods→WHO, water→WHO WASH)*
9. Add `aria-busy="true"` on dialog submit buttons during submission. *(deferred → Wave 1.5 lane 3)*
10. Add CSR-only / module-level-listener comments to AITools.tsx + useDataSaver.ts. *(deferred → Wave 1.5 lane 5)*

**Explicitly deferred (don't address now):**
- Backend persistence for Collab Document/Taskboard/Q&A/Roles/Scheduling — Ouri's track.
- Top-3 carry-over from Proposals → Vote — feature work, not refactor.
- Active-member tracking for quorum refinement — backend signal needed.
- Heavy `react-focus-lock` dependency — write a tiny in-house focus trap in lane #3.
- `useReducer` rewrite of CoAuthoringPanel's 6 `useState` hooks — premature.
- JourneyRecap data-driven refactor — defer until 2nd journey type exists.
- Canvas color tokens in `Share.tsx` — canvas API doesn't consume SCSS; documentation comment only.
