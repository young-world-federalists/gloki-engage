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

### F1 — There is no typeface. (highest impact; needs a decision)

**Verified:** grepping `@font-face|fonts.googleapis|fonts.gstatic|\.woff|\.ttf|\.otf` across
`src`, `index.html`, `public`, and `package.json` returns **0 hits**. `index.html` has no font
link and no preload. Body renders in the raw system stack
(`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', …`, `src/styles/index.scss:55-57`), and
a Vite scaffold remnant still sets a second stack on `:root` (`:10`).

One system font does **every** job — display, body, UI labels, and numerals. Across the research,
"one default typeface doing every job" is the second-most-cited tell after purple gradients, and
it is the one that best explains "looks generic" in an app that has no other clichés: type is the
loudest carrier of a product's voice, and this product has not made a single typographic choice.

**But the obvious fix collides with a north star.** Adding a webfont costs bandwidth on "a cheap
Android with intermittent data" (MASTER_TODO §1, north star #1). This is a genuine trade-off, not
an oversight — so it is a decision for Eston, not a change to make unilaterally.

Cheapest credible option if he wants it: **one** self-hosted variable font, latin+latin-ext subset
only, ~30–45 KB woff2, `font-display: swap`, system stack as the fallback so a failed/slow load
degrades to exactly today's rendering. Used for headings and numerals only, body stays system —
that gets most of the voice for a fraction of the bytes. Also worth deleting the dead `:root`
stack at `index.scss:10` either way.

### F2 — The type hierarchy is narrow

**Verified:** the scale runs `$text-xs` 12 → `$text-3xl` 30px, but the page title is
`$page-title-size: $text-xl` = **20px** (`variables.scss:112-114`) against 16px body — a ratio of
**1.25**. `$text-2xl`/`$text-3xl` are barely used.

The research is consistent here: real scales use *fewer* steps with a *wider* ratio, and let
weight/colour/space carry hierarchy rather than size alone. A 1.25 ratio between the page's most
important text and its ordinary text is why screens read as flat.

**Fix:** raise `$page-title-size` to `$text-2xl` (24px). One token, every page.
**Not applied** — it touches every `h1` in the app and fr/sw run 20–30% longer than English, so it
needs a full 360px sweep in three languages before it can ship. Recommended as the next cheap win.

### F3 — The elevation ramp is Tailwind's defaults, verbatim

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
duplicated declarations, and makes "which things are peers?" legible. This is the highest
value-per-risk item on the list, but it is a broad refactor — a session of its own.

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

## 4. What Eston needs to decide

1. **A typeface (F1)?** Highest-impact single change, and a real bandwidth trade-off against north
   star #1. Recommendation: yes, but headings/numerals only, one self-hosted variable subset,
   system fallback.
2. **Raise the page-title size (F2)?** One token; needs a three-language 360px sweep.
3. **Card surface variants (F4)?** A refactor session, but it is the change that would most make
   the app read as designed rather than assembled.

## 5. The thing no design change fixes

Eston's own read is worth recording: his long-term intent is that initiative content becomes
**short-form video**, not text. That is probably right about the deeper cause. The current app
shows abstract, uniformly-shaped, machine-plausible *prose blocks* — and no typographic or surface
change makes generated-looking text look authored. Real user content (video, photographs, real
names, real places) is what makes a participation product look inhabited. The findings above are
worth doing; none of them substitutes for that.
