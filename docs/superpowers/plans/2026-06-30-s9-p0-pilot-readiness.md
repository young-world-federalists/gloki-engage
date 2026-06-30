# S9 — P0 Pilot-Readiness Quick Wins — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the P0 pilot-readiness fixes — claims-honesty copy, a reachable back-half of the pipeline, and the highest-trust a11y/UX fixes — on the `ui` stub layer.

**Architecture:** Pure UI/stub work behind `src/services/api.ts`. Copy changes go through `t()` with fr+sw parity. The reachability BLOCKER is solved by opening ONE demo community's `stage_permissions` to `'anyone'` (honest, leaves the gate intact elsewhere) plus seeding a proposals-stage initiative there. A11y/affordance fixes are small, independent component edits.

**Tech Stack:** React 19 + TypeScript + Vite + Redux Toolkit + SCSS Modules. **No test framework** — every task verifies via `npx tsc -b` clean, `npm run build` clean, and `preview_*` observation at 360px (light + dark). This replaces the TDD test cycle the writing-plans template assumes.

**Spec:** `docs/superpowers/specs/2026-06-30-s9-p0-pilot-readiness-design.md` (read it; carries the framing decisions and exact line anchors).

## Global Constraints

- **Branch `ui`; keep it runnable.** No real-server calls from components — everything through `src/services/api.ts`. Demo seam emits **no `contract_write` events** → re-fetch after writes.
- **Tokens only** (DESIGN_SYSTEM.md); reuse the kit + the 5 redesign primitives (AppHeader / InfoDisclosure / StageStrip / CountryMultiSelect / Banner-role) + `UserIdentity` + `CountryPresence`. **AA gates** (≥4.5:1 normal text). 360px flagship; verify light + dark.
- **Every user-facing string** via `t('ns.key', 'English default')`. New/changed strings added to BOTH `src/i18n/fr.ts` and `src/i18n/sw.ts` (flat dotted keys). `en.ts` holds foundation keys; feature copy is en-inline (notably **no `mechanisms.qv.*` keys in `en.ts`**). If a key already exists in `en.ts`, update it there too.
- **i18n checks after any i18n change** (run both, both must be clean):
  - Parity (empty diff): `diff <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/fr.ts | sort -u) <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/sw.ts | sort -u)`
  - Code-ref cross-check: every new key referenced in a `t('key', …)` call exists in fr.ts + sw.ts (and en.ts if foundation); no added-but-unused key.
- **Build before every commit:** `npx tsc -b` clean AND `npm run build` clean (prod build runs `tsc -b`).
- **DEMO_VERSION** → `'global-v13'` (Task 2 only; one bump for all demo-data changes).
- **No push to `origin/ui`** — Eston confirms pushes.
- Repo is on a **slow external USB drive** — sequential I/O; one preview-driving agent at a time.
- **Out of scope:** blockchain copy (`about.closing`); pre-gate ballot explainer / vote-visibility / pseudonym (P2); mandate KPI target/title fill (P4); nav/IA (P1). New/changed fr/sw strings are **native-review candidates** — append them to `docs/i18n-native-review-candidates.md` when touched.

---

### Task 1: Claims-honesty copy (1p1v↔QV, vouch reconciliation, public/private disclosure)

**Files:**
- Modify: `src/components/onboarding/steps/RulesStep.tsx:18` (key `onboarding.rules.equal`)
- Modify: `src/components/collaboration/flows/voting/QVFlow.tsx:~230` (key `mechanisms.qv.guide`) + add disclosure line near ~245
- Modify: `src/components/onboarding/steps/VouchStep.tsx:42–46` (key `onboarding.vouch.explain` — only if wording needs aligning; keep "no ID papers, no face scan")
- Modify: `src/components/community/IdentityTrust.tsx:59–62` (key `identityTrust.intro`)
- Modify: `src/components/identity/AboutPage.tsx` (only any 1p1v/voting line that contradicts QV — **do NOT touch `about.closing` line 24**)
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` composer (~58–98) — add disclosure line
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts` (and `src/i18n/en.ts` for any key that lives there)
- Modify: `docs/i18n-native-review-candidates.md` (append new/changed keys)

**Interfaces:**
- Produces: new keys `mechanisms.qv.disclosure`, `deliberation.thread.disclosure`; changed keys `onboarding.rules.equal`, `mechanisms.qv.guide`, `identityTrust.intro`. Task 3 and Task 5 add further `deliberation.thread.*` keys — keep this namespace consistent.

- [ ] **Step 1: Locate the keys.** For each key (`onboarding.rules.equal`, `mechanisms.qv.guide`, `identityTrust.intro`, `onboarding.vouch.explain`), grep across `src/i18n/{en,fr,sw}.ts` and the call site to learn where the English default lives (en.ts vs inline) and confirm fr/sw entries exist:

```bash
cd "$REPO" && for k in onboarding.rules.equal mechanisms.qv.guide identityTrust.intro onboarding.vouch.explain; do echo "== $k =="; grep -rn "$k" src/i18n src/components | head; done
```

- [ ] **Step 2: Rewrite `onboarding.rules.equal` (1p1v + QV link).** Set the English copy to explain the relationship (keep both promises):

  `"One person, one voice — everyone gets the same say, and no one can buy more. When you vote, you spread that equal say across the issues you care about."`

  Update the call site default in `RulesStep.tsx:18` and the key in en.ts (if present), fr.ts, sw.ts.
  - fr: `"Une personne, une voix — chacun a le même poids, et personne ne peut en acheter davantage. Au moment de voter, vous répartissez cette voix égale sur les sujets qui vous tiennent à cœur."`
  - sw: `"Mtu mmoja, sauti moja — kila mtu ana uzito sawa, na hakuna anayeweza kununua zaidi. Unapopiga kura, unagawanya sauti hiyo sawa kwenye masuala unayoyajali."`

- [ ] **Step 3: Add equal-budget framing to the ballot guide (`mechanisms.qv.guide`).** Keep the existing guidance and lead with the equal-budget idea so it reads consistently with onboarding:

  `"Everyone here has the same set of hearts. Tap ♥ to back what you care about — spreading them across solutions costs less than piling them onto one."`

  Update the inline default in `QVFlow.tsx` and fr.ts / sw.ts (qv keys are NOT in en.ts).
  - fr: `"Chacun ici dispose du même nombre de cœurs. Touchez ♥ pour soutenir ce qui compte pour vous — les répartir entre les solutions coûte moins cher que de tout miser sur une seule."`
  - sw: `"Kila mtu hapa ana mioyo sawa. Gusa ♥ kuunga mkono unachokijali — kuigawanya kwenye suluhisho mbalimbali kunagharimu kidogo kuliko kuiweka yote kwenye moja."`

- [ ] **Step 4: Add the ballot disclosure line (`mechanisms.qv.disclosure`).** In `QVFlow.tsx`, after the guide (~line 245, before the ballot `.map`), render a muted hint line (use the existing muted/hint text token/class). State only what is visibly true in the demo (votes are attributable here — do NOT claim secrecy):

  `"Your hearts are visible to the community and counted in the public tally."`

  - fr: `"Vos cœurs sont visibles par la communauté et comptés dans le décompte public."`
  - sw: `"Mioyo yako inaonekana na jamii na inahesabiwa katika jumla ya wazi."`

- [ ] **Step 5: Add the composer disclosure line (`deliberation.thread.disclosure`).** In `ThreadedDiscussion.tsx` composer, below the textarea / near the submit button, render a muted hint:

  `"Comments are public to the community and kept as part of the discussion record."`

  - fr: `"Les commentaires sont publics au sein de la communauté et conservés dans l'historique de la discussion."`
  - sw: `"Maoni ni ya wazi kwa jamii na yanahifadhiwa kama sehemu ya kumbukumbu ya majadiliano."`

- [ ] **Step 6: Reconcile the vouch/identity story (`identityTrust.intro`).** Remove the "confirming real-world identity" implication of formal ID; make it social/peer confirmation consistent with VouchStep's "no ID papers, no face scan":

  `"Gloki uses a web of trust to keep the community real people, not bots. By scanning each other's QR codes, members vouch that they know you're a real person — no ID papers, no face scan. The more vouches you have, the stronger your community's democratic foundation."`

  Update `IdentityTrust.tsx` default + en.ts (if present) + fr.ts/sw.ts.
  - fr: `"Gloki s'appuie sur un réseau de confiance pour garantir que la communauté est composée de vraies personnes, pas de robots. En scannant les QR codes des autres, les membres attestent qu'ils savent que vous êtes une personne réelle — sans papiers d'identité ni reconnaissance faciale. Plus vous avez de cautions, plus le socle démocratique de votre communauté est solide."`
  - sw: `"Gloki hutumia mtandao wa kuaminiana ili kuhakikisha jamii ina watu halisi, si roboti. Kwa kuskani misimbo ya QR ya wenzao, wanachama wanathibitisha kuwa wanakujua wewe ni mtu halisi — bila vitambulisho wala uchunguzi wa uso. Kadiri unavyokuwa na uthibitisho zaidi, ndivyo msingi wa kidemokrasia wa jamii yako unavyokuwa imara."`

- [ ] **Step 7: Check AboutPage for a contradicting 1p1v/voting line.** Read `AboutPage.tsx`. If a line claims plain "one vote" in a way that contradicts QV, align it with the Step-2 framing. If only `about.closing` (blockchain) is relevant, make NO change here. Record the decision in the commit message.

- [ ] **Step 8: Run the i18n checks.** Both must be clean:

```bash
cd "$REPO" && diff <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/fr.ts | sort -u) <(grep -oE "'[a-zA-Z0-9_.]+':" src/i18n/sw.ts | sort -u) && echo "PARITY OK"
for k in mechanisms.qv.disclosure deliberation.thread.disclosure; do echo "== $k =="; grep -c "$k" src/i18n/fr.ts src/i18n/sw.ts; done
```
Expected: `PARITY OK`; each new key count = 1 in both fr and sw.

- [ ] **Step 9: Build.** `npx tsc -b` and `npm run build` — both clean.

- [ ] **Step 10: Preview-verify.** In the preview (port 5173, 360px, light + dark): onboarding step 3 shows the new 1p1v+QV line; the QV ballot shows the equal-hearts guide + the visibility line; the discussion composer shows the disclosure line; Identity & Trust reads as social vouch (no "real-world identity" ID implication). Snapshot the discussion composer + ballot.

- [ ] **Step 11: Append touched/new keys to `docs/i18n-native-review-candidates.md`** (changed: `onboarding.rules.equal`, `mechanisms.qv.guide`, `identityTrust.intro`; new: `mechanisms.qv.disclosure`, `deliberation.thread.disclosure`), then commit:

```bash
git add -A && git commit -m "feat(s9): reconcile 1p1v↔QV + vouch/identity copy; add ballot+composer disclosure lines"
```

---

### Task 2: Reachability — open the digital community + seed proposals/discussion + version bump

**Files:**
- Modify: `src/services/demo/fixtures/community.ts` (mark the digital community "open" — add a per-community marker)
- Modify: `src/services/demo/seedDemoCommunity.ts` (emit `set_stage_permissions` for open communities)
- Modify: `src/services/demo/fixtures/problems.ts` (add one `proposals`-stage initiative to `digital`)
- Modify: `src/services/demo/fixtures/deliberation.ts` (`PROPOSALS_BY_KEY`, `PROPOSAL_COMMITMENTS_BY_KEY`, `PROPOSAL_EXPERT_REVIEWS_BY_KEY`, `DISCUSSION_SEED_BY_KEY` for the new key + any empty reachable threads)
- Modify: `src/services/demo/mockApi.ts:17` (`DEMO_VERSION`)

**Interfaces:**
- Consumes: `set_stage_permissions` community-contract write (`demoContracts/community.ts:297`, values `{ permissions: Record<PipelineStage, StageRule> }`), `StageRule`/`PipelineStage` from `services/trustModel.ts`.
- Produces: the digital community resolves `proposals` + `vote` to `'anyone'`; a new digital `proposals` initiative key (name it e.g. `databroker`) with full deliberation fixtures.

- [ ] **Step 1: Read the open-gate mechanism.** Confirm the resolution path: `useCommunityTrust` → `getStagePermissions` → community contract `get_stage_permissions` returns `{ ...DEFAULT_STAGE_PERMISSIONS, ...state.stage_permissions }`; `set_stage_permissions` merges into `state.stage_permissions` (`demoContracts/community.ts:230,297–302`). Read `DEMO_COMMUNITIES` in `fixtures/community.ts` to find the digital community's key/id and its shape.

- [ ] **Step 2: Mark the digital community open.** In `fixtures/community.ts`, add an optional field to the community fixture type (e.g. `openStages?: PipelineStage[]`) and set it on the **digital** community to `['proposals', 'vote']`. Keep other communities unset (they stay gated).

- [ ] **Step 3: Emit `set_stage_permissions` during seeding.** In `seedDemoCommunity.ts`, after members are seeded, if the community fixture has `openStages`, write the open rules:

```ts
// open the configured stages for this community (honest "open pilot" — see spec)
if (communityFixture.openStages?.length) {
  const open: Partial<Record<PipelineStage, StageRule>> = {};
  for (const s of communityFixture.openStages) open[s] = 'anyone';
  communityWrite(communityId, {
    name: 'set_stage_permissions',
    values: { permissions: open },
  } as IMethod, publicKey);
}
```
  (Match the exact `values` shape `set_stage_permissions` reads at `demoContracts/community.ts:297–302` — verify the key name `permissions` vs the destructured name there and use the real one.)

- [ ] **Step 4: Add a `proposals`-stage initiative to digital.** In `problems.ts` `INITIATIVES`, add (in the Digital Rights Coalition block):

```ts
{
  key: 'databroker',
  community: 'digital',
  title: 'Reining In Data Brokers',
  description:
    'A handful of data brokers quietly buy and resell detailed profiles of billions of people, with almost no oversight. Propose how communities and regulators should rein this in. Add and back the solutions that should lead.',
  stage: 'proposals',
  scope: 'global',
  countries: ['US', 'DE', 'BR', 'KE', 'IN'],
  evidence: ['https://www.ohchr.org/en/topic/digital-space-and-human-rights'],
},
```

- [ ] **Step 5: Seed the new initiative's solutions + spine.** In `deliberation.ts`, add a `databroker` entry to `PROPOSALS_BY_KEY` (3 solutions, distinct persona authors), `PROPOSAL_COMMITMENTS_BY_KEY` (3 commitments per solution, matching the S4 shape used by other keys), and at least one `PROPOSAL_EXPERT_REVIEWS_BY_KEY` entry (with `metrics`) so SolutionsBoard shows the commitments/metrics spine and the expert-threshold bar is non-empty. Mirror the structure of an existing key (e.g. `amr`) exactly — copy its shape, change content. Keep solution text global/plain-language.

- [ ] **Step 6: Seed discussion threads for empty reachable threads.** Enumerate which live initiatives lack a `DISCUSSION_SEED_BY_KEY` entry:

```bash
cd "$REPO" && grep -oE "^\s*(water|amr|misinfo|privacy|ocean|adaptation|jobs|housing|databroker):" src/services/demo/fixtures/deliberation.ts
```
  For `misinfo` (digital, discussion stage) and any initiative in the open digital community whose Discussion would otherwise render empty, add a `DISCUSSION_SEED_BY_KEY` entry of 2–4 comments (diverse personas/countries, at least one reply). Mirror an existing seed's shape. Keep content multi-topic/global.

- [ ] **Step 7: Bump DEMO_VERSION.** `mockApi.ts:17` → `'global-v13'`.

- [ ] **Step 8: Build.** `npx tsc -b` and `npm run build` — both clean.

- [ ] **Step 9: Preview-verify reachability (the BLOCKER acceptance).** Clear demo storage / reseed (version bump forces it). As a fresh user (onboard with 2 vouches, NOT verified):
  - Navigate to the digital community → open the `databroker` initiative's Solutions stage → confirm interactive SolutionsBoard (seeded solutions, commitments, upvote works) with **no** "Verified members only" gate.
  - Open the `privacy` initiative's Vote stage → confirm the live QV ballot renders reviewed solutions, hearts castable, **no gate**.
  - Open another community's vote stage (e.g. health) → confirm the gate STILL shows (web-of-trust intact).
  - Open `misinfo` Discussion → confirm it shows seeded comments, not just the user's own.
  Screenshot the un-gated ballot + SolutionsBoard.

- [ ] **Step 10: Commit.**

```bash
git add -A && git commit -m "feat(s9): open digital community gate + seed proposals/discussion so a fresh user reaches the QV ballot & SolutionsBoard (DEMO_VERSION global-v13)"
```

---

### Task 3: A11y — announce comment posts + move focus (WCAG 4.1.3)

**Files:**
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx` (`handleTopLevel` ~257–261, composer ~299)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts` (new key `deliberation.thread.posted`)

**Interfaces:**
- Consumes: nothing new. Produces: key `deliberation.thread.posted`; an `aria-live` status region pattern reusable by replies.

- [ ] **Step 1: Add a polite live-region status.** In `ThreadedDiscussion.tsx`, add a visually-hidden `aria-live="polite"` element whose text is set to `t('deliberation.thread.posted','Comment posted')` after a successful top-level post. Use the project's existing visually-hidden utility/class (grep for one, e.g. `srOnly`/`visuallyHidden`); do not invent new CSS if one exists.

- [ ] **Step 2: Move focus to the new comment.** After `refresh()` resolves in `handleTopLevel`, focus the newly-posted comment. Track the new comment's id (returned/derivable from the write or by diffing the refreshed list), give that comment's container `tabIndex={-1}` + a ref, and `.focus()` it in an effect keyed on the new id. Remember the demo seam emits no events — the handler already re-fetches; hook the focus to that resolved state.

- [ ] **Step 3: Add the i18n key.** Add `deliberation.thread.posted` to fr.ts + sw.ts:
  - fr: `"Commentaire publié"`
  - sw: `"Maoni yamechapishwa"`

- [ ] **Step 4: i18n checks.** Parity diff empty; `grep -c "deliberation.thread.posted" src/i18n/fr.ts src/i18n/sw.ts` = 1 each.

- [ ] **Step 5: Build.** `npx tsc -b` + `npm run build` clean.

- [ ] **Step 6: Preview-verify.** Post a top-level comment in a discussion thread. Use `preview_snapshot` to confirm: a live-region announces "Comment posted" and focus lands on the new comment (check the accessibility tree / active element). Verify at 360px.

- [ ] **Step 7: Commit.**

```bash
git add -A && git commit -m "fix(s9): announce comment posts via aria-live + move focus to new comment (WCAG 4.1.3)"
```

---

### Task 4: Inviter-country default bug

**Files:**
- Modify: `src/components/onboarding/steps/AgentStep.tsx:31` (+ the country field's required/validation handling in the same file)

**Interfaces:** none new.

- [ ] **Step 1: Read AgentStep.** Read `AgentStep.tsx` around the country state (line 31) and how the field renders + how the step's continue/submit uses `country` (validation, propagation to the agent/profile).

- [ ] **Step 2: Drop the inviter fallback.** Change line 31 from `useState(agent?.country || voucher.country)` to initialise from the user's own value only: `useState(agent?.country ?? '')` (empty when unset). Do NOT fall back to `voucher.country`.

- [ ] **Step 3: Make it required + visibly unset.** Ensure the country selector shows an empty/placeholder state (no pre-selected inviter country) and that the step cannot be completed with an empty country (match the file's existing required-field pattern — e.g. disable continue, or show the existing validation message). If country was previously always-set and downstream assumed non-empty, confirm nothing breaks on empty (guard rendering that reads `country`).

- [ ] **Step 4: Build.** `npx tsc -b` + `npm run build` clean.

- [ ] **Step 5: Preview-verify.** Run onboarding via an invite path. Confirm the country field is **unset** (not the inviter's 🇮🇳/country), is required (can't proceed empty), and the chosen country is what shows on the resulting profile. Verify at 360px.

- [ ] **Step 6: Commit.**

```bash
git add -A && git commit -m "fix(s9): default profile country empty+required, not the inviter's country"
```

---

### Task 5: A11y micro-fixes (like-label, base-button contrast, title, plural, h1, heading, haspopup)

**Files:**
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.tsx:157,159` (like aria-label + count)
- Modify: `src/components/collaboration/flows/discussion/ThreadedDiscussion.module.scss:~156–172` (`.actionBtn` contrast)
- Modify: app root (set `document.title` via i18n) + `index.html` (fallback only)
- Modify: `src/components/mandate/AdoptionFramework.tsx:~100` (pluralization)
- Modify: `src/components/collaboration/DiscussionStageView.tsx:63–68` (h1 conveys stage)
- Modify: `src/components/AppHeader.tsx:88–96` (`aria-haspopup`)
- Verify/Modify: `src/components/community/CommunityHome.tsx` / `CommunityCard.tsx` (de-dupe heading)
- Modify: `src/i18n/fr.ts`, `src/i18n/sw.ts` (+ en.ts for `app.title` if foundation): new keys `deliberation.thread.likeCount`, `app.title`, and the plural country keys.

**Interfaces:**
- Consumes: `deliberation.thread.*` namespace from Tasks 1/3. Produces: keys `deliberation.thread.likeCount`, `app.title`, `mandate.country.one`, `mandate.country.other`.

- [ ] **Step 1: Like button label includes count.** `ThreadedDiscussion.tsx:157` — replace `aria-label={t('deliberation.thread.like','Like')}` with a count-bearing label:
  `aria-label={t('deliberation.thread.likeCount','Like ({count})', { count: likeCount })}`
  Add `deliberation.thread.likeCount` to fr/sw:
  - fr: `"J'aime ({count})"`  · sw: `"Penda ({count})"`

- [ ] **Step 2: Base `.actionBtn` contrast → AA.** In `ThreadedDiscussion.module.scss` `.actionBtn` (~156–172), the base color is `$gray-500` (~4.0:1, below AA). Replace with the documented AA-safe muted text token used elsewhere (grep DESIGN_SYSTEM / variables for the AA-safe `text-muted`/`$gray-600`+ token; mirror how the S8 `.liked` block picked light/dark-specific tokens). Ensure light AND dark ≥4.5:1.

- [ ] **Step 3: Localize `<title>`.** Add `app.title` (en: `'Gloki — Decentralized Self-Governance'`) to en.ts/fr.ts/sw.ts. In the app root (grep for the top-level App component / a layout that has `useT`), set `document.title = t('app.title', 'Gloki — Decentralized Self-Governance')` in an effect that re-runs on locale change. Leave `index.html`'s static title as the pre-hydration fallback.
  - fr: `"Gloki — Autogouvernance décentralisée"` · sw: `"Gloki — Utawala wa Kujitegemea Uliogatuliwa"`

- [ ] **Step 4: Fix "across N countries" pluralization.** `AdoptionFramework.tsx:~100`, key `mandate.adoptionBreakdown` uses `… across {countries} countries`. Add `mandate.country.one` (`'country'`) / `mandate.country.other` (`'countries'`) and build a `{countryWord}` from the count, then interpolate it; change the breakdown string to `… across {countries} {countryWord}`. Update fr/sw for all three:
  - fr: `mandate.country.one='pays'`, `mandate.country.other='pays'` · sw: `mandate.country.one='nchi'`, `mandate.country.other='nchi'` (adjust the breakdown string's word order per language if needed; the key set must stay parity-equal).

- [ ] **Step 5: Discussion h1 conveys the stage.** `DiscussionStageView.tsx:63–68` — make the AppHeader `<h1>` accessible name include the stage (e.g. set `title` to include "Discussion" or ensure the eyebrow is part of the heading's accessible name). Keep the single-h1-per-route contract (no second h1). Verify with the accessibility snapshot that the h1 reads e.g. "Discussion — {community}".

- [ ] **Step 6: De-dupe the community heading.** Read `CommunityHome.tsx` (~131–139) and `CommunityCard.tsx`. Confirm there is not a duplicate top-level heading for the same community (CommunityHome uses an `<h2>` feedTitle; check CommunityCard doesn't also emit an `<h1>`/duplicate). If a duplicate exists, demote it; if not, this step is a verified no-op (note it in the commit).

- [ ] **Step 7: `aria-haspopup` on the menu button.** `AppHeader.tsx:88–96` — add `aria-haspopup="menu"` to the menu trigger (it already has `aria-label`+`aria-expanded`). Confirm the popup's role matches (`menu`); if it's a generic dialog, use `"true"`.

- [ ] **Step 8: i18n checks.** Parity diff empty; new keys (`deliberation.thread.likeCount`, `app.title`, `mandate.country.one`, `mandate.country.other`) count = 1 in fr + sw (and en.ts for `app.title`).

- [ ] **Step 9: Build.** `npx tsc -b` + `npm run build` clean.

- [ ] **Step 10: Preview-verify.** 360px, light + dark: like button accessible name includes the count (snapshot a11y tree); `.actionBtn` text ≥4.5:1 via `preview_inspect` (light + dark); `document.title` changes with the LanguageSwitcher; a mandate with 1 country reads "across 1 country"; discussion h1 conveys the stage; menu button exposes `aria-haspopup`; no duplicate community heading.

- [ ] **Step 11: Append new/changed keys to `docs/i18n-native-review-candidates.md`, then commit.**

```bash
git add -A && git commit -m "fix(s9): a11y micro-fixes — like-count label, .actionBtn AA, localized title, country plural, discussion h1 stage, aria-haspopup"
```

---

### Task 6: Momentum + affordance (SolutionsBoard optimistic upvote; cards fully tappable)

**Files:**
- Modify: `src/components/initiative/stages/SolutionsBoard.tsx` (`handleToggleApproval` ~127–142; threshold bar ~213–219)
- Verify/Modify: `src/pages/HomeView.tsx`, `src/pages/StageFeedView.tsx`, `src/components/identity/InitiativeFeed.tsx:118` (whole-card tappable)

**Interfaces:** none new.

- [ ] **Step 1: Optimistic upvote.** In `SolutionsBoard.tsx` `handleToggleApproval`, before awaiting the write, optimistically update local state so the backing count / `myApprovals` reflects the toggle immediately (so the threshold bar at ~213–219 moves on tap). On the awaited refetch, reconcile to server truth; on error, revert the optimistic change. Keep the existing `setTogglingId` feedback. Respect reduced-motion (token-pure, mirroring the S4 reduced-motion treatment already in this board).

- [ ] **Step 2: Verify cards are whole-surface tappable.** `InitiativeFeed.tsx:118` already wraps the whole card in a `<button>`. Read the Home (`HomeView.tsx`) and stage-feed (`StageFeedView.tsx`) card renderers; confirm each card's whole surface is the tap target (a `<button>`/clickable container), not just an inner button. Fix any card where only an inner element is clickable (wrap the card as a button or add a full-surface click target, preserving keyboard focusability + accessible name). If all are already whole-card, note the verified no-op in the commit.

- [ ] **Step 3: Build.** `npx tsc -b` + `npm run build` clean.

- [ ] **Step 4: Preview-verify.** 360px: tap an upvote on SolutionsBoard → the threshold bar moves immediately (and respects reduced-motion when set); tapping anywhere on a Home/stage-feed/problem card opens that item. Screenshot the bar pre/post tap.

- [ ] **Step 5: Commit.**

```bash
git add -A && git commit -m "feat(s9): optimistic SolutionsBoard threshold bar on upvote; ensure feed cards are whole-surface tappable"
```

---

## Self-review notes (author)
- **Spec coverage:** Item 1 → Task 1; Item 2 → Task 2; Item 3 → Task 3; Item 4 → Task 4; Item 5 → Task 5; Item 6 → Task 6. All six P0 items covered.
- **Sequencing:** Tasks are independent and run **sequentially** (slow drive; single preview browser). ThreadedDiscussion.tsx is touched by Tasks 1 (composer disclosure), 3 (live region/focus), 5 (like label) — run in that order; each implementer reads current file state.
- **i18n:** every string change pairs with fr+sw edits + the parity/cross-check commands; new keys enumerated per task.
- **No unit tests** (no framework) — verification is build + preview per the project standard.
- **Final gate (after Task 6):** local multi-model review panel on the full session diff (no `--free-ram`/`--quit-chrome`); Opus whole-branch review; then ask Eston before any push.
