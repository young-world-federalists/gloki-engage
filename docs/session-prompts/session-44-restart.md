# Session 44 — restart after S43 (forum bylines, critique fixes, the landing page)

Written 2026-10-23 at the end of S43 so a cold session can pick up. Branch
`claude/youthful-cerf-ltibol` at `40d953a` (this file's commit follows it), pushed. **`origin/ui` is
still `2946608`: nothing from S43 has gone to `ui`, and nothing goes there without Eston's explicit
go.** The deploy still waits for Ouri (`server-side`, `build:beta`).

## What S43 left on the session branch (all pushed)

1. Forum bylines through the seam (`getForumParticipants`), one welcome post, `DEMO_VERSION`
   `global-v21`, account kind editable on the profile page, three beta leftovers. Evidence
   `docs/reviews/2026-10-23-s43-forum-bylines/`.
2. Languages dropped for the beta: `SHOW_LANGUAGES` in `src/appMode.ts` hides the switcher; fr/sw
   stay in the bundle; new beta strings are inline English only, no parity work.
3. Impeccable critique of the beta surfaces (25/40, four P1s) and the full fix pass Eston asked
   for: create-my-key primary, sticky checkbox + Continue on Save your key, one primary pathway on
   the hub and a named ask on Ready, demo leakage hidden, forum composer as a forum, contrast and
   target fixes. Snapshot `.impeccable/critique/2026-10-23T12-40-54Z__src-pages.md`, evidence
   `docs/reviews/2026-10-23-s43-critique-fixes/`. Locked calls (brand blue, system sans) untouched.
4. **The gloki.app landing page**, a separate repo that existed only in the session container.
   Its full history is parked as a git bundle: `docs/site/gloki-site.bundle` (site HEAD `14578a4`,
   six commits). Restore it with:

       git clone docs/site/gloki-site.bundle /home/user/gloki-site

   Then `cd /home/user/gloki-site && python3 -m http.server 8787` to preview. It is one HTML + one
   CSS file, self-hosted fonts, two real app screenshots, 160 KB, no third-party request, works with
   JavaScript off, Impeccable detector clean at 390 and 1440, finish review verdict **ship** on its
   fix list, DESIGN.md + `.impeccable/design.json` written. PRODUCT.md and
   `.impeccable/surfaces/index-html.md` (the direction contract, seed:9407b0d190575a4d) are the record.

## Open for Eston (nothing here moves without his answer)

- **Buttondown username** for the waitlist form: `BUTTONDOWN_USERNAME` in `index.html` (one edit,
  also in the site README). One list with a `tag` per door is what is built.
- **Go to create `young-world-federalists/gloki-site`** and push the restored repo there, then
  GitHub Pages and the gloki.app DNS (owner and registrar unrecorded).
- Three copy calls on the page: naming the Young World Federalists as the builder; the status row
  "your own agent holding your data" shown as **Planned**; contact as "reply to the first email the
  waitlist sends you".
- Whether to push the S43 app work to `origin/ui`.

## Re-verify these premises vs HEAD before doing anything

- `git log -1 origin/ui` is still `2946608`; PR #24 (ui → server-side) state; whether Ouri has
  replied on `build:beta` or shipped a runnable node (the contribute door launches dark until then).
- `node .claude/skills/gloki-i18n-playbook/scripts/check-i18n-parity.mjs` passes (`fr = sw = 1510`).
- `npm run build` and `npm run build:beta` are green at HEAD (`npm ci` first in a fresh container).
- Impeccable is **not installed** in a fresh container. What worked in S43: clone
  `github.com/pbakaus/impeccable` (GitHub is reachable), copy `.claude/skills/impeccable` to
  `~/.claude/skills/impeccable`, fetch the engine binary from
  `github.com/pbakaus/impeccable/releases/download/engine-v<ENGINE_VERSION>/impeccable-linux-x64`
  into `~/.claude/skills/impeccable/scripts/bin/linux-x64/impeccable` (chmod +x), then run
  `impeccable context` in the project. `impeccable.style` is refused by the environment's network
  policy, so `npx impeccable install` fails and the direction roll runs degraded (no challengers).
  URL scans need `IMPECCABLE_BROWSER` pointing at a two-line wrapper that execs
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome --no-sandbox`. The shipped agent types
  (`impeccable-finish-reviewer`, `impeccable-documenter`) are not registered; spawn a general-purpose
  agent and have it read its definition from `~/.claude/agents/<name>.md` first.
- The one pre-existing eslint error in `ThreadedDiscussion.tsx` (`react-hooks/set-state-in-effect`,
  the focus-after-post effect) is at HEAD before S43 too; not ours.

## Read first

`CLAUDE.md`; `MASTER_TODO.md` §8 top entry (S43, with its follow-ups); the two S43 evidence READMEs
under `docs/reviews/`; the critique snapshot; for the site, `PRODUCT.md`, `DESIGN.md` and the
surface brief inside the restored repo. Skills: `gloki-session-lifecycle`, `gloki-change-control`,
`gloki-verification-and-qa`, and `impeccable` once installed.

## Likely next work (Eston decides the order)

1. Wire Buttondown, create the site repo, push, Pages, DNS; take the live page through
   `/impeccable audit` and a Lighthouse run on a phone.
2. Push the S43 app work to `origin/ui` on Eston's go; write the Ouri note if the beta build is
   wanted on `server-side`.
3. Not verified in S43 and worth a human pass: real screen-reader and Android keyboard behaviour on
   the beta screens, the page's draw-on animation and hover/focus states by eye.
4. From the critique's open questions: "N people from M countries are here" in the forum header
   (a seam read), and a paper or QR backup for the key (a product call).

## Don't

- Don't push to `origin/ui` or touch `main` / `server-side` without Eston's go.
- Don't delete the bundle until the site lives in its own GitHub repo.
- Don't reopen the locked calls (brand blue, system sans, 4-stage IA, demo HomeView).
- Don't add fr/sw strings for beta work; languages are dropped for now.
