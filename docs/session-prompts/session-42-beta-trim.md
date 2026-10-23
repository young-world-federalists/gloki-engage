# Session 42 — The beta trim

Branch `ui` (start from `claude/youthful-cerf-ltibol`, which holds this prompt; it is `ui` + docs).
Deployed site is `server-side`; [PR #24](https://github.com/young-world-federalists/gloki-engage/pull/24)
brings S34–S41 onto it.

## The one idea

The test version users see is **not the democracy app**. It is: you sign up, you get a key, people
who know you vouch for you, and you say which of three things you are — a person, an
organisation, or a contributor who hosts a node. There is one shared forum. Nothing else.
(Eston, 2026-10-23; agreed with Ouri by email, 15 Oct: "the beta is the network, not the
pipeline".)

Keep it small. Hide, don't delete. No new mechanics, no cryptography work, no spec document
unless something turns out to be hard.

## Build this

1. **A build flag.** `VITE_APP_MODE=beta` read in one module (`src/appMode.ts`). `npm run
   build:beta`. Default stays demo; `ui` keeps working as it does now.
2. **In beta mode, `/` is a doors page**: two sentences on what Gloki is, three buttons —
   *Join as a person* / *Join as an organisation* / *Contribute a node*. Each goes into the
   existing onboarding (`src/components/onboarding/OnboardingFlow.tsx`) with the choice carried
   along. Contributor has no runtime to point at yet: it explains hosting in a paragraph and
   stores interest.
3. **One new field** on the digital agent profile: `accountKind: 'person' | 'organisation' |
   'contributor'`. Through the seam: demo stub + one entry in `docs/FOR_OURI_seam.md`, same
   commit. Wire names unchanged.
4. **Keys step gets a backup step.** Reuse the existing agent creation. Show the public key,
   make "save your backup" a step. Copy only says what the code does: `ui` has no private
   key today (login is a typed public key), so no "encrypted" or "signed" claims until that
   changes.
5. **Verification hub as is** (`/identity/verification/*`), copy adjusted from "community
   members" to "people who know you" where it appears.
6. **One forum**: mount `ThreadedDiscussion` once at a single seeded demo discussion
   contract, as the beta's second screen. Rename Causes words in beta copy only.
7. **Everything else redirects to `/` in beta mode**: communities, create-community, join,
   currency, initiatives, stage feeds, mandates, organization home. `StageFooter` hidden.
8. fr/sw parity for the new strings (scanner must pass), append the packet.

## Don't

- Don't delete shipped components or routes; the flag hides them.
- Don't touch demo mode's `/` (HomeView), the 4-stage IA, or the brand blue — locked.
- Don't build on-device keys, signing, or the forum contract. Those are Ouri's or later.
- Don't push to `origin/ui` without Eston's explicit go.

## Decisions taken by default (say if you disagree, Eston)

- Beta deploys to the **same Pages URL**, mode chosen at build time. The demo build stays
  available locally.
- **Honest copy now; real keys later** (after Ouri answers whether his server verifies
  signatures).
- "Contribute a node" is a door that **explains and records interest**, nothing more.
- Organisation sign-up is **declared, not verified**, in the beta.
- **fr/sw stay.**

## Check before building (prompts go stale)

- `git log -1 origin/ui` is `2ad0f1d` or later; whether PR #24 has merged.
- No private key on `ui`: `grep -rn "privateKey\|sign(" src | head` returns nothing relevant.
- Profile fields today are `displayName, photo, country, languages`
  (`src/components/identity/agent/digitalAgentContract.ts`).
- `ThreadedDiscussion` takes `contractId` and reads/writes via `discussionApi.ts`.
- `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` passes at HEAD.

## Read first

`CLAUDE.md`, `DESIGN_SYSTEM.md` (tokens only, single h1, 44px, `dark` mixin),
`docs/FOR_OURI_seam.md`, the onboarding and agent code under `src/components/onboarding/` and
`src/components/identity/agent/`. Skills: `gloki-change-control`, `gloki-seam-and-demo-data`,
`gloki-i18n-playbook`, `gloki-verification-and-qa`.

## Done when

`npm run build:beta` and `npm run build` are both green, and a preview walk at 360px (light and
dark) goes arrive → door → keys + backup → account kind → verification hub → forum post with no
console errors. Screenshots in `docs/reviews/`. Then stop and show Eston.

Start with the checks above, then build item 1.
