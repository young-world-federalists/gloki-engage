# Card System Redesign — Requirements Brief (2026-06-22)

Source: Eston's feedback, 2026-06-22. This captures **what** he wants, before we design **how**.
It is input to the design spec, not the design itself.

## North star (DECISION PENDING — anchors everything)
Define before designing cards: the goals, what we want users to *do*, how much time per visit,
and how fast an initiative should move through the pipeline. Build the card density + flow around that.

## Track A — Shell bugs (no design needed, fix fast)
- **Global footer**: the `StageFooter` must persist on **all** views — it currently disappears on the
  stage view and/or community view. Keep it global for now.
- **Dark-mode pill contrast**: on Home, the community pill badge is unreadable (blue text on dark-blue
  background). Fix the dark-mode contrast.
- **Header subtitle**: remove the community name shown under "Gloki" in the header on stage/community
  views — unnecessary.

## Track B — Unified card + per-stage panels (the core redesign)
**Every card = two parts, always:**
- **Read (top)** — like a post: the post-type badge (Problem / Solution / Vote / Mandate), then the
  *content as one short paragraph*, then author ("Started by X") + date.
- **Engage (bottom)** — a collapsed, elegant set of actions. Visually a distinct second half.

Specifics:
- **Frame by content, not label.** The problem *text* ("Rents are rising far faster than wages…") is the
  headline — not "Affordable Housing in Growing Cities" (a topic isn't a problem). Merge "the problem" +
  "who it affects" into **one paragraph** as the post body.
- The colored stage badge just **tags the type**; the colored rule belongs only under the badge word
  (e.g. red under "Problem"), not the whole title.
- **Remove "We chose this together"** — unexplained, and the same green as the Verified badge → confusing.
- **Merge Sources + SDG onto one line.**
- **"4 countries"** presentation is confusing — simplify.
- **Author once** — drop the duplicate initials-circle avatar when "Started by Mei Chen" is already shown.
- **The Mandate card is the template**: expand → full summary → one blue "jump in" button. Apply this
  pattern to all stages on the community page (expand a card → summary of that stage: the post, how people
  are engaging, who is engaging → blue button to jump into the full thing, where the deep discussion lives).
- **Solutions card**: the richness is good (lots of options), but it's unclear what to look at / whose
  view it is ("combined proposal" is too busy). Needs clear hierarchy.
- **Thinner by default.**

## Track C — Discussion & information architecture
- **Discussion attached to the post, not floating.** One "Discuss this" button on a card → a threaded
  discussion *about that post* (infinite tree). The post = the problem/solution text; from it you can
  either **vote** (e.g. "is this a shared problem?") or **discuss**.
- **BUG**: opening a problem's discussion shows an *unrelated* statement (the affordable-housing problem
  opens an "algorithmic / Fair Futures Forum" shared-statement page). Discussion isn't keyed to the right
  initiative.
- **Remove the separate per-stage "Open discussion"** link from the problem card — confusing & duplicative.
- **"Propose a different framing"**: keep as a button, but its popup's country selector should be a simple
  **dropdown** (too complex now). Define how a reframing relates to the original (fork? merge?).
- **"Why this matters to us"** (Diego's insights) is confusing — unclear how people get on that list.
  Rethink.
- **"Is this a shared problem?"** vote is confusing (where do I click?) — make **vote** + **discuss** the
  two clear engagement actions.
- **Reconcile the three discussion-ish surfaces**: the community chat, the per-stage discussion stage, and
  the new per-post "discuss this." The current discussion page is messy/old (quadratic-voting "discuss the
  statement").

## Community page (where most of the above lives)
- **Members line**: "17 members" then "16 participants from 16 countries" is redundant & confusing (17 or
  16?). Show **"17 members"** (people icon) + a **flag icon with the country count** ("16 countries") on one
  line.
- **Remove the arrow/bullet list** under the about block; keep only the **"Start an initiative"** button →
  thinner card.

## Process
1. Lock the **north star** (one decision).
2. Fix **Track A** shell bugs in parallel (no design needed).
3. Design **Track B + C** with Eston — concrete card spec + mockups → approval.
4. Implement against that single spec (a focused agent team is fine here; the missing piece in prior
   attempts was a shared card model + goal, which is exactly what this fixes).
