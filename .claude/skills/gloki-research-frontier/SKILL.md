---
name: gloki-research-frontier
description: Use when scoping ambitious, research-grade, or "what's next" work in Communities2/Gloki — the P5 tail or P6 roadmap items, offline/last-view cache, content translation of user-generated text, Chichewa (ny.ts) or new locales, WhatsApp summary sharing, mandate outcome measurement / impact evidence / attestation, liquid delegation (D3) — or when asked "what could be state-of-the-art here", "what open problems does this project touch", or a session prompt cites frontier/deferred items.
---

# Gloki Research Frontier

## Overview

This skill maps where this project could genuinely advance the state of the art, and how to
start each item **inside this repo without breaking its discipline**.

**Core principle: frontier work is ambition routed through change control.** Nothing on this
page is committed roadmap. Every item below is labeled **open** or **candidate**, and every one
starts the same way: a recommend-then-confirm proposal to Eston (the founder — he gates every
push and owns every product decision), never unilateral scope. If an item conflicts with a
locked decision (1p1v, the trust model, brand blue, the 4-stage browse IA), the locked decision
wins — see `gloki-change-control`.

**The acceptance frame is the two north stars** (MASTER_TODO.md §1, judged in this order):

1. **Usability first** — a young person on a cheap ~360px Android with intermittent data and
   English as a third language completes the journey unaided (platform KPI: ≥70% unaided
   completion).
2. **A felt sense of transnational collaboration** — someone in Nairobi and someone in Lilongwe
   feel they are building something together.

**Eston's two chosen ambition axes (confirmed 2026-07-02):**

- **(a) Low-bandwidth civic UX** — best-in-class democracy UX on a cheap 360px Android in
  low-connectivity, multilingual contexts. (Frontier items 1–4 below.)
- **(b) Measurable democratic outcomes** — mandate/indicator tracking rigorous enough to
  evidence real-world impact. (Frontier item 5.)

Items 6–7 are secondary: a candidate mechanism and an existing asset, respectively.

## Constraints that shape ALL frontier work

Jargon, defined once:

- **The seam** — every component reads/writes only through `src/services/api.ts`
  (`contractRead`/`contractWrite`/`deployContract`/`joinContract`), currently backed by the
  **stub layer** `src/services/demo/` (mock contracts + fixtures). No component ever calls a
  real server.
- **Wire names** — contract method/field names must byte-match Ouri's real Python contracts
  (`add_proposal`, `proposal_id`); UI words like "solution"/"mandate" are presentation only.
- **FOR_OURI entry** — `docs/FOR_OURI_seam.md` is the single source of truth handed to Ouri
  (the backend partner); any new contract method the UI relies on gets an entry there.
- **DEMO_VERSION** — seed version string in `src/services/demo/mockApi.ts` (`global-v16` at
  HEAD); bump only when fixtures/seed change.

| Constraint | Consequence for frontier work |
|---|---|
| `ui` branch = stub layer only | Anything backend-adjacent (real translation, real measurements, real attestations, delegation writes) is delivered as **seam design + FOR_OURI entry + demo stub**, never a server |
| Contracts immutable after deploy | New contract methods can't reach already-deployed communities — design additively, readers tolerate absent fields |
| Push to `ui` = production deploy | Never push without Eston's explicit green light; never touch `main` (ui→main lands via Ouri) |
| Product decisions are Eston's | Locked decisions never relitigated; new choices go recommend-then-confirm (batched decision gates in a brainstorm) |
| No test framework | Milestones below are preview-verifiable claims, not test suites — see `gloki-verification-and-qa` |
| Slow external USB drive, shared preview | Small sequential I/O; subagents build-verify only, controller drives the one preview browser |
| Demo honesty | Seeded data must never imply real-world data it isn't ("claimed vs verified" pattern); no trust-faking |

---

## Axis (a): Low-bandwidth civic UX

Why this axis: mainstream civic-tech platforms (Decidim, CONSUL, Pol.is) assume solid
connectivity, desktop-ish screens, and majority languages. Gloki's pilot personas (MASTER_TODO
§5) — Thandiwe (Malawi, first smartphone, Chichewa-first, WhatsApp-native, intermittent data)
and Pascal (DRC, French-first, very low bandwidth) — are exactly the users those platforms
fail. The project's standing assets: a strict 360px flagship target (DESIGN_SYSTEM), a shipped
data-saver/offline kit, full fr/sw locales, and localized country names via `Intl.DisplayNames`.

### 1. Offline last-view cache — OPEN (deferred P5 tail)

**Status at HEAD (verified 2026-07-02):** S14 shipped the "offline anchor": the once-orphaned
Lane-F **connectivity kit** at `src/components/shared/connectivity/` (`SmartImage` data-saver
placeholder at 4 avatar sites, `DataSaverToggle` in Profile, `useOnline` hook, global
`OfflineBanner` mounted in the App shell; `SyncBadge`/`ChannelBadge` still orphaned in the
`/lab/presence` dev route, `src/App.tsx:124`). The **last-view cache itself does not exist** —
`grep -rn "lastView" src` returns nothing. MASTER_TODO.md:236–238 lists it as deferred.

**Hard design constraint (S14 decision, do not reverse without a new product decision): NO
service worker / PWA.** Rationale recorded in MASTER_TODO §8 (2026-07-01): a SW means owning
cache-invalidation against the GitHub-Pages basename + `404.html` SPA shim + DEMO_VERSION
reseed. The chosen path is **lighter, in-app**.

**Why current SOTA fails:** offline-first civic UX is done via SW/PWA or native apps — both
heavy, both wrong for this deploy shape. Nobody has a good answer for "the connection dropped
mid-deliberation" that is just application-layer state.

**This project's asset:** `useOnline` + `OfflineBanner` already shipped; localStorage
persistence patterns already exist (`flowContractsSlice`, `preferencesSlice`); the mandate and
initiative read models are small, serializable derivations.

**Honest scope boundary (state it in any proposal):** without a SW, a **cold reload while
offline cannot load the app shell at all** — the last-view cache covers in-session connection
loss and revisits where the shell loads from HTTP cache. That boundary is the research finding,
not a bug.

**First three steps in this repo:**
1. Re-verify assets: `ls "src/components/shared/connectivity"` and
   `grep -rln "useOnline\|OfflineBanner" src | grep -v connectivity` (expect `src/App.tsx`).
2. Write a one-page design note in `docs/superpowers/specs/YYYY-MM-DD-last-view-cache-design.md`:
   what to cache (highest value: the `useMandate` read model and the expanded initiative stage
   view), keying (route or `initiativeId`), staleness display, interaction with DEMO_VERSION
   reseed, the cold-start boundary above. Recommend-then-confirm with Eston.
3. If confirmed, prototype the smallest slice: persist the `useMandate` output per
   `initiativeId` to localStorage; when `useOnline` is false and the live read fails, render
   the cached copy with a visible "last synced <time>" state (extend `OfflineBanner` tone, all
   strings through `t()`).

**You have a result when:** in a running preview session, forcing offline (override the
`navigator.onLine` getter — `dispatchEvent(new Event('offline'))` does NOT flip it, S14 lore;
the override resets on reload), then navigating away from and back to a previously-visited
mandate renders the full document from cache with a visible "last synced" marker at 360px,
while a never-visited route shows an honest empty state — and `tsc -b` stays clean.

### 2. Content-translation strategy for user-generated content — OPEN (decision doc FIRST, needs Ouri)

**Status at HEAD (verified):** UI chrome is fully localized (fr/sw at full 1113-key parity per the checked-in scanner — see gloki-i18n-playbook), but
**content** — problem titles, comments, solutions, mandate body — is English fixture text in
every locale. MASTER_TODO.md:244–246 marks this `[MAJOR, coordinate w/ backend]`: "decide
per-card translation vs a 'traduire' affordance. Backend-adjacent → coordinate with Ouri.
Still open." **This item is a decision document, not a build.**

**Why current SOTA fails:** platforms either machine-translate UGC silently (destroying
provenance — fatal in a civic context where "what did the author actually say" is
trust-critical) or don't translate UGC at all (excluding non-English deliberators). Visible,
opt-in translation with provenance labeling across a 3+ language deliberation is unsolved in
deployed civic tech.

**This project's asset:** the seam makes the translation surface exactly enumerable (every
content string arrives via `contractRead`), and the pilot personas give concrete acceptance
(Pascal reads a Nairobi-authored solution in French and can see it's a translation).

**First three steps in this repo:**
1. Inventory content-bearing fields: read `src/services/demo/fixtures/` file list and the
   demo contract handlers (`src/services/demo/demoContracts/`) to enumerate which contract
   fields carry human prose (proposal `text`/`commitments`, comments, mandate articles).
2. Write the decision doc in `docs/superpowers/specs/` comparing options: (a) per-card
   "translate" affordance calling a future contract/server method, (b) authors submit
   multilingual variants, (c) pre-translated demo fixtures only (demo theater — label it as
   such). Cover provenance labeling ("machine-translated from English"), offline interaction
   (item 1), and which fields. Recommend-then-confirm with Eston; he coordinates with Ouri.
3. Only if a direction is confirmed: spec the seam shape as a `docs/FOR_OURI_seam.md` entry
   (method name and fields designed to match what Ouri will really build — wire names are his
   call), plus a permissive demo stub. No component ever calls a translation API directly.

**You have a result when:** a dated spec exists in `docs/superpowers/specs/` with an
Eston-confirmed option and either a corresponding FOR_OURI_seam.md entry or a recorded
deferral rationale. Any code before that point is scope creep.

### 3. Chichewa `ny.ts` + scaling the locale model — OPEN (P5 tail, MAJOR/large)

**Status at HEAD (verified):** `src/i18n/` contains `en.ts` (partial override), `fr.ts` and
`sw.ts` (full overlays, **1113 keys each** per the authoritative checked-in scanner
`.claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs`; the naive `grep -c` one-liner
undercounts to 1112 and MASTER_TODO's "≈1109" is a stale estimate), `types.ts` (the `Locale`
union), `index.tsx` (DICTS + LOCALES for the LanguageSwitcher). No `ny.ts` exists.
MASTER_TODO.md:241–243 keeps it open.

**Why current SOTA fails:** civic platforms rarely ship African languages beyond Swahili;
Chichewa UI support is effectively nonexistent, yet it is the first language of the Thandiwe
persona (Malawi). The deeper research question is the **scaling model**: full 1112-key overlays
per locale, each requiring human native review (a permanently human-gated backlog), does not
scale to locale #4–#10. Fallback chains / partial overlays / coverage tiers are the open design
space.

**This project's asset:** proven parity tooling (position-agnostic set diff:
`grep -oE "^ *'[^']+':" file | sort -u` + `comm` — never `sed \s` on macOS), the append-only
native-review packet (`docs/i18n-native-review-candidates.md`), and a lookup that already
falls back locale → English → inline default → key.

**First three steps in this repo:**
1. Read the sibling `gloki-i18n-playbook` (the ritual and tooling live there — do not
   duplicate); re-verify key counts at HEAD with the grep above.
2. Recommend-then-confirm with Eston: ship a full-parity `ny.ts` now, or first decide the
   scaling model (e.g., allow partial overlays that lean on the existing English fallback,
   with a visible per-locale coverage figure). The scaling decision is the frontier; the file
   is mechanical.
3. If confirmed: generate `ny.ts` from the `sw.ts` key set, extend the `Locale` union in
   `src/i18n/types.ts`, register in `DICTS` + `LOCALES` in `src/i18n/index.tsx`, and mark the
   entire overlay in the native-review packet as machine-draft pending human review.

**You have a result when:** the parity check shows identical key sets for fr/sw/ny, the
LanguageSwitcher offers Chichewa, a 360px walk of the main routes in `ny` shows zero raw-key
leaks, and the review packet honestly labels the overlay unreviewed. (Native review itself
stays human-gated — never claim it done.)

### 4. WhatsApp summary channel — OPEN candidate (deferred P5 tail)

**Status at HEAD (verified):** MASTER_TODO.md:236–237 defers a "WhatsApp-shareable summary
extension (mandate already has S11's share)". Prior art exists: `MandateCard.tsx` has a
`share()` using `navigator.share` with a clean, pubkey-free URL (lines ~47–60), and a
`ChannelBadge` with a `whatsapp` channel sits **orphaned** in the connectivity kit, rendered
only by the `/lab/presence` showcase. Check orphaned prior art before greenfielding — see
`gloki-refactor-and-dead-code`.

**Why current SOTA fails:** civic platforms treat the app as the entire surface; in
low-connectivity contexts, distribution actually happens in WhatsApp groups. A mandate that
cannot travel as a compact plain-text message does not reach the people it claims to represent.

**This project's asset:** `MandateDocument.tsx` already builds a machine-readable spec
projection (`buildSpec`) — the summary is a second, human-readable projection of the same read
model. No new data needed.

**Scope guard:** this is a **share-text generator**, pure UI. A WhatsApp Business API bot or
SMS/USSD bridge is backend/Wave-2 territory (MASTER_TODO §6 discipline) — do not propose it as
a build.

**First three steps in this repo:**
1. Read the prior art: `MandateCard.tsx` `share()`, `MandateDocument.tsx` `buildSpec`, and
   `src/components/shared/connectivity/ChannelBadge.tsx`.
2. Recommend-then-confirm scope with Eston: a "Share summary" affordance producing a <1KB
   plain-text digest — title, provenance/turnout line ("X of N eligible voted"), top mandate
   articles, the clean link.
3. Implement as an extension of the existing share path: `navigator.share({ text })` with a
   clipboard fallback, every string through `t()` with fr/sw parity.

**You have a result when:** on a 360px preview, the affordance yields a plain-text digest under
~1KB that survives a clipboard round-trip, includes the turnout denominator and clean link, and
reads correctly in en/fr/sw.

---

## Axis (b): Measurable democratic outcomes

### 5. Mandate outcome measurement rigor — substrate SHIPPED, rigor gaps OPEN

**Status at HEAD (verified):** S13/P4 shipped the substrate most platforms lack — the **spine**
(author `commitments` → expert `metrics` → mandate articles/indicators): `MandateIndicator`
carries `target`/`baseline`/`cadence` entered via the host/expert-gated `RatificationPanel`
(`src/components/mandate/RatificationPanel.tsx`); `isMandateRatified`
(`src/services/demo/fixtures/mandate.ts:129`) flips status only when every indicator is
complete; the document prints a turnout denominator and a Sybil/verification statement;
`MandateAdopter.verified` distinguishes claimed vs verified adopters (viewer endorsements are
always `verified:false`); subscribers report `progress` (0..1) + `progressNote`; everything
projects into `spec.json`.

**What rigor is still missing (the frontier — all open):**

| Gap | Evidence at HEAD |
|---|---|
| Baselines are unsourced free text | `RatificationPanel.tsx` fields are `type="text"` maxLength 120 — no evidence link, though the S12 `SourcesInput`/`SourceLinks` primitives exist for reuse |
| Cadence is declared, never enforced | Free text ("Quarterly"); nothing records whether a measurement actually happened on schedule |
| No measurement history | `progress` is a single overwrite — no dated time series, so trajectory (the actual evidence of impact) is unrepresentable |
| Attestation model undefined | `verified:true` is seed-only, and adopter attestation is NOT yet covered anywhere in FOR_OURI_seam.md (itself a doc gap to close when touching it — see gloki-docs-and-writing); a real attestation is backend work per project memory — who attests, on what evidence, with what revocation, is undesigned |
| Label-as-join-key fragility | Ratification data merges onto indicators **by label** (`useMandate.ts:~129–135`) — renaming a metric silently orphans its target/baseline/cadence |

**Why current SOTA fails:** participatory platforms track proposal → implementation *status*,
not indicator-grade measurement; deliberation research measures process quality, not outcomes;
published "mandates" almost never carry falsifiable KPIs with sourced baselines. A civic
artifact whose `spec.json` lets an external evaluator independently check every claim would be
genuinely novel.

**This project's asset:** the spine already flows end-to-end and is machine-readable; the
claims-honesty discipline (P0) means the UI already refuses to imply data it doesn't have.

**First three steps in this repo:**
1. Re-verify the substrate:
   `grep -n "isMandateRatified\|verified" src/services/demo/fixtures/mandate.ts` and
   `grep -n "baseline\|cadence" src/hooks/useMandate.ts src/components/mandate/RatificationPanel.tsx`.
2. Write a "measurement rigor" design note in `docs/superpowers/specs/`: (a) sourced baselines
   by reusing `SourcesInput` in the RatificationPanel; (b) a dated measurement-record model per
   indicator (append, not overwrite) — real records are backend, so this is a seam design +
   FOR_OURI entry + demo stub; (c) an attestation-model sketch for adopter verification
   (attestor identity, evidence, revocation); (d) stabilizing the indicator join key.
   Recommend-then-confirm with Eston.
3. Cheapest honest UI increment (if confirmed): render measurement-history / "no measurements
   recorded yet" states in `AdoptionFramework.tsx` and `MandateDocument.tsx`, and add the
   baseline-source field — so the artifact's rigor is visible before any backend exists.

**You have a result when:** a seeded demo mandate renders at least one indicator with a sourced
baseline and a dated measurement history, `spec.json` distinguishes attested from claimed
measurements, and — the publishable-evidence bar — the spec contains everything an external
evaluator needs to independently verify one impact claim (indicator, baseline + source, target,
cadence, dated measurements, attestor). Labeled open research until an actual pilot produces
real (non-seeded) records, which is backend/Ouri territory.

---

## Secondary items

### 6. Liquid delegation (D3) — OPEN candidate, P6, secondary to the chosen axes

**Status at HEAD (verified):** thinner than documented. MASTER_TODO.md:262 says "only a fixture
stub today"; at HEAD even that overstates it — the only delegation reference in `src/` is a
placeholder comment, `src/services/demo/fixtures/mechanisms.ts:6` ("Lane D extends this file
with delegation sample data"). **No delegation code, types, or fixtures exist.** It is the one
named-but-missing mechanism of MASTER_TODO §3's three transferable mechanisms (QV ✓,
conviction ✓, delegation ✗: "revocable, time-limited, capped, transparent delegate records").

**Why current SOTA fails:** deployed liquid democracy (LiquidFeedback et al.) concentrates
power in super-voters; the §3 countermeasures (caps + expiry + revocability + public delegate
records) are named in the literature but rarely shipped together.

**Hard constraints:** 1p1v is a **locked** decision — delegation may transfer a vote within a
cap, never weight influence; the mechanism design goes through `gloki-governance-domain` and
change control, and wire names get designed with Ouri via FOR_OURI_seam.md before any stub.

**First three steps (only after Eston green-lights P6 work):**
1. Read MASTER_TODO §3's delegation line and check prior thinking in
   `docs/session-prompts/wave-1.5/`.
2. Brainstorm the mechanism with Eston (recommend-then-confirm): scope (per-stage vs
   per-initiative), cap, expiry, revocation, composition with QV credit budgets.
3. Fixture-first: extend `mechanisms.ts` with seeded delegate records + a **read-only**
   "delegate records" transparency view — make the mechanism explainable before it is operable
   (the pattern QV's `VoteExplainer` set).

**You have a result when:** a read-only transparency surface renders seeded delegate records
(who → whom, scope, expiry, cap) at 360px in en/fr/sw. Everything past that is undesigned.

### 7. Trust / web-of-trust + nomination graph — ASSET, not current ambition

**Status at HEAD (verified):** the real `src/assets/contracts/community_contract.py` implements
an edge-rewiring nomination graph (`request_join`:76, `approve`:109, `disapprove`:133): at ≥5
members, joining requires mutual approval among 4 members drawn from two random disjoint trust
edges, after which the graph rewires — keeping it ~4-regular so every join costs 4 real
relationships. Layered above it: the UI vouch web-of-trust (4 QR vouches = verified) and the
adopter attestation flag. Three unrelated layers share the word "verified" —
`gloki-governance-domain` owns disambiguating them.

A biometrics-free, contract-level Sybil defense is research-notable, but Eston's ambition axes
do not point here and the trust model is a **locked** product decision. Do not propose changes.
Use it as the foundation the other items cite — e.g., item 5's verification statement and any
future attestation model inherit their Sybil story from this layer.

---

## When NOT to use this skill

| Situation | Use instead |
|---|---|
| Running a normal work session (prompt → build → push gate) | `gloki-session-lifecycle` |
| Deciding whether a change is allowed / gated / locked | `gloki-change-control` |
| Actually adding a locale, string, or parity check | `gloki-i18n-playbook` |
| Adding contract methods, stubs, fixtures, DEMO_VERSION mechanics | `gloki-seam-and-demo-data` / `gloki-python-contracts` |
| QV math, turnout, ratification, trust-layer semantics | `gloki-governance-domain` |
| Verifying a built increment (preview lore, evidence bar) | `gloki-verification-and-qa` |
| Checking whether something was already built/deleted before proposing it | `gloki-failure-archaeology` / `gloki-refactor-and-dead-code` |
| Writing the spec/decision docs these items call for | `gloki-docs-and-writing` |
| Env, build, deploy, slow-drive mechanics | `gloki-build-env-run` |

## Provenance and maintenance

Verified 2026-07-02 at commit `c26cdc4` (branch `ui`), against MASTER_TODO.md §1/§3/§5/§6/§7
and targeted greps. Incident detail behind the S11/S13/S14/S15 references is recorded in
project memory (2026-07); ambition axes and unwritten rules confirmed by Eston 2026-07-02.
Volatile facts and how to re-check them:

| Fact (as of 2026-07-02) | Re-verify with |
|---|---|
| P5 tail + P6 still open; P0–P5.5 done | Read `MASTER_TODO.md` §7 (lines ~232–272) |
| No last-view cache exists | `grep -rn "lastView" src --include='*.ts*'` (expect 0 hits) |
| Connectivity kit contents / SyncBadge+ChannelBadge orphaned outside `/lab/presence` | `ls src/components/shared/connectivity`; `grep -rln "SyncBadge\|ChannelBadge" src` |
| fr/sw = 1113 keys, no `ny.ts` | `ls src/i18n`; `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` (the `grep -c` one-liner undercounts by 1 — two entries share a line) |
| Delegation = one comment, no code | `grep -rni "delegat" src --include='*.ts*'` (expect only `mechanisms.ts:6`) |
| Mandate substrate fields (target/baseline/cadence, claimed-vs-verified) | `grep -n "isMandateRatified\|verified:" src/services/demo/fixtures/mandate.ts` |
| Mandate share prior art | `grep -n "navigator.share" src/components/mandate/MandateCard.tsx` |
| Nomination-graph methods | `grep -n "def request_join\|def approve" src/assets/contracts/community_contract.py` |
| DEMO_VERSION current value | `grep -n "DEMO_VERSION" src/services/demo/mockApi.ts` |
| No-service-worker decision still standing | MASTER_TODO.md §8 entry dated 2026-07-01 (S14) |

If any row has drifted, trust HEAD over this page and update this file in the same session.
