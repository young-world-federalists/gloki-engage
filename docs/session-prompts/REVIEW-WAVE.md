# Review Wave — diverse test-user panel (run alone, after a wave's lanes merge)

> Paste into a fresh Claude Code session in the repo on `ui`, **after** the wave's lanes have merged
> and the preview build is running (`npm run dev`). Output drives the next refactor of MASTER_TODO.

---

You are running a **usability + collaboration review** of the Gloki UI mockup after a wave of changes.
First read `MASTER_TODO.md` §1 (the two north-star principles), §2 (the Voices-for-the-Climate
mission), and §5 (the persona panel). Make sure the preview build is up and note its URL/serverId.

**Method:** dispatch the **9 personas in §5 as parallel subagents.** Each subagent must:
1. Fully assume its persona (country, language, device, digital literacy, motivation, lens).
2. Attempt this wave's key journeys **on the live preview** (use the `mcp__Claude_Preview__*` tools —
   navigate, screenshot, read the accessibility snapshot, click/fill). Don't review from code; review
   from the running UI as that person would experience it.
3. Judge against the two principles:
   - **Usability:** Could *I*, as this person, complete the task **without help**? Where did I stall,
     get confused, mistrust, or give up? Was the language plain? Did it work on my device/bandwidth/
     language?
   - **Transnational collaboration:** Did I *feel* I was building something with people in other
     countries? Or did it feel like a lonely form?
4. Return findings as a list, each with: **severity** (blocker / major / minor), the screen/step,
   what went wrong, and a concrete suggested fix.

**Persona-specific must-checks:**
- **Thandiwe (Malawi, low literacy, low bandwidth):** can she get through onboarding with no jargon?
  Is there an offline/slow-connection path? Are icons + words, not words alone?
- **Pascal (DRC, French-first):** is the language switch real and complete? Any English leaking
  through? Does anything feel politically unsafe (over-exposed identity)?
- **Amara (Kenya, organizer):** could she shepherd 50 chapter members through this?
- **Tomás (screen reader):** keyboard-only path, focus order, labels, contrast.
- **Dr. Giorgia (evaluator):** does deliberation visibly precede voting? Is the process legible enough
  to study? **James (policy advisor):** does the resulting mandate look credible to an institution?
- **Viktor (skeptic):** are consent, data use, and "how my vote is counted" transparent?

**After the subagents report, synthesize:**
- A ranked list of **blockers** and **majors** (dedupe across personas; note when several personas hit
  the same thing — that's a priority signal).
- 3–5 **"biggest wins"** the wave delivered (so we keep what works).
- A **proposed MASTER_TODO update**: new tasks, re-prioritizations, and anything to move into or out of
  §7 (deferred). Write it as a diff-style list ready to paste into §11 (changelog) and the backlog.

Keep the final synthesis tight and skimmable — it's the input to the next planning pass. Do **not**
change code in this session; this is review only.
