# S43 — Impeccable critique of the beta, and the fixes (2026-10-23)

The critique ran as two isolated sub-agents (design review; detector + browser evidence) on the
beta dev build at 360×740, light and dark. Score **25/40 (Acceptable)**, four P1s, no P0. The
snapshot is `.impeccable/critique/2026-10-23T12-40-54Z__src-pages.md`. Eston's call: fix
everything, start with the unaided run, end it on one named ask. Locked decisions (brand blue,
system-sans type, 4-stage IA, demo HomeView) were reported and left alone.

## What changed (beta only unless noted)

| Finding | Fix | Files |
|---|---|---|
| P1 Keys screen: icon-only generate, stale error, Server URL on the newcomer path | With a door recorded, the primary is **Create my key** (makes the key, signs in); "I already have a key" and "Choose a different server" are disclosures; the lead names the door; Generate clears the stale error (demo too) | `LoginPage.tsx`, `LoginPage.module.scss` |
| P1 Save your key: Continue below the fold, weak "Copied" | Checkbox + Continue in a sticky foot; the copied state is a success Banner; no StageFooter clearance in the beta | `BackupStep.tsx`, `steps.module.scss`, `OnboardingFlow.*` |
| P1 Four equal verification pathways | "Ask someone who knows you" is the one primary card; the other three sit under "Other ways to get approvals (3)"; the camera line is said once; section title "Get your first approval"; no "Verification" eyebrow | `PathwayCards.*`, `VerificationHub.tsx`, `IdentityView.tsx` |
| Finish line | Ready ends on "Next: four people who know you vouch for you. Start by asking one." and the primary **Ask someone who knows you** | `ReadyStep.tsx` |
| P1 Fabricated participation on the profile card | Hidden in the beta | `DigitalAgentCard.tsx` |
| P2 Forum composer | Textarea labelled; Enter = newline, Ctrl/Cmd+Enter posts; no "+ Add sources"; "N posts" / "Posted"; Delete asks first; sort toggle from three posts | `ThreadedDiscussion.tsx` |
| Minors | AI key field hidden; "Language you speak"; Kind lead says the door chose; stepper label "Account"; profile-step lead without "deliberations"; Logout asks first | `Profile.tsx`, `AgentStep.tsx`, `KindStep.tsx`, `OnboardingFlow.tsx`, `HomepageMenu.tsx` |
| Mechanical (both modes) | Dark placeholders and country trigger ≥4.5:1; dark "Add photo" on `$primary-on-dark`; stepper numerals `$gray-600`; bell and Edit profile at 44px; title band full-bleed; `text-wrap: pretty` on paragraphs; dark Generate button visible | `index.scss`, `SearchableSelect.module.scss`, `PhotoPicker.module.scss`, `Stepper.module.scss`, `NotificationsBell.module.scss`, `AppHeader.*` |
| Detector `ai-color-palette` (violet gradient) | Beta ground is brand blue only (doors + keys); the demo login keeps the brand gradient | `BetaDoorsPage.module.scss`, `LoginPage.module.scss` |

No fr/sw strings were added (languages dropped for the beta, Eston 2026-10-23); every new string
is an inline English default under `beta.*`. The parity scanner still passes (`1510 = 1510`).

## Walk (this folder)

`walk.mjs` drives the newcomer path end to end: door → Create my key → Save your key (Continue
and checkbox in the viewport, Copied banner with `role=status`) → Account → You → Ready → hub, then
the forum (labelled textarea, Enter newline, Ctrl+Enter posts, delete confirm), the profile page
(no participation block, 44px Edit profile and bell), the edit modal (no AI key field) and the
logout confirm. Log: `walk-log.txt`. All checks pass in both themes; console errors are the known
SSE tunnel failures only.

Detector after the fixes, doors page at 390px: one finding left, the locked brand-blue contrast on
"I already have a key" (3.7:1). The violet-gradient finding is gone.

## Not done

- Stepper circles stay 32px (parent row is 80×32); the checkbox is 20px inside a 44px label.
- The doors page's two lead paragraphs (Chidi's red flag) are Eston's copy; untouched.
- Real screen-reader and Android keyboard behaviour: inferred from markup, not tested.
- The demo build was built, not walked; the only demo-visible changes are the mechanical CSS
  ones and the stale-error clear on Generate.
