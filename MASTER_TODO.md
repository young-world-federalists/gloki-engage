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
- Web5 / censorship-resistant transport, mirror apps (now scoped as **research** in §7 P12 H5/H7; still not built)
- AI automated debate summaries & public-opinion analysis (keep AI to translate + light co-writing)
- On-chain anything (Ouri's separate backend track)

---

## 7. Roadmap

> **Cleaned up 2026-10-22.** The shipped tiers (P0–P11), the S16–S17 handoff tail and the old
> parked and blocked lists were moved **verbatim** to
> [docs/archive/ROADMAP_HISTORY_P0-P11.md](docs/archive/ROADMAP_HISTORY_P0-P11.md). Nothing was
> deleted. Every open item from those tiers is listed below with a pointer back. Statuses were
> re-checked against `ui` @ `195bc6b` where marked ✔; re-verify the rest against HEAD before building.

### Shipped (detail in the archive and in §8)

| Tier | What it delivered | When |
|---|---|---|
| Wave 1, UX overhaul, S1–S8 | 5-stage pipeline, onboarding, QV + conviction, mandate & impact, fr/sw, hierarchy/a11y, `FOR_OURI_seam.md` | to 2026-06-29 |
| P0 Pilot-readiness | Claims-honesty copy, reachable back half, comment announce | S9, 06-30 |
| P1 Navigation & IA | `InitiativeStageStrip`, the locked 4-stage browse IA | S10, 06-30 |
| P2 Trust, privacy & consent | Vote explainer + `VotePreview`, attributable-vote disclosure, consent | S11, 07-01 |
| P3 Evidence & expertise | Evidence and expert-review loop | S12, 07-01 |
| P4 Mandate rigor | Indicator target/baseline/cadence before ratification | S13, 07-01 |
| P5 Mission floor (part) | Offline anchor (`OfflineBanner`, data saver), localized country names | S14 |
| P5.5 Generalize Gloki | Global framing beyond the VftC pilot | S15, 07-02 |
| P6 Handoff readiness | UI-review campaign + S17 fix tail | S16–S17, 07-03 |
| P7 UI polish & DS enforcement | W1–W6 (gutter law, page column, card chin, kit floors, chrome) | S24 onward, 07-08→07-12 |
| P8 Walkthrough campaign | Waves A–D, card anatomy through mandate recompose | S30–S32, 07-14 |
| P9 Actor completeness | Editable conviction, author view, organization actor | S33, 08-05 |
| P10 Causes · status · impact | Causes forum, status bands, impact assessment | S35, 09-06 |
| P11 Community verification (demo) | W1 hub · W2 simulated call · W3 daily session · W4 notification centre + bell | S36–S39, 09-16 |
| Conviction time accrual ✔ | Strength grows with time held; seeded maturity; `DEMO_VERSION` → `global-v20` | S40, 09-16 (`40b9c09..f606d9f`) |
| Login + typography ✔ | Login control/contrast repair; system sans throughout | S41 `60aa937`, 09-22/23 |

### Open work (carried from the archived tiers)

**Code health**
- **Lint debt:** `npx eslint src` reports 44 errors and 7 warnings at `67ac268` (S45 cleared the
  five `rules-of-hooks` errors, all one early return in `CommunityView`). Left: 14
  `set-state-in-effect`, 9 `only-export-components`, 8 unused vars, 6 `exhaustive-deps` and a
  tail of singles. The build does not lint, so nothing is red. None of these is a known bug; take
  them as a style pass, file by file, with a walk per file touched.
- **Dev-only advisories:** `npm audit` (with dev) still lists vite 8.0–8.1.5, postcss, js-yaml,
  zod, nanoid and others. None reaches the Pages bundle (`npm audit --omit=dev` is 0 at
  `67ac268`); bump vite when convenient. `@types/react-router-dom` v5 sits in `dependencies`
  though React Router 7 ships its own types: remove it.

**Product gaps**
- **Liquid delegation (D3)**, the one named core mechanism still missing (fixture stub only).
- **`/…/collaboration` route unreachable** ✔ (no in-app link found at `195bc6b`). It holds the only
  cross-initiative merge/modify decision UI. Wire it up or retire it (P9 follow-up).
- **"Schedule for later" (P11 W2 follow-up, E4)** ✔ (no `AvailabilityGrid` in `src/`). Only honest
  once real availability matching and delivery exist; production version is WoT task B8.
- **Only one published mandate** in the demo, so the organization home reads thin (P9).
- **Content translation** of user-generated text (needs Ouri) and **more UI locales incl. Chichewa
  (`ny.ts`)**.
- **Offline last-view cache + WhatsApp-shareable summary** (P5 remainder). Interacts with P12 H5:
  a service worker becomes worth its cost once keys live in the browser.
- Points/currency depth, leaderboards (also §6).

**Production Web of Trust** — the plan is
[2026-09-17-ui-wot-build-plan.md](docs/superpowers/plans/2026-09-17-ui-wot-build-plan.md). Track A
(visual repairs) is implemented but not release-accepted. Track B (B1–B8) is blocked on gates
**G2–G4** in [the decision record](docs/superpowers/specs/2026-09-17-production-wot-decisions.md); G1
is decided. G2 is shared with P12 below. (That plan still says "display serif"; typography moved to
system sans on 2026-09-23.)

**Code health (low priority, from P7/P11 and the S20/S22 reviews)**
- P7 W5 tail: Currency empty states and input floors, Members rows → `Card`, `BallotSolutionCard`
  extraction. Also the P7 campaign's 10 taste calls and Round-2 backlog
  ([docs/ui-polish-campaign-2026-07.md](docs/ui-polish-campaign-2026-07.md) §6–7).
- P11 parked: focus after an approved card leaves; focus ring under the hub card's
  `overflow: hidden`; `listVerifiedMembers` can list the current user; demo verification state is
  per-browser, not per-key; dev sidecar should be `React.lazy` behind `import.meta.env.DEV`.
- Engage-stack wiring dedup (`useCommunityMemberCounts` + `StageEngageStack`); 44px `::after`
  hit-area mixin; `teaserTone` enum; FundingFlow kit adoption; VotingFlowShell extraction;
  ProblemVoteFlow threshold bar → `<ProgressBar>` (also lacks `role="progressbar"`).
- **StageGate loading-grace deploy gap:** shared-mode flows can start a deploy for a user the gate
  is about to block. Touches vote UX, so product care is needed.
- P9 W4 "looks AI-generated" audit was marked in progress; check
  [docs/ai-look-audit-2026-08-05.md](docs/ai-look-audit-2026-08-05.md) before trusting that.

### Next build

**P12 — Sovereignty, security & hardening (proposed 2026-10-22; nothing built).** Design:
[2026-10-22-sovereignty-security-track-design.md](docs/superpowers/specs/2026-10-22-sovereignty-security-track-design.md).
Makes "decentralized self-governance" (the `app.title`) a property a member can rely on rather
than a slogan: nobody can act as you, nobody can quietly rewrite the record, nobody can read your
ballot, you can leave with your identity, and losing your phone doesn't lose your vote.
**Baseline ✔:** login on `ui` takes a typed public key + server URL; there is no private key or
client-side signing in this branch, and no CSP/SRI on the Pages bundle. The 2026-09-25 audit
(`0e94913`) found the live initiative contract enforced **none** of the ballot rules the UI enforces.
Ouri applied `docs/contracts/2026-09-25-initiative-ballot-guards.py` on `server-side` on
2026-10-28, so initiatives deployed from then on are guarded; older ones keep the open methods.
Voter eligibility and impersonation (public keys, no signatures) remain open. **Server-side enforcement comes before any
cryptography**: a signed write to a contract with no rules is still an unguarded write.
- **H0 Decide (no code):** threat model (STRIDE + LINDDUN); close **G2** with three answers (signed
  writes verifiable by any reader? community contracts replicated? key never leaves the device?);
  **one root key** for agent + Semaphore + transport identities; recovery model; claims audit of
  every "decentralized / secure / private / anonymous" string.
- **H1 Keys in the user's hands** (`ui` + Ouri; after G2): on-device Ed25519, optional passkey
  unlock (WebAuthn PRF), signing inside `src/services/`, backup and rotation.
- **H2 Recovery through your vouchers** (`ui` + Ouri): 3-of-4 voucher re-attestation of a new key,
  with a waiting period and notice to the old key. Critical path for everyday users.
- **H3 Records nobody can quietly rewrite** (Ouri): signed append-only logs copied across
  contributor nodes, client-side verification, export/migration.
- **H4 Secret ballot** (Ouri + `ui`): the three phases in
  [FOR_OURI_blind_servers.md](docs/FOR_OURI_blind_servers.md) (Semaphore → ElectionGuard → QV
  budget proofs). Depends on H1.
- **H5 Delivery & supply chain** (`ui`; **can start now**): CSP `<meta>`, SRI, dependency
  automation and audit, reproducible signed builds + SBOM, a second mirror. **Dependency audit
  ✔ (S45, `67ac268`):** prod advisories 6 → 0; none had been reachable from the bundle. Open
  question before the CSP: the server URL is user-supplied (`state.user.serverUrl`), so
  `connect-src` cannot be pinned to one host; Eston's call.
- **H6 Contributor node hardening** (Ouri): rootless minimal image, signed images, scanning,
  `--role` flag from day one, later one-click packaging (YunoHost/Umbrel/Start9/Pi image).
- **H7 Metadata & connectivity** (research; transport still in §6 Deferred): Tor onion service
  per node; Reticulum/LXMF gateway for pilot sites without connectivity; SMS/USSD for
  notifications only.
- **H8 Assurance:** `security.txt`, disclosure policy, independent audit before any binding vote,
  incident and pause runbooks.
Startable on `ui` without waiting: H5, the H0 claims audit (copy change → confirm with Eston),
and the H0 threat-model spec. H1–H4 wait for G2 so key UX isn't built twice.

### Blocked / coordination (not ours to drive on `ui`)
- **Deploys:** Ouri merges `ui` → `server-side`, which triggers GitHub Pages. A push to `ui` does
  not deploy. (`main` is Ouri's stale old line.) **2026-10-23:** the merge is prepared as
  [PR #24](https://github.com/young-world-federalists/gloki-engage/pull/24)
  (`integration/ui-2026-10` → `server-side`, evidence in `docs/reviews/2026-10-integration/`);
  Eston merges it on 30 October if Ouri hasn't. Plan:
  [2026-10-23-forward-without-a-gate.md](docs/superpowers/plans/2026-10-23-forward-without-a-gate.md).
- **G2–G4** (WoT authority, live-call policy, scheduled matching), decided with Ouri.
- **Blind-server questions 1–5** in [FOR_OURI_blind_servers.md](docs/FOR_OURI_blind_servers.md).
- **fr/sw native review:** the packet is in
  [docs/i18n-native-review-candidates.md](docs/i18n-native-review-candidates.md); needs native speakers.
- **D12 server-side eligibility** for `add_impact_assessment` and `add_proposal.cause_id` (still
  UI-gated only). The three contract patches (`s34-initiative-contract-additions.py`,
  `2026-09-25-initiative-ballot-guards.py`, `s40-conviction-accrual.py`) were **applied by Ouri on
  `server-side` on 2026-10-28**; see §8.

---

## 8. Changelog

- **2026-10-28 — Contract patches applied on `server-side` (Ouri).** All three hand-off patches in
  `docs/contracts/` were applied verbatim to `src/assets/contracts/gloki_engage_initiative_contract.py`:
  S34 (causes `vote_comment`/`get_comment_votes`, impact assessments, `add_proposal(..., cause_id='')`),
  the 2026-09-25 ballot guards (R1–R4) and S40 conviction time accrual. **Trigger:** adding a solution
  silently failed on `server-side` because the UI sends `cause_id` and the old `add_proposal` didn't
  accept it. Contracts are immutable, so only initiatives deployed after this carry the new methods
  and guards. Still open: D12 server-side eligibility, the ballot-guards "Please confirm" (does the
  `contract_write` SSE `reply` carry the return value?) and the `Collection.__contains__` question
  (`docs/FOR_OURI_seam.md`). Not yet exercised against a live server.

- **2026-10-26 — S45: the hooks fix and the dependency audit land on `ui`.** Two commits, pushed
  to `ui` on Eston's go (`21d3eda..67ac268`). `d3e6fe8`: `CommunityView` returned early on
  `!communityId` before five hooks (all five `rules-of-hooks` errors in `src`); the guard now
  follows the last hook. That let the linter see the rest of the component: `props` was a fresh
  `{}` each render while properties were missing, so the fetch effect re-ran on every render;
  memoized (a forced failed read cost 10 `get_properties` calls before, 4 after; bounded either
  way). `67ac268`: `react-router-dom` 7.18.1 → 7.18.4, DOMPurify 3.4.12 → 3.4.17 (lockfile),
  `express` and `cors` moved to `devDependencies`; `npm audit --omit=dev` 6 → 0. Evidence: all
  three builds, grep gates; a 17-step route walk at 360px light + dark identical on the old and
  new router; the identity-card PDF generates on both. Lint 48/8 → 44/7. **Premises that had
  gone stale:** "five `rules-of-hooks` errors that can be real bugs" was one early return, latent
  (the route always supplies the id); the "dependency audit" was already concrete, as none of
  the six advisories was reachable from the bundle (DOMPurify only via jsPDF's unused `.html()`,
  the react-router CSRF only in RSC mode, express only in the mock server). PR #24 still open,
  no word from Ouri; `server-side` has no `build:beta` and no node image. **Learnings:** a
  forced failure that throws synchronously can hide a re-render loop (React batches the two
  `setState`s), so add latency before trusting the count; and in this container `pgrep -f`/
  `pkill -f` with a pattern that appears in your own command kills your shell, and killing the
  `npx` wrapper leaves Vite orphaned on its port: start `node node_modules/vite/bin/vite.js`
  and kill its PID. No strings or fixtures changed; no `DEMO_VERSION` bump.

- **2026-10-26 — S44 restart: S43 lands on `ui`, the landing site gets its own repo and a new
  publisher.** S43 (`claude/youthful-cerf-ltibol`, 11 commits) merged into `ui` on Eston's go as
  `c3e9010`, over the three ibc-node skill PRs (#25–#27); `build`, `build:beta` and fr/sw parity
  (`1510 = 1510`) green after the merge. The landing page left the bundle: it now lives at
  [young-world-federalists/gloki-site](https://github.com/young-world-federalists/gloki-site)
  (Eston created the repo; the Claude GitHub App cannot create org repos) with GitHub Pages on
  `main`, and `docs/site/gloki-site.bundle` is deleted. Eston's calls on the site: Buttondown
  `YoungWorldFederalists`; YWF named as builder, the agent row Planned, contact by waitlist reply;
  the site is published by the **Global Democracy Initiative** (a project of Young World
  Federalists, Inc., its fiscal and legal host) on **globaldemocracyinitiative.org** instead of
  gloki.app, with an imprint, a privacy page and the GDI network mark from the 2022 logo; waitlist
  sign-ups must not get the YWF newsletter (needs a separate Buttondown newsletter). Late in the
  session Eston reframed GDI around the backend (one person one vote, encryption, people holding
  their own data, Reticulum) with Gloki as the app on top; that rewrite is the next site session,
  briefed in `gloki-site/docs/brief-gdi-positioning.md`. **Premises that had gone stale:** `ui`
  had moved past `2946608`; lint is 48 errors and 8 warnings, not one (identical on `ui` before the
  merge, so not S43's; `npm run build` does not lint); the site history was 5 commits, not 6.
  **Learning:** a cloud container can't reach github.io, Webflow or buttondown.com, so check a
  live page from a phone, not from the session. No app code or strings changed in S44; no
  `DEMO_VERSION` bump.

- **2026-10-23 — S43 forum bylines: posts carry a name and a flag.** `src/services/forum.ts` grows
  one read, `getForumParticipants(ctx)`, returning the forum's authors as `get_partners` rows
  (`IPartner`); `ForumPage` dispatches the existing `fetchMemberProfile` thunk per row, so
  `ThreadedDiscussion` resolves bylines from `state.communities.profiles` with no community loaded
  and nothing in it changes. Seam hand-off entry under the S42 addendum (no new contract method, wire
  names unchanged). Demo stub seeds **one welcome post** from Priya Nair and registers her profile
  contract (nothing else registers personas in the beta). Account kind is now **editable from the
  profile page** (select in the edit modal, beta or any account that already has a kind) and shown
  as a badge on the Digital Agent card, so the Kind step's lead again says it can be changed later.
  Beta key hint without "across every community"; About/Contact back → `/` in the beta. 3 new + 1
  changed string at fr/sw parity (`1510 = 1510`), packet appended. **`DEMO_VERSION` → `global-v21`**:
  the forum seed is a fixture change, and a device that opened the empty S42 forum keeps it until
  the wipe. Evidence: `docs/reviews/2026-10-23-s43-forum-bylines/` (360px, light + dark, both
  builds green). Commits `4a46e66..e4646a1` plus this docs commit on `claude/youthful-cerf-ltibol`;
  **not pushed to `origin/ui`** (waits for Eston's go). ★ Learning: the prompt asked for
  `{ publicKey, address, profile }` rows "in the exact shape of `get_partners`"; those two cannot
  both hold, and the shape that lets Ouri reuse his member mapper is `IPartner` (`agent`, not
  `publicKey`). Also: a persona's profile only resolves where its profile contract is registered,
  which in the beta is nowhere until the forum seed does it.
  **Same day, Eston's follow-ups:** languages dropped for the beta (one flag, `SHOW_LANGUAGES`,
  hides the switcher; fr/sw stay in the bundle, no parity work for new beta strings). Then the
  **Impeccable critique** (skill installed globally from the GitHub clone; the engine binary from
  GitHub releases, since impeccable.style is refused by the proxy) ran dual-agent on the beta
  surfaces: **25/40, four P1s**, snapshot `.impeccable/critique/2026-10-23T12-40-54Z__src-pages.md`.
  Eston: fix everything, start with the unaided run, end it on one named ask. Fixed in three
  commits (unaided run; demo leakage + forum; mechanical): Create-my-key primary on the keys
  screen, sticky checkbox + Continue on Save your key, one primary pathway on the hub, Ready ends
  on "Ask someone who knows you", fabricated participation hidden, forum composer labelled with
  Enter as newline and delete confirm, plus the contrast and target fixes. Evidence
  `docs/reviews/2026-10-23-s43-critique-fixes/`. Locked calls (brand blue, system sans) reported,
  not changed. **Then the gloki.app landing page** was built as its own static site in
  `/home/user/gloki-site` (six local commits; repo `young-world-federalists/gloki-site` to be created
  on Eston's go): Impeccable `init` (PRODUCT.md from the 15 Oct thread), a degraded direction roll
  (roll service blocked by the proxy), Eston's pick "the line diagram", code-first build, two
  inspection rounds, finish review (8 fixes, 2 regressions, ship), documenter (DESIGN.md +
  design.json). One HTML + one CSS file, self-hosted Hammersmith One and Cabin, two real app
  screenshots, 158 KB, no third-party request, detector clean at 390 and 1440. Open: the
  Buttondown username (placeholder in the form), DNS for gloki.app, the status wording for "your
  own agent".

- **2026-10-23 — S42 beta trim: the test version is the network, not the pipeline.** One build
  flag (`VITE_APP_MODE=beta`, read only in `src/appMode.ts`; `npm run build:beta` / `dev:beta`)
  hides everything but sign-up, keys, vouching and one forum. Signed out, `/` is a doors page
  (person / organisation / contribute a node) that opens the existing login trimmed to a keys
  screen; onboarding in beta runs **save your key → account kind → profile → ready**, with honest
  copy (the key "works like a password", nothing signed or encrypted yet). New optional profile
  field `accountKind` on the Digital Agent through the seam (`docs/FOR_OURI_seam.md`, S42
  addendum; wire names unchanged). `/forum` mounts `ThreadedDiscussion` once (new `variant="forum"`:
  post, reply, like; no cause vote) on one demo discussion contract behind `src/services/forum.ts`.
  Every pipeline route redirects to `/`; StageFooter and community menu entries are hidden; the
  verification hub says "people who know you". Demo mode is untouched (HomeView, 4-stage IA, brand
  blue): nothing deleted. 52 new `beta.*` strings at fr/sw parity (`1507 = 1507`), packet appended.
  **No `DEMO_VERSION` bump** (no seeded fixture changed; the forum contract self-registers).
  Evidence: `docs/reviews/2026-10-23-s42-beta-trim/` (360px, light + dark, both builds green).
  Commits from `d004458` (five code commits plus this docs commit) on `claude/youthful-cerf-ltibol`, pushed to `origin/ui` on Eston’s go (2026-10-23).
  ★ Learning: the prompt named a `digitalAgentContract.ts` that does not exist; the agent is a
  localStorage store with no seam method, so "through the seam" meant the store type + a seam-doc
  entry, not a new contract call. Also: a fullPage screenshot clips this app because `body` is the
  scroll container — capture the viewport and scroll the body instead.

- **2026-10-22 — Roadmap clean-up + P12 sovereignty/security track proposed (docs only).** §7 cut
  from ~580 lines to ~115: shipped tiers P0–P11, the handoff tail and the old parked/blocked lists
  moved **verbatim** to `docs/archive/ROADMAP_HISTORY_P0-P11.md`, and open items consolidated under
  "Open work". **Premise corrections:** S40 conviction time accrual (`40b9c09..f606d9f`,
  `DEMO_VERSION` → `global-v20`) and the S41 login fix + system-sans typography (`60aa937`,
  `be19026`) were on `ui` with no §8 entry; they are now in the Shipped table. P9's "no time-accrual
  clock" and "bell permanently empty" follow-ups are closed by S40 and S39. New **P12** (design
  `docs/superpowers/specs/2026-10-22-sovereignty-security-track-design.md`) brings together the
  blind-server/secret-ballot note, WoT gate G2, the Reticulum comparison and frontend/node
  hardening, and adds a technology landscape. **Baseline found:** `ui` has no private key or
  client signing (login = typed public key + server URL), no CSP/SRI, and the live initiative
  contract enforces none of the UI's ballot rules until the 2026-09-25 guard patch lands. No code,
  fixtures or strings changed: **no `DEMO_VERSION` bump**, no i18n. ★ Learning: server-side rule
  enforcement comes before cryptography. Signing a write that the contract doesn't check protects
  nothing.

- **2026-09-16 — S39: P11 Prompt 2 Wave 4, notification centre and bell (BUILT + reviewed +
  PUSHED to `origin/ui` 2026-09-16).** Twelve commits from `74fe1a0` through closeout `0563d22`. Added
  owner-scoped notification persistence, strict hydration sanitization/deduplication and the nested
  `/identity/notifications` route; a shared semantic `NotificationItem`; a direct-link bell with an
  exact accessible unread count; and seven localized event families covering accepted merges, W1
  requests/approvals, W2 call offers, and W3 reminders/selections/thanks. Stable producer ids suppress
  StrictMode/reconciliation duplicates; active offer and selection actions expire honestly. Daily
  reminders are route-independent but explicitly tab-lifetime and owner-lifetime only. No fixture or
  seed changed, so `DEMO_VERSION` remains `global-v19`. i18n +36 keys and 1 changed value at fr/sw
  parity 1449/1449; the Session 39 native-review packet is recorded. Controller probes covered the
  100-row cap, corrupt/duplicate storage, wrong-owner suppression, W1/W2/W3 transitions and a same-key
  cross-server invite collision. The 360×780 browser matrix covered all seven families, malformed and
  expired records, reload persistence, bell counts 0/1/9/100, back navigation and light/dark en/fr/sw
  without horizontal overflow. Adversarial review found two major isolation defects (a one-render
  account-switch exposure and a private W2 registry collision); `289863c` fixed both and scoped
  re-review found 0 blocker / 0 major. Typecheck and production builds are green; only pre-existing
  Sass `darken()` deprecations remain. Audible screen-reader and native-language review remain external
  follow-ups. The local multi-model panel was not run because it requires separate authorization.
  Next-session handoff: `docs/session-prompts/session-40-next-roadmap.md`.
- **2026-09-09 — S38: P11 Prompt 2 Wave 3, the daily verification session (BUILT + reviewed;
  PUSHED with S39 to `origin/ui` 2026-09-16).** `ac8523b..5aaa30a`, five implementation commits from saved base
  `ac8523b`, plus review fix `95d5bad`. Added the
  nested `/identity/verification/daily` route, scheduled 21:00 UTC entry and five-minute join gate,
  2m30s lobby selection, deterministic groups of at most four, candidate/selected-verifier/observer
  branches, empty and partial outcomes, shared W2 calls, result summaries, candidate and verified-member
  hub doors, and dev-only clock/roster walkthroughs. The eight new seam functions are all explicitly
  simulation-only; queued writes carry an owner guard and `method: 'daily'`, selections/roles freeze,
  and route cleanup cancels child and parent timers. The shared countdown moved to wall-clock deadlines
  with visibility reconciliation and once-only completion. No fixture/seed edit; `DEMO_VERSION` stayed
  `global-v19`. i18n +55 keys at fr/sw parity 1413/1413; Session 38 packet added, native review pending.
  Controller walks covered candidate 0/2, selected verifier, observer, empty/partial pools, prior-voucher
  exclusion, frozen-role threshold crossing, reminder lifetime, daily metadata and route-away cancellation;
  dark 360×780 checked in en/fr/sw. Typecheck, production build, grep gates, parity and whitespace passed.
  Task reviews fixed five runtime ownership/result defects and five UI disclosure/focus/i18n defects;
  whole-session review found four P2 items, all fixed. Audible screen-reader verification remains manual.
  The local multi-model panel was not run because it requires separate authorization. W4 handoff:
  `docs/session-prompts/session-39-verification-w4.md`.
- **2026-09-07 — S37: P11 Prompt 2 Wave 2, the simulated verification call (BUILT + reviewed +
  PUSHED to `origin/ui` 2026-09-07 on Eston's explicit go — Ouri's merge to `server-side` deploys).** `64c3abe..666a8e5`, 22 commits. Four screens at
  `/identity/verification/call` — verifier picker, waiting room, in-call (both roles), summary — over a
  new in-memory simulation (`src/services/demo/verificationSim.ts`) behind the existing seam, plus the
  third pathway card. **No `DEMO_VERSION` bump**: UI and a demo module only, no fixture or seed data
  touched (mockApi.ts unchanged at v19). Kit gained `VerifyButton`, `VideoTile`, `CountdownTimer` +
  `useCountdown`; `MemberList` was extracted, closing S36's parked duplication at its third consumer.
  46 new i18n keys, fr/sw parity 1312 → 1358.
  **Decisions (Eston, 2026-09-07):** E4 "Schedule for later" does not ship — a simulation cannot honour
  a future slot and 84 toggles fight north star 1 (logged as a W4 follow-up); E5 each in-call
  verification is one `method: 'call'` vouch, up to four, so a full call verifies outright, and the
  picker excludes members who already vouched; E6 both roles ship, role derived from trust; E7 F10's
  camera/data line stays verbatim at the entry points **plus** a separate demo honesty line, because
  the demo never opens a camera.
  **Controller rulings during the build:** C1 an 8th seam function `joinAsVerifier` (E6's role inverts
  `inviteToCall`'s assumption); R2 the green fill is `$success-on-surface` — white on `$success` is
  2.54:1, the same ratio that gets `$gray-400` banned, and the locked brand-blue exception covers
  `$primary` only; R4 `CallFlow` owns `leaveCall` on unmount; R6/R10 completion and counts use the
  joined set so a call with a decliner cannot announce "3 of 4" as complete; R7/R8 44px hit areas and a
  sticky CTA (the plan had dropped "sticky" from the spec); R9 the completion panel is inline, not a
  scrim borrowing Modal's look without its obligations; R11/W6 role-accurate honesty and summary copy;
  R13 the zero-joined timeout keeps its inline banner and the **spec text** was corrected instead.
  **The wave's most valuable catch:** role was derived from live trust, so a candidate's own call
  banked vouches, crossed the threshold mid-call, flipped them to the verifier role — freezing the
  count, killing completion, and offering a "Verify" button under their own face. Found by both the
  task review (statically) and the controller's browser walk (running), and fixed by freezing role at
  flow entry. Opus whole-branch review **0 Critical / 2 Important / 7 Minor** → one fix wave (selection
  desync on Refresh; the verifier role's missing door recorded as open work), scoped re-review clean.
  Verified at 360px light+dark in en/fr/sw with both roles walked end to end; `tsc -b` and
  `npm run build` clean, grep gates clean, parity OK. Packet: Session 37 section, 46 keys, lead
  question whether Swahili `simu` reads as a video call or a phone call.
- **2026-09-06 — S36: P11 Prompt 2 Wave 1, community verification hub / request / approve / invite
  (BUILT + reviewed + PUSHED 2026-09-06; `628b574..54ec183`, 14 commits).** Spec addendum
  `docs/superpowers/specs/2026-09-06-s36-verification-w1-design.md` (Eston's E1–E3 rulings: 16 personas + 14
  non-member fixture people with the user's own count platform-wide; deterministic request outcomes; two
  pathway cards), plan `docs/superpowers/plans/2026-09-06-s36-verification-w1.md` (9 delegated tasks, 1 fix
  round). Scope classes: UI + fixture change (⇒ `DEMO_VERSION` `global-v18` → `global-v19`) + seam surface
  for Ouri (FOR_OURI S36 addendum). Kit: `Toast`, `ProgressBar segments`, `MemberCard`. Whole-branch Opus
  review (0 Critical / 5 Important / 16 Minor) → fix wave `dc213f9`: demo-honesty line (the branch had
  retired the only "(demo)" label on the vouch path), 44px hit areas on the journey's core taps, `busy` +
  `try/finally` guards, E1-consistent `IdentityTrust` copy, an agreement-free fr count string, FOR_OURI rows
  for `listVerifiedMembers` and the `requestId → requester` resolution. i18n +62 keys / −1 / 3 values changed
  (parity 1312/1312), packet Session 36 section with 9 native flags. Next: S37 (Wave 2, the call).

- **2026-09-05/06 — S35: P10 Causes forum, discussion status pill, impact assessment
  (SHIPPED+PUSHED; `101e4a3..03d6f5d`, 49 commits, pushed 2026-09-06 — includes the same-day
  final-review fix wave and the adversarial-panel R3 judge MUST fix wave).** Spec
  `docs/superpowers/specs/2026-09-02-s34-review-causes-impact-verification-design.md`; rulings
  `docs/superpowers/specs/2026-09-02-s34-decision-record.md` (D3–D7 and D12 drove the build; D1/D2/
  D8–D11/F9/F10 needed no code here). Scope classes: UI + **five contract-method additions**
  (`vote_comment`, `get_comment_votes`, `add_proposal.cause_id`, `add_impact_assessment`,
  `get_impact_assessments`) delivered as a patch for `server-side`
  (`docs/contracts/s34-initiative-contract-additions.py` + FOR_OURI S35 addendum) + **fixture
  change** (⇒ `DEMO_VERSION` `global-v17` → `global-v18`, reseeding comment votes, cause links and
  impact assessments). **D11** first: `CLAUDE.md`/skills corrected in W0 that Ouri merges `ui` →
  `server-side` (which deploys), not a direct `ui` push. W1 root-comment voting as "Causes"
  (labels only — URL/`stageKey`/contract slot unchanged, D3), roots-only enforced in both the demo
  stub and the real-contract patch (D4). W2 the five-band `DiscussionStatusPill` (D6) on every
  initiative card. W3 required cause alignment on new solutions with a #1 pre-select and a shared
  `CauseLine` demotion chip (D5). W4 the writer-rank eligibility ladder (D7) and the impact-
  assessment form/card/CTA/mandate section — **D12 accepted on the record: eligibility is UI-gated
  only**, filed as a follow-up for Ouri's contract roadmap in §7 Blocked/coordination. i18n +62
  keys / 1 retired at fr/sw parity 1251/1251 (`grep -oE "'[A-Za-z0-9_.]+':" src/i18n/{fr,sw}.ts |
  sort -u | wc -l` — layout-independent; the earlier line-anchored count under-reported by missing
  a shared-line double key, corrected by the R3 judge fix wave), appended to the native-review
  packet. Per-task subagent review clean (one Important caught and fixed at task 14: the impact
  CTA/rung computed from unloaded discussion data); an adversarial 3-advocate/1-judge whole-branch
  panel (R3) then found 38 more issues, of which 34 were MUST-fixed in a further 9-commit wave (2
  new i18n keys, `causes.vote.locked`/`impact.allRequired`) before push; the remaining LATER items
  are ledgered in §7. The whole-branch Opus review and push decision are Eston's gate,
  run separately from this closeout. **D2** (the sample-content fallback) stays **Eston's call, not
  built this session** — optional Task 16 in the plan. ★ Learning: the S33 conviction-subsystem
  lesson repeats in reverse — this time the wire patch, FOR_OURI addendum and UI-gated-only
  disclosure were written *in the same session* as the feature, not retrofitted after a gap.

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
