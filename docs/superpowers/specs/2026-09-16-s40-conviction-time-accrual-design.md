# S40 — Conviction strength that accrues with time

Date: 2026-09-16. Implementation base: `ui` at `b7bc7f1`.

Parent context: [S33 conviction and mandate design](2026-08-05-s33-conviction-author-org-design.md),
[S40 roadmap prompt](../../session-prompts/session-40-next-roadmap.md), and the conviction seam in
[FOR_OURI](../../FOR_OURI_seam.md#conviction--backing-democontractsconvictionts--documented-s33).

## Authorization and scope

Eston selected conviction time accrual as Session 40's next roadmap slice on 2026-09-16. He then
approved the mechanism rules and this full design in two explicit gates. This is a governance-results
change, not interface polish: the contract's reported strength, country totals, community totals and
the UI's explanation all change together.

The session makes the existing promise true: conviction starts modestly and becomes stronger only
while backing is actually held. It preserves one-person-one-commitment, the five existing duration
choices, both existing mandate surfaces, and every existing contract method name. It does not add a
new route, currency, transferable stake, background scheduler, notification, or contract method.

## Re-grounded premises

The roadmap prompt was checked against local and live remote state before the slice was selected:

- local `ui`, `origin/ui` and HEAD are `b7bc7f1`; `origin/server-side` remains `a81218f`;
- the working tree contains only the user's pre-existing untracked `.agents/` directory;
- S39's nested notification centre, seven owner-scoped event types, deterministic ids, translation
  parity and `global-v19` demo baseline still pass their static gates;
- scheduling remains incapable of honest future matching or delivery after tab closure;
- the direct-only collaboration route is not production-ready: its cross-initiative writes are
  incomplete in the demo and insufficiently authorized in the real initiative contract;
- the most coherent live product gap is conviction: UI copy says support builds over time, but the
  demo and real contract award `amount × duration multiplier` immediately; and
- `stake` accepts any positive `amount` even though the UI sends `1`, so direct callers can violate
  the intended one-person-one-commitment weight unless the calculation and write both enforce it.

The current duration caps are retained: `1w → 1`, `1m → 2`, `3m → 4`, `6m → 7`, `1y → 12`.
The timestamp currently controls display and update policy only; it does not affect weight.

## Locked product behavior

### Accrual formula

Every valid backing begins at strength `1`. It gains one strength point per 30 elapsed days and is
capped by the selected duration:

```text
elapsedDays = max(0, elapsed(timestamp, now) in days)
strength = min(durationCap, 1 + elapsedDays / 30)
```

The value is continuous rather than a monthly step. Reads return the unrounded numeric value; the UI
formats it to one decimal place. Consequences are deliberate:

| Commitment | Starts at | Reaches cap |
|---|---:|---:|
| 1 week | 1 | immediately; it never exceeds 1 |
| 1 month | 1 | 30 days |
| 3 months | 1 | 90 days |
| 6 months | 1 | 180 days |
| 1 year | 1 | 330 days; it remains 12 for the final month |

This fixed-rate model was chosen over full-horizon interpolation because lengthening a commitment
must never reduce earned strength. It was chosen over monthly milestones because cliffs invite
timing games and make a continuous civic commitment feel arbitrary.

Malformed or future timestamps receive baseline strength `1`; elapsed time is never negative.
Unknown stored durations also degrade to cap `1` for reads rather than crashing an aggregate. New
writes still reject unknown durations.

### One person, one commitment

`amount` remains in the `stake` wire payload and stored record for compatibility, but it no longer
participates in strength. Both the demo and real contract reject a new stake unless `amount == 1`.
All reads calculate one duration-and-time score per caller regardless of a malformed historical
amount. This closes the direct-caller loophole and preserves the locked 1p1v principle: time may
strengthen one person's backing, money and repeat calls may not.

A second `stake` from the same caller remains rejected. Changes continue through `update_stake`.

### Changing and withdrawing

- Lengthening preserves the original timestamp. The fixed one-point-per-30-days rate means earned
  strength never falls; only the cap moves outward.
- Choosing the same duration preserves the timestamp.
- Shortening resets the timestamp to now and current strength to `1`. A long record cannot be
  harvested and then carried into a smaller commitment.
- Withdrawal deletes the stake and removes all of its current strength immediately. This session
  does not create a separate historical/audit record.

## Contract and seam design

### Pure TypeScript model

A pure service model owns:

- the five accepted duration values and caps;
- `ACCRUAL_PERIOD_MS = 30 days` for the browser demo;
- the `time_accrual_v1` model identifier;
- stake/read-result types; and
- a total, side-effect-free `strengthForStake(stake, now)` helper implementing the rules above.

The demo contract, fixture generator and React presentation import the shared constants instead of
maintaining three independent multiplier maps. The React component does not calculate authoritative
weight: it renders the derived value returned by the contract read.

### Existing read methods, richer results

No method name or argument changes.

- `get_my_stake` returns the stored stake fields plus derived `weight` when the contract supports
  accrual. `weight` is computed at read time and is never persisted.
- `get_stakes` remains a map of stored stake records. It does not need derived weights for Session 40.
- `get_total_conviction` returns `{ total, count, model: 'time_accrual_v1' }`. `total` is the sum of
  current derived weights; `count` remains the number of distinct backers.
- `get_conviction_by_country` preserves its `{ [country]: number }` shape and sums current derived
  weights.

`weight` and `model` are additive fields on existing read responses. They do not create a new wire
method and old readers can ignore them.

### Python handoff

The `ui` branch does not replace Ouri's deployed contract. It supplies a focused patch document for
the conviction section of `src/assets/contracts/gloki_engage_initiative_contract.py` on
`server-side`. The patch:

- uses the injected `elapsed_time(stake['timestamp'], timestamp())` primitive;
- uses no imports and no `Document.get(key, default)` calls;
- adds only private calculation helpers and changes existing method bodies/results;
- requires `amount == 1` in `stake`;
- calculates totals without multiplying by stored amount; and
- fixes no unrelated initiative-contract behavior.

Contracts are immutable after deployment. Applying the source patch changes only newly deployed
initiative contracts. Existing deployed contracts continue returning the S33 instant-cap result.

### Legacy-contract honesty

The optional `model` field on `get_total_conviction` is the compatibility signal:

- `model === 'time_accrual_v1'`: show the accrual explanation and current/cap progress;
- field absent or unknown: treat the contract as legacy, retain usable controls and aggregates, and
  state that this community uses the earlier instant-strength model.

The UI must not derive a new score client-side for a legacy contract. Doing so would make the
personal number disagree with the contract's total and country breakdown. The legacy branch uses the
contract's existing instant-cap semantics and does not display a false accrual meter.

## Interface behavior

`ConvictionStaking` remains the single component mounted by both `MandateStage` and
`MandateBacking`, using the same `instanceId` / parent contract / stage key. A backing made from one
surface must still appear on the other.

### Before backing or while editing

- The introduction states that every backing begins at 1 and earns one point per 30 days.
- Each existing duration remains one radio-style choice. The selected choice exposes its maximum
  strength; it does not imply that the cap is awarded immediately.
- The meter represents the selected maximum, clearly labelled as a cap rather than current strength.
- The existing one-backing and change/withdraw explanation remains, updated for accrual.

In legacy mode, the explanation instead states that the selected duration's strength applies
immediately. The controls still match what that immutable contract will actually do.

### Existing commitment

For an accrual contract, the summary shows:

- selected duration;
- current strength to one decimal place;
- maximum strength;
- a progress meter based on `current / cap`;
- the existing localized “Backing since” date; and
- the caller's current share of community strength, calculated from the returned `weight` and
  contract total.

The meter has a text equivalent; its meaning never relies on fill length or colour alone. A one-week
commitment renders as complete at `1 of 1` without suggesting further growth.

The community total and each country value use locale-aware one-decimal formatting. Backer count
remains an integer. Existing country names and flags remain locale-aware through the shared country
component.

### Refresh lifecycle

Because strength changes with the clock even when nobody writes:

- fetch on mount/readiness as today;
- refetch after `stake`, `update_stake` and `withdraw_stake` as today;
- refetch when the document returns to visible; and
- refetch every 15 minutes while the component is mounted and visible.

The interval is for eventual freshness, not animation. It is cleared on unmount, suspended while the
document is hidden, and never writes contract state. A failed refresh retains the last good render
and logs the existing diagnostic; setup/write failures retain their current visible error paths.

## Demo fixtures and versioning

The existing fixture gives every seeded stake an age between zero and seven days, which would leave
nearly every new score at baseline and make the feature impossible to evaluate. Session 40 changes
the seed ages deterministically:

- `1w`: any non-future age; score is always 1;
- `1m`: age sampled from 0–30 days;
- `3m`: age sampled from 0–90 days;
- `6m`: age sampled from 0–180 days; and
- `1y`: age sampled from 0–330 days.

The existing seeded duration and country distribution remains. Only timestamps change. This is a
real fixture change, so `DEMO_VERSION` advances from `global-v19` to `global-v20`; the resulting
one-time demo reset is intentional and recorded in the changelog and handoff.

## Accessibility, i18n and visual constraints

- No new route or page h1; both existing surfaces retain their current header ownership.
- Current/cap text is always visible and is the accessible equivalent of the meter.
- Duration controls retain radio semantics, 44×44px minimum targets, visible focus and disabled
  behavior during writes.
- No live region announces clock-driven fractional changes. User-triggered writes keep their current
  feedback behavior.
- Styles use existing tokens and the current conviction component structure; no raw colors, ad-hoc
  media queries or unrelated redesign.
- Every changed or new user-facing string has an inline English fallback plus matching French and
  Swahili overlay keys. All changed fr/sw strings are appended to the Session 40 native-review
  packet; human native review remains coordination work, not something claimed locally.

## Files in scope

Expected implementation scope, subject to the detailed plan:

- `src/services/convictionModel.ts` — pure constants, types and formula;
- `src/services/demo/demoContracts/conviction.ts` — authoritative demo reads/writes;
- `src/services/demo/fixtures/mechanisms.ts` — deterministic mature seed timestamps;
- `src/services/demo/mockApi.ts` — `global-v20` reset;
- `src/components/collaboration/flows/voting/convictionApi.ts` — typed read results;
- `src/components/collaboration/flows/voting/ConvictionStaking.tsx` and its module stylesheet —
  modern/legacy presentation and refresh lifecycle;
- `src/i18n/{fr,sw}.ts` — parity overlays;
- `docs/contracts/s40-conviction-accrual.py` — Ouri-facing source patch;
- `docs/FOR_OURI_seam.md` — changed semantics and immutable legacy note; and
- `docs/i18n-native-review-candidates.md` — Session 40 packet entry.

Files outside this focused path are out of scope. In particular, do not alter notification,
verification, QV, approval, collaboration-route, scheduling, or mandate-provenance behavior.

## Acceptance and evidence

Implementation is complete only when all of the following hold:

1. The formula returns baseline 1 for a new, future-dated or malformed-timestamp stake; proportional
   values midway through each period; and the exact selected cap after maturity.
2. Lengthening preserves timestamp and never lowers strength; shortening resets timestamp and
   strength; withdrawal removes the caller from count, total and country aggregation.
3. A stake amount other than exactly 1 is rejected, and malformed stored amounts cannot inflate any
   read result.
4. Personal weight, community total and country totals agree at the same read time to display
   precision.
5. `time_accrual_v1` contracts show current/cap progress; missing/unknown model markers show the
   truthful legacy branch without client-derived accrual.
6. The same backing and totals render on the community stage and published mandate surfaces.
7. Fixture ages visibly exercise baseline, partial and mature scores after the intentional
   `global-v20` reset.
8. Refresh-after-write, visibility return and the visible-only 15-minute interval work without
   leaking timers or producing writes.
9. English, French and Swahili hold at 360px in light and dark mode; keyboard order, focus, radio
   semantics, text-equivalent meter, one-h1 rule and 44px targets pass.
10. Typecheck, local build, production build, grep gates, i18n key/token parity, targeted seam/wire
    greps and `git diff --check` pass.
11. A whole-session review is resolved before the push gate. The local multi-model panel and any
    push still require separate explicit authorization.

## Explicit non-goals

- No compounding, decay, transferable balance, token budget or wealth weighting.
- No hidden penalty beyond the approved shortening reset.
- No retained withdrawal history.
- No new contract method, route, scheduler, notification or background worker.
- No migration claim for already-deployed immutable contracts.
- No implementation of the deferred scheduling, collaboration-route, delegation, locale or offline
  roadmap items.
