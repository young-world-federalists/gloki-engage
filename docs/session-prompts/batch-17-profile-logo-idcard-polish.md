# Session prompt — Batch 17: profile polish + logo swap + ID-card + back-button (the restructure's sibling workstreams)

Paste this into a fresh Claude Code session on the `ui` branch. The big **community-page restructure**
(workstream 1 of Eston's 2026-06-18 feedback) is **shipped & live**. This batch finishes the **three other
workstreams** he raised in the same message that were deliberately scoped out of the restructure, plus two
tiny review follow-ups. None of these are large; the meatiest is the profile-edit polish.

> Check `git log` first. The restructure is **pushed & live**: commits `54f6756..8bcb2a0` sit on top of
> B16's `76bebd4`; the Pages deploy ran green; PR #20 (`ui` → `main`, for Ouri) was refreshed to `8bcb2a0`.
> You start fully synced — local `ui` == `origin/ui` (unless this prompt's own docs commit is on top). Push
> only with Eston's green light, as always.

---

## What the restructure shipped (commits `54f6756..8bcb2a0`, live) — context you'll build on

Full detail in `docs/specs/2026-06-18-community-page-restructure-{design,plan}.md` and the
`project_community_page_restructure` memory. In one breath:

- New **`GlobalHeader`** (Gloki brand + `EarthFlag` icon → home, single right-hand hamburger → the account
  menu `HomepageMenu`) on community + discussion pages; the left-hand community menu is gone.
- **`CommunityCard`** consolidates the old dark header + `MissionBanner` (deleted) into one card with a
  `Start an initiative` + `Menu` action row (the community menu now opens from that `Menu` button, right side).
- **`ActivityCard`** + **`InitiativeStagePanel`**: the community feed expands initiatives **inline** (extracted
  from the deleted `InitiativeDashboard`); `?initiative=<id>` auto-expands; old `/roadmap` URLs redirect to
  `/community/:id?initiative=:id`; the global `StageFooter` is the only roadmap.
- `ProblemStage` now labels **"The problem"** vs **"Who it affects"**, and "propose a different problem" →
  **"Propose a different framing"** (hybrid model).

Touch these only if a task below requires it; otherwise leave the restructure alone.

## How we work (unchanged, non-negotiable)

- Develop on `ui` against the stub seam (`src/services/api.ts` / `src/services/demo/`) only. Never call a real server from a component.
- Design system is law: tokens (no hard-coded hex; `$primary` #3b82f6 stays), AA contrast, `:focus-visible`, ≥44px targets, light **and** dark, 360px mobile. See `DESIGN_SYSTEM.md`.
- Verify before "done": `npx tsc -b && npm run build` exit 0, then live-walk affected routes
  (`preview_start({name:"gloki-dev"})`, port 5173) in en + fr/sw where strings changed. Preview defaults to
  dark — pin light with `preview_resize({colorScheme:'light', width:360})`. The console buffer is cumulative
  and survives soft reloads; if you see HMR-thrash errors after many edits, restart the server
  (`preview_stop`+`preview_start`) for a clean read before trusting them.
- Small local commits, `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer. **Do NOT push** without Eston's green light (push auto-deploys to Pages + refreshes PR #20).
- Slow external drive: small sequential I/O. **`.module.scss` / `fr.ts` / `sw.ts` must be Read before Edit.** i18n = inline English default in `t('key','English')` + add the key to `fr.ts` AND `sw.ts` (keep them equal; en.ts is not separately maintained). Currently **886 each**.
- Demo seed (persisted in the preview browser): `localStorage.user = {publicKey:'a'×64, serverUrl:'https://gdi.gloki.contact'}`, onboarding `{step:6,completed:true}`, `gloki.locale`. Working demo community last session: `demo-comm-mqjfmdwv-qtu6a65k` — if it's gone, click any community on Home (`/`) to get a live id. Switch locale live: `localStorage.setItem('gloki.locale','fr')` then navigate. Artifact check: `document.body.innerText.match(/\{\w+\}/g)` → null.

---

## Decisions already made (Eston, 2026-06-18) — do not re-ask, just build

1. **Profile label → personalize to the name.** Drop "digital agent" entirely. The person's own name is the heading (sample identity: "Max Mustermann"); the action button reads "Edit profile". No abstract label anywhere.
2. **Language picker → single-select**, searchable, exactly like the country `SearchableSelect`.
3. **Logo → rebuild as an SVG** component (Eston approved a faithful SVG recreation over a PNG).

---

## The work

### 1. Profile edit polish — the meatiest (`src/components/identity/Profile.tsx` + `PhotoPicker.tsx` + their `.module.scss`)

The edit modal is titled "Edit your Digital Agent". Four sub-items:

- **(a) Drop "digital agent"; personalize to the name.** `grep -rni "digital agent" src/` — the modal title + any body/i18n copy. Replace so the person's **name** is the heading (sample: "Max Mustermann") and the action reads **"Edit profile"**. Remove the abstract term everywhere; route the new strings through `t()` with matching `fr.ts`/`sw.ts` keys.
- **(b) Spacing under the header.** Eston: "needs more spacing between the profile and the header." Add vertical breathing room at the top of the Profile page/modal (token spacing, not magic px).
- **(c) Photo affordance is invisible.** `PhotoPicker.tsx` puts a tiny `<Camera size={14}>` badge (class `styles.camera`) over the avatar; Eston can't see it. His steer: "maybe the whole blue photo icon should be in the center of that, or just swap the little person for a photo icon." So make the "add/change photo" affordance obvious — e.g. when there's no photo, show a centered camera/photo icon (not the generic `User` person) with a clear "Add photo" hit area; when there is one, a legible camera badge. Keep ≥44px tap target, AA contrast on the blue, works light+dark.
- **(d) Language → single searchable dropdown.** Today: chip toggles over `ONBOARDING_LANGUAGES` (~6, multi-select). Country already uses `SearchableSelect` (`src/components/shared/SearchableSelect.tsx`) over `COUNTRIES` from `src/utils/countries.ts` (197, with flags). **There is no full languages dataset yet** — create one (mirror `countries.ts`: `src/utils/languages.ts` with ISO-639 code + English name + native name). Wire the field to a **single-select** `SearchableSelect`, same pattern as country. ⚠️ This changes the field **multi → single**: check what the profile currently stores (likely an array of codes — see the profile write in `communitiesSlice`/`preferencesSlice`) and migrate the read/write cleanly through the seam (store one code; when reading a legacy array, take the first). Don't break existing demo profiles.

Verify the modal end-to-end in en + fr/sw at 360px light+dark.

### 2. Logo swap — `EarthFlag` → Eston's app icon (`src/components/shared/EarthFlag.tsx`, rendered by `GlobalHeader` + `PageHeader`)

The current "circles" mark is the code-generated `EarthFlag` SVG. Eston's app icon is a **blue rounded square with a white person + two broadcast arcs** (the one he attached). **Decision: rebuild it as an SVG component** (not a PNG): a rounded `rect` in his blue (~`#1b63b0`) + a white `circle` head + two white stroked arcs — themeable, crisp at any size, no asset file. Either replace `EarthFlag`'s internals or add a new `GlokiMark`/`AppIcon` component and swap usages. Keep **`aria-hidden`** on the root `<svg>` (added in the restructure cleanup — it's decorative beside the "Gloki" wordmark). If Eston later wants pixel-exact, a PNG in `public/` via `<img>` is the fallback, but build the SVG first.

Swap it in `GlobalHeader.tsx` (and the homepage `PageHeader` brand) so the new icon shows app-wide. Walk Home + a community page to confirm.

### 3. ID card — name no longer clipped by the QR (`src/components/community/dialogs/IdentityCardSVG.tsx`)

Names get cut off behind the QR (canvas-rendered at fixed x/y; see the file's header comment). Eston (B13/B14) decided the credential **stays canonical English** — so this is purely a **layout** fix, not an i18n one: shrink the QR and/or reflow so the name has its own room and never overlaps. Re-verify with a long name via the IdentityCard dialog (`IdentityCardDialog.tsx`) — check the SVG preview *and* the downloaded PDF, both light + dark.

### 4. Create-community back button is invisible (`src/pages/CreateCommunityPage.tsx` + its `.module.scss`)

The back button **exists** (an `ArrowLeft` → `/identity/communities`, `aria-label` `common.back`) but reads as hidden — a contrast/placement issue, not a missing control. Make it clearly visible (token color with AA contrast, sensible position/size, ≥44px). Quick one.

### 5. (Optional) small follow-ups from the restructure review

- **Vestigial `/roadmap` links:** `InitiativeFeed.tsx`, `HomeView.tsx`, `StageFeedView.tsx` still build `…/roadmap` URLs. They work (the redirect catches them → community page with the card auto-expanded), but a tidy could point them straight at `/community/:id?initiative=:id` to drop the redirect hop. Low priority; verify the auto-expand still fires if you change them.
- **Two-sentence problem fixtures:** `src/services/demo/fixtures/problems.ts` water/ocean `description` are 2 sentences, so the new "The problem" label shows a short paragraph for those. Tighten to one clause if Eston wants the label to read as a true one-liner. Demo-only copy.

### 6. Push / PR #20 — Eston's call

`origin/ui` is at `8bcb2a0` and PR #20 reflects it. New work needs his green light to push (auto-deploys to Pages); refresh the PR body + ahead-count when you do.

## Sizing + when done

Medium session — the three upfront decisions are already made (see top), so it's straight building. Profile
(task 1) is the bulk — and (d) needs a new single-select `languages.ts` dataset + a multi→single migration.
Logo (2) is a contained SVG rebuild. ID-card (3) is a contained SVG
layout fix. Back-button (4) is trivial. The follow-ups (5) are optional. Whatever you touch: `tsc -b` + build
green; en/fr/sw spot-walks of touched routes at 360px light+dark; i18n parity stays equal; small local
commits; **no push** without the green light. Hand back with shipped-vs-deferred.
