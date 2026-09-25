# Track A browser evidence

Date: 2026-09-17. Supervisor observations against local Vite preview at `http://127.0.0.1:5173`, baseline `f606d9f`. This is local demo evidence, not production or server-enforcement evidence.

## Before repairs

Observed forced dark theme, English, at 360×800; desktop overflow also checked at 1280×720.

| Item | Computed observation |
| --- | --- |
| Login action | Enabled and disabled both `rgba(0, 0, 0, 0)` background; enabled inspected with synthetic 64-character text, without submitting |
| Identity/server inputs | `Arial`; 44.5px height |
| Key generator | 42×44.5px |
| Organization modal close | 32×32px |
| Country trigger | 280×40px |
| Selected Afghanistan option | `rgb(59, 130, 246)` text on `rgba(59, 130, 246, 0.1)` background |
| Field helpers | `rgb(107, 114, 128)` on card `rgb(30, 41, 59)` |
| Organization helper | `rgb(100, 116, 139)` on card `rgb(30, 41, 59)` |
| Horizontal overflow | None: document width equals viewport at 360 and 1280 |

Baseline is partial: light, hover, focus, loading, and error matrix was not fully captured before repairs. Do not mark the baseline checklist fully complete.

## Test limitations

Automatic approval review initially rejected clicking key generation and submitting synthetic demo login as security-sensitive identity/sign-in actions. The supervisor later authorized these tests. The later generated random synthetic identifier was used for the demo login flow. Boundary correction: the app attempted an EventSource connection to `https://gdi.gloki.contact` whose request URL included that identifier. Server receipt was not observed or confirmed. No real credential, provider, or approval authority was used.

## After repairs

### Observed results

- Forced light and forced dark login at 360×800, plus desktop layout at 1280×720: document width equals viewport; one h1. Light screenshot inspected. Display heading retains the serif stack; both inputs inherit the system body font.
- Generator 44×44; organization-modal close 44×44; country trigger 280×44. Authenticated “Verification demo state” modal close also measures 44×44 at 360px; no scenario was applied.
- Primary action: brand background `rgb(59,130,246)`, opacity 1 enabled and .55 disabled. Native disabled state inspected. Successful keyboard activation of focused Get Started with synthetic local demo credentials reached Home. Enter in a text field does not submit because this existing screen is not a form.
- Local login displayed the app's “Validating session…” loading screen. The Button's own spinner/loading branch was not isolated; do not claim that branch was observed.
- Invalid-key blur shows the expected alert and disables the action. Generator and dropdown option keyboard focus have a visible 2px blue outline. Modal first Tab reaches Close; Shift+Tab wraps to the last enabled action; Escape closes and restores trigger focus.
- Key generation produces 64 alphanumeric characters. The earlier non-submission observation predates the later authorized synthetic demo login and is superseded by the boundary correction below.
- Light selected option: `rgb(37,99,235)` on `rgba(59,130,246,.1)` over white = **4.61:1**. Dark selected option: `rgb(96,165,250)` on `rgba(255,255,255,.08)` over `rgb(15,23,42)` = **5.67:1**. These colors were read from rendered options.
- Dark field helpers and organization hint: `rgb(148,163,184)` on `rgb(30,41,59)` = **5.71:1**. Light field helpers = **4.83:1**, organization hint = **4.76:1**, both against white.
- Selected-hover source review: light retains the .1 tint (**4.61:1**); dark uses .1 white tint (**5.32:1**). Hover was not driven in the browser because the supported control surface has no hover action; these two results are source/math evidence, not observed hover evidence.
- Long country label “Central African Republic” fits the 280×44 trigger without internal overflow. The shared country selector was exercised within the organization modal, without submitting it.
- English/French/Swahili mobile login layout holds at 360px in dark mode. No translation keys changed. This is not a complete locale × theme × interaction matrix.

Contrast uses the project's `contrast-eval.js` luminance/ratio functions with alpha backgrounds explicitly composited over their observed underlying surfaces before calculation.

### Remaining acceptance coverage

The before-state matrix was partial. Runtime hover, isolated Button loading, disabled shared-select consumers, authenticated shared-select use, and the full theme/viewport/locale interaction cross-product remain unverified. Native disabled rendering and source guards were inspected, but disabled nonactivation was not separately instrumented. Track A is implemented and substantially checked, **not fully release-accepted under every checkbox in the plan**.

Build and production build passed. Scoped lint reports four errors and two warnings reproduced identically on baseline HEAD; no new findings. Whitespace and project grep gates passed. No production backend cases were executed.

## 2026-09-22 controller follow-up

The controller reused the existing local Vite server on `localhost:5173`. The
mock API supplied the login initialization and no real account, provider,
camera, or approval authority was used. **Boundary correction:** `AuthContext`
also attempted an EventSource connection to `https://gdi.gloki.contact`, with a
request URL containing the random synthetic identifier. This is an attempted
outbound connection/request, not evidence that the server received it. No
further login/network checks were performed.

- The permitted synthetic flow was exercised end to end: Generate produced a
  64-character alphanumeric key, enabled **Get Started**, and the local sign-in
  reached `/welcome`.
- At forced light and forced dark, 360×800, the authenticated onboarding country
  selector had no horizontal overflow (`scrollWidth === clientWidth === 360`).
  Its trigger and selected option were 44px high. The rendered selected colors
  were `rgb(37, 99, 235)` over the light primary tint and `rgb(96, 165, 250)`
  over the dark tint. Keyboard Tab reached the selected option and showed its
  2px focus outline.
- The authenticated Verification demo-state modal closed with Escape. Its
  `aria-label="Close"` control measured 44×44px. No demo scenario was applied.
- The supported browser API has no pointer-hover operation. Runtime hover is
  therefore still source/computed-color evidence, not a pointer interaction.

`npx eslint src/pages/LoginPage.tsx` and `git diff --check` are now clean. The
earlier six-finding lint note above describes the pre-repair baseline and must
not be read as the current result. The Button-only loading branch, disabled
shared-select consumer, and full viewport × locale × interaction matrix remain
outside this bounded follow-up.
