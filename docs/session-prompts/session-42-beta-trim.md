# Session 42 — The beta trim: sign-up, keys, verification, three kinds of account

Paste into a fresh Claude Code session in the Communities2 repo (branch `ui`, HEAD `2ad0f1d` at
the time of writing; deployed site is `server-side` `d930a9e`, with
[PR #24](https://github.com/young-world-federalists/gloki-engage/pull/24) pending to bring S34–S41
onto it). This session builds **the version test users will see**. Eston's framing (2026-10-23):

> "The test version we're deploying right now for users is basically only focused on the
> authentication and the encryption and getting people signed up as different audiences —
> showing that you can be an organization or a contributor or just a normal user. It's not
> actually focused so much on the democracy part yet."

And the agreement with Ouri (email thread "Plan for Gloki beta", 15 Oct 2026, Ouri: "Sounds
good"): **the beta is the network, not the pipeline.** Four things: (1) you get in because people
who know you vouch for you, (2) you get your own agent that holds your data, (3) if you can, you
host a node and help carry the network, (4) everyone shares one forum. **No communities in the
beta**; Problem → Discussion → Solutions → Vote → Mandate returns later.

This session is a **trim and a focus**, not a rebuild. Nothing shipped gets deleted; the pipeline
stays in the codebase behind a build-time flag so the demo still exists. What is NOT in scope:
new cryptography beyond what H1 of the P12 design specifies for this phase, the forum contract
(Ouri's), liquid delegation (paused), any new democracy mechanic.

## What "done" looks like

A `beta` build mode (Vite `--mode beta`, `VITE_APP_MODE=beta`) where a first-time visitor can,
on a cheap Android at 360px, in English/fr/sw:

1. **Arrive** at a page that says what Gloki is in two sentences and offers **three doors**:
   *Join as a person* · *Join as an organisation* · *Contribute a node*. (The doors mirror the
   gloki.app landing page's three audiences; the landing page is a separate repo and is not this
   session.)
2. **Get keys**: an identity is created on the device (reuse the existing login/agent flow;
   where a real keypair doesn't exist yet on `ui`, the UI must say honestly what is and isn't
   protected — see the claims audit below). Show the public key, explain the backup step in
   plain words, make backup a step not a footnote.
3. **Sign up as one of three account kinds** with a stored `accountKind: 'person' | 'organisation' |
   'contributor'` on the digital agent profile (seam: a new field on `set_profile`/`get_profile`
   in `digital_agent_contract.py`; demo stub + `docs/FOR_OURI_seam.md` in the same commit).
   Organisation reuses `src/services/organizationActor.ts` and the existing organisation
   home; contributor reuses nothing yet (there is no node runtime to point at — see Decision 3).
4. **Get verified** through the existing S36–S39 verification hub, unchanged in mechanics,
   trimmed in copy to the beta's vocabulary ("people who know you" rather than "members of a
   community").
5. **See one shared forum** instead of community feeds: the existing `ThreadedDiscussion`
   mounted once at a single, well-known contract (seam decision below), with posts, replies,
   likes, up/down votes (Causes machinery, renamed). No stages, no StageFooter in beta mode.
6. **Never see** community creation, join-community, currency, initiatives, the 4-stage
   browse, mandates, organisation adoption. Routes still exist in the code; in beta mode they
   redirect to `/`.

Plus: a claims audit of every string shown in beta mode against what the code actually does
(P12 H0 — "decentralized", "secure", "private", "anonymous", "encrypted" only where true today).

## Phases

**Phase 0 — Re-ground (no code).** Run the premise checks below. Then write the spec
(`docs/superpowers/specs/2026-MM-DD-s42-beta-trim-design.md`) and plan
(`docs/superpowers/plans/…`) as docs commits before any feat commit. The spec must contain the
route table for beta mode (every existing route → kept / redirected) and the string inventory
for the claims audit.

**Phase 1 — Mode switch.** `import.meta.env.VITE_APP_MODE` read in exactly one module
(`src/appMode.ts`), consumed by `App.tsx` (route table), `StageFooter` (hidden in beta),
`HomepageMenu` (trimmed entries). `npm run build:beta` script. Both modes must build; `ui` stays
runnable in demo mode by default.

**Phase 2 — Three doors + account kind.** New `src/components/onboarding/DoorsPage.tsx` as the
beta `/`; extend `OnboardingFlow` with an account-kind step; `accountKind` through the seam.
Copy goes through `t()` with fr/sw parity and the native-review packet append.

**Phase 3 — Keys and honesty.** Reuse `LoginPage` + agent creation. Add the backup step. Run the
claims audit and change copy, not behaviour. Where `ui` today has no private key (verified
2026-10-22: login is a typed public key + server URL), the beta copy must not claim signing or
encryption; if Eston wants the H1 on-device key for the beta, that is a separate decision
(Decision 2) and a separate session — do not slip it in.

**Phase 4 — One forum.** Mount `ThreadedDiscussion` at a single forum contract. Rename Causes
vocabulary to forum vocabulary in beta copy only (wire names unchanged: `add_comment`,
`like_comment`, `vote_comment`).

**Phase 5 — Review + evidence.** Preview walk at 360px, light + dark, en/fr/sw, of the complete
beta journey (arrive → door → keys → account kind → verification hub → forum post), with
screenshots in `docs/reviews/2026-MM-DD-s42-beta/`. Opus whole-branch review. Then the push gate.

## Re-verify these premises vs HEAD (prompts go stale — S10–S15 each found one dead)

- `ui` HEAD is `2ad0f1d` and PR #24 is still open / has merged — `git log -1 origin/ui`,
  `git log -1 origin/server-side`. If #24 merged, the deployed line now has S34–S41; if not,
  anything built here still goes to `ui` and rides the next integration PR.
- Login takes a typed public key + server URL and **there is no private key on `ui`** —
  `grep -rn "privateKey\|sign(" src | head`. If that changed (H1 landed), Phase 3's copy rules
  change with it.
- The verification hub routes are `/identity/verification{,/request,/approve,/invite,/call,/daily}`
  in `src/pages/IdentityView.tsx:69-74`.
- `organizationActor.ts` exists and `/organization` is routed (`src/App.tsx:134`).
- `ThreadedDiscussion` takes a `contractId` prop and does its own reads/writes via
  `discussionApi.ts`; Causes voting lives in `src/utils/causes.ts` — confirm before "mount once".
- `digital_agent_contract.py` `set_profile`/`get_profile` fields: `displayName, photo, country,
  languages` (`src/components/identity/agent/digitalAgentContract.ts:16-21`). `accountKind` is new.
- `DEMO_VERSION` current value in `src/services/demo/mockApi.ts` — bump only if fixtures change.
- fr/sw key counts equal and the parity scanner passes at HEAD:
  `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`.
- No `steward/` or `babysit/` skill exists in `.claude/skills/` (it didn't on 2026-10-23).

## Read first (carry the context)

- `CLAUDE.md`, `DESIGN_SYSTEM.md` (tokens-only, single h1, 44px, `dark` mixin), `docs/FOR_OURI_seam.md`.
- `MASTER_TODO.md` §1–§3 (north stars, mission, design philosophy) and §7 P12 (the baseline:
  no key, no CSP, live contract enforces nothing).
- `docs/superpowers/specs/2026-10-22-sovereignty-security-track-design.md` §H0 (claims audit),
  §H1 (keys), §H2 (recovery) — Phase 3 must be consistent with them.
- `docs/superpowers/plans/2026-10-23-forward-without-a-gate.md` — the premise correction at
  the top of §3 is the beta framing; §4 is the integration PR.
- `docs/superpowers/specs/2026-09-17-production-wot-decisions.md` — G1 is decided; G2–G4 are
  not; the beta's verification is the demo mechanics with honest copy, not production WoT.
- Source of truth for onboarding: `src/components/onboarding/OnboardingFlow.tsx` and
  `steps/*`; for the agent: `src/components/identity/agent/*`.
- Skills: `gloki-change-control` (Rule 1: no push without Eston's go; locked decisions),
  `gloki-session-lifecycle`, `gloki-seam-and-demo-data`, `gloki-i18n-playbook`,
  `gloki-verification-and-qa`, `gloki-docs-and-writing`.

## Workflow + constraints (same discipline as S1–S41)

- Brainstorm the open decisions below with Eston first (recommend-then-confirm), then spec +
  plan as docs commits, then build in small chunks with `npm run build` green per chunk.
- Seam rule: components read/write only through `src/services/api.ts`; a new contract field
  means stub + `FOR_OURI_seam.md` in the same commit. Wire names stay as they are.
- Locked decisions stay locked in **demo mode** (HomeView at `/`, 4-stage IA, brand blue, single
  AppHeader). Beta mode is a new mode, not a relitigation: the doors page is beta's `/`, and the
  demo's `/` is untouched.
- Tokens only, `t()` for every string, fr/sw parity + packet append, 360px/44px/single-h1 gates.
- No deletion of shipped components (gloki-refactor-and-dead-code: deleted things stay
  deleted, but shipped things don't get deleted to "slim down" — they get hidden by mode).
- No push to `origin/ui` without Eston's explicit go. PR #20's ✗ against `main` is expected.
- Subagents: implementers verify via `tsc -b`/build only; the controller drives the one preview.

## Open decisions to lock (Eston's calls)

1. **Where does the beta build deploy?** (a) Same Pages site, mode chosen at build time, so the
   demo disappears from the public URL when beta ships **(recommended — one URL, one story,
   matches "the test version we're deploying")**; (b) a second Pages site/branch for beta,
   demo stays public; (c) beta behind a path prefix on the same site.
2. **On-device key in the beta, or honest copy without one?** (a) Honest copy now, H1 key work
   as its own session after G2 is answered **(recommended — don't build key UX twice)**;
   (b) build H1 inside this session (adds Ed25519 keygen, backup, signing in `src/services/`;
   needs Ouri's server to verify signatures or it protects nothing).
3. **What does "Contribute a node" do before Ouri ships the runtime?** (a) A door that explains
   it and captures interest (an `interestedInHosting` flag on the profile) **(recommended)**;
   (b) hide the door until the Docker image exists; (c) link out to a form.
4. **The one forum's contract.** (a) A single demo `discussion_contract.py` id seeded in beta
   mode, replaced by Ouri's forum contract when it exists **(recommended)**; (b) reuse a demo
   community's discussion; (c) wait for Ouri.
5. **Organisation sign-up: real or declared?** (a) `accountKind: 'organisation'` plus the existing
   organisation home, no verification of org-ness in the beta **(recommended)**; (b) require a
   vouch from a verified person before the org kind is granted.
6. **Does the beta keep fr/sw?** (a) Yes, all three, parity enforced **(recommended — the pilot
   countries need it and the strings are few)**; (b) English only for the beta.

When ready: run the premise checks, then open the brainstorm with the six decisions above in
one message, recommendations marked.
