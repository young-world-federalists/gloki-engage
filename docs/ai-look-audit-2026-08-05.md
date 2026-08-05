# "It looks AI-generated" — audit and findings

**Date:** 2026-08-05 (S33 / P9 W4) · **Branch:** `ui` · **Base:** `751c63a`
**Trigger:** Eston is getting feedback that the app "looks very vibe-coded / AI".

Method: three independent web research sweeps (visual tells of AI-generated UIs; positive markers
of hand-crafted design; how civic products earn institutional credibility), then an audit of those
findings against a factual visual inventory of this codebase (tokens, radius/shadow distributions,
icon tallies, layout, type scale — gathered by a read-only mapping pass over 230 stylesheets).

> ⚠️ The research came from public web sources via subagents. Treat the *tells* as informed
> opinion, not law. Everything asserted below **about this codebase** was verified directly.

---

## 1. The honest headline

**The app does not look AI-generated in the way the loudest tells describe.** It avoids most of
the classic giveaways outright:

| Classic tell | Gloki |
|---|---|
| Indigo→violet gradient brand | ❌ not present — `$primary` is a blue, and there is no gradient hero |
| Blurred gradient orbs / radial glow | ❌ none |
| Glassmorphism as decoration | ❌ none |
| Emoji standing in for icons | ❌ none — the only emoji are **country flags**, which are real data |
| Gradient text headings | ❌ none |
| Fabricated social proof / fake testimonials | ❌ none |
| Canned landing skeleton (hero → 3 feature cards → pricing → CTA) | ❌ the IA is a governance pipeline, not a marketing page |
| Only the happy path exists | ❌ real empty, loading, error and blocked states throughout |
| Decorative motion | ❌ motion is minimal and state-tied |

That matters, because it means the complaint is probably **not** about clichés — it is about
*undifferentiation*. Nothing here is wrong; very little is **chosen**. The findings below are
ranked by how much they contribute to that.

---

## 2. Findings, ranked

### F1 — There is no typeface. (highest impact) ✅ **RESOLVED — see §4**

**Verified:** grepping `@font-face|fonts.googleapis|fonts.gstatic|\.woff|\.ttf|\.otf` across
`src`, `index.html`, `public`, and `package.json` returns **0 hits**. `index.html` has no font
link and no preload. Body renders in the raw system stack
(`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', …`, `src/styles/index.scss:55-57`), and
a Vite scaffold remnant still sets a second stack on `:root` (`:10`).

One system font does **every** job — display, body, UI labels, and numerals. Across the research,
"one default typeface doing every job" is the second-most-cited tell after purple gradients, and
it is the one that best explains "looks generic" in an app that has no other clichés: type is the
loudest carrier of a product's voice, and this product has not made a single typographic choice.

**The obvious fix looked like it collided with a north star** — a webfont costs bandwidth on "a
cheap Android with intermittent data" (MASTER_TODO §1, north star #1). **It doesn't, because the
pairing didn't need a webfont:** a *system serif* stack gives headings a distinct voice for zero
bytes. Resolved in §4. The dead `:root` stack at `index.scss:10` is deleted too.

### F2 — The type hierarchy is narrow

**Verified:** the scale runs `$text-xs` 12 → `$text-3xl` 30px, but the page title is
`$page-title-size: $text-xl` = **20px** (`variables.scss:112-114`) against 16px body — a ratio of
**1.25**. `$text-2xl`/`$text-3xl` are barely used.

The research is consistent here: real scales use *fewer* steps with a *wider* ratio, and let
weight/colour/space carry hierarchy rather than size alone. A 1.25 ratio between the page's most
important text and its ordinary text is why screens read as flat.

**Fix:** raise `$page-title-size` to `$text-2xl` (24px). One token, every page.
✅ **APPLIED** — verified at 360px in en/fr/sw, no overflow and no new truncation. See §4.

### F3 — The elevation ramp is Tailwind's defaults, verbatim (partly addressed by F4's variants)

**Verified:** all five shadow tokens are Tailwind's default ramp exactly
(`$shadow-sm` = `0 1px 2px 0 rgba(0,0,0,0.05)`, etc.), there is **no brand-tinted shadow token**,
and `$shadow-sm` accounts for **29 of 59** `box-shadow` uses. The canonical card is
`white + 1px $gray-100 hairline + $radius-lg + shadow` — which is precisely the "one shadow at 0.1
opacity everywhere plus a hairline" tell.

**Fix:** either commit to flat (drop the shadow, keep the hairline) or make elevation *mean*
something (only raised/interactive surfaces get a shadow; nested content is flat or inset). Also
worth a brand-tinted shadow (a shadow carrying a hint of `$primary`'s hue reads far less
stock than neutral black at 5%).

### F4 — The card look is re-implemented, not composed

**Verified, and this is the most actionable finding:** `<Card>` is used **14 times across 11
files**, while **58 stylesheets paint their own white surface** (85 occurrences of
`background: white` / `background-color: white`). `StageFeedView.module.scss:12-21` and
`HomeView.module.scss:97-101` reproduce the card recipe by hand.

Everything therefore looks *approximately* the same without being the same — which is exactly the
"uniform cards, no ranking" impression, and it is why nested content (a card inside a card, e.g.
`AdopterCard` inside `AdoptionFramework`) has to hand-roll a distinct tone each time.

**Fix:** give `Card` a surface variant (`raised` | `flat` | `inset`) and migrate the hand-rolled
surfaces onto it. That single change buys the differentiated surface language F3 wants, kills ~85
duplicated declarations, and makes "which things are peers?" legible.
🔨 **Variant mechanism APPLIED** (§4); the migration of 58 stylesheets is its own session.

### F5 — `$primary` is Tailwind's `blue-500`

**Verified:** `#3b82f6` = Tailwind `blue-500`. Not the purple tell, but still a framework default.
**No change proposed** — the brand blue is a locked product decision (DESIGN_SYSTEM.md:408),
reaffirmed at two gates. Noted only so the finding isn't rediscovered later. If Eston ever revisits
brand colour, this is the entry point.

### F6 — Eight ad-hoc radius values, all in dead UI

**Verified:** `10px`, `4px`, `3px`, `6px`×… appear in `MergeProposalCard.module.scss` and
`MergeProposalsList.module.scss` — violating the no-ad-hoc-values law. Both files live on the
**`/…/collaboration` route, which nothing in the app navigates to** (see MASTER_TODO §7). So this
is less a style bug than more evidence that route is unmaintained: fix it as part of deciding
whether to wire that route up or retire it.

---

## 3. Applied this session

- **Tabular figures for data** (`@mixin tabular-nums`, `variables.scss`). The app had exactly
  **one** `font-variant-numeric` declaration across 230 stylesheets while showing tallies, counts,
  percentages and country breakdowns everywhere. Applied to the conviction aggregate stats and
  country weights, the solution action counts, and the adoption progress percentage. Not merely
  cosmetic: those numbers update in place (backing moves 15→16 backers, 56→68 strength) and
  proportional digits made them shift sideways as they changed.

---

## 4. Decisions taken (Eston delegated these, 2026-08-05)

1. **Typeface (F1) — YES, and it costs zero bytes.** New `$font-display` / `$font-body` tokens;
   `$font-display` is a **system serif stack** (`ui-serif, Georgia, …`). A serif does three jobs at
   once: gives headings a voice the stock UI sans can't, reads warmer and more human, and reads as
   a *document* — which is what a mandate must be to a ministry. Because it's a system stack,
   nothing downloads on a cheap Android, so F1's trade-off against north star #1 **disappears**.
   Applied as one global `h1..h6` rule, not per component (a serif applied component-by-component
   drifts back out of sync one heading at a time — I applied it to four components first, watched
   the community hero go out of sync in the preview, and moved it). The swap point for a real
   webfont is documented on the token if we ever want one.
2. **Title ramp (F2) — YES.** `$page-title-size` `$text-xl` → `$text-2xl`. 1.25 → 1.5 ratio against
   body. Verified at 360px in en/fr/sw: no overflow, no new truncation.
3. **Card surface variants (F4) — mechanism YES, migration deferred.** `Card` gains
   `raised | flat | inset` so elevation means something instead of decorating every box. Migrating
   the 58 stylesheets that hand-roll a white surface is its own session — logged to MASTER_TODO §7.

All three are **direction-agnostic**: they survive the Campfire rebrand below and don't assume it.

---

## 5. Campfire Democracy (Eston's direction, 2026-08-05)

Eston is keen to rebrand as **Campfire Democracy**, leaning into a camping / caveman feel. Visual
direction proposed as an artifact (palette, type, real component specimens, vocabulary).

**Recommendation: keep campfire, drop caveman.**

- **Campfire earns its keep.** The fire people sit around to decide things is the oldest
  deliberative form there is, and it is *pre-national* — which suits a transnational platform
  better than any state imagery. It is warm where civic tech is cold, and it is nobody's default
  output, which is the actual fix for F1–F4's undifferentiation. It also explains the product's
  hardest mechanic for free: **conviction is tending a fire** — you keep it lit by feeding it.
  That is a better explanation than the current UI manages.
- **Caveman is the half that costs.** A mandate has to be ingestible by a ministry, and cave-scrawl
  iconography argues against that on sight. Separately: for pilot communities in Kenya and Malawi,
  "primitive people deciding things around a fire" is a reading someone will land on. Campfire is
  an atmosphere; caveman is a costume.
- **Palette note:** the honest campfire ground is **night, not cream**. A campfire is a dark
  experience with one hot source. This also avoids the warm-cream-plus-terracotta palette that
  every "warm rebrand" — and every AI mood board — arrives at.
- **Two words must not be renamed:** *mandate* and *vote*. Those are the words institutions
  recognise and the ones users must not have to decode. When a metaphor starts renaming ballots it
  has stopped serving users.
- **`$primary` `#3b82f6` is untouched.** The brand blue is a locked decision confirmed at two
  gates; a rebrand supersedes it, but that is Eston's call to make explicitly, not mine to assume
  from "keen to".

---

## 6. Still open

### The thing no design change fixes

Eston's own read is worth recording: his long-term intent is that initiative content becomes
**short-form video**, not text. That is probably right about the deeper cause. The current app
shows abstract, uniformly-shaped, machine-plausible *prose blocks* — and no typographic or surface
change makes generated-looking text look authored. Real user content (video, photographs, real
names, real places) is what makes a participation product look inhabited. The findings above are
worth doing; none of them substitutes for that.
