# UI Web of Trust — Implementation Acceptance Evidence

## Track A — visual repairs

### Baseline captured 2026-09-17

Baseline source revision: `f606d9f`. These observations are deliberately partial;
[browser evidence](./browser-evidence.md) is owned by the controller. The authenticated
and light-mode checks remain pending explicit permission because automatic approval review
blocked synthetic localhost login submission. The key generator was not used; a synthetic
64-character `a` key was entered solely to inspect the enabled login control, and no login
was submitted.

| Surface | Viewport / theme | Observation |
| --- | --- | --- |
| Get Started — enabled | 360 × 800, dark | Computed fill: `rgba(0, 0, 0, 0)` |
| Get Started — disabled | 360 × 800, dark | Computed fill: `rgba(0, 0, 0, 0)` |
| Login input | 360 × 800, dark | Computed font family: Arial |
| Key generator | 360 × 800, dark | Measured 42 × 44.5 px |
| Modal close | 360 × 800, dark | Measured 32 × 32 px |
| Country selector trigger | 360 × 800, dark | Measured 280 × 40 px |
| Selected Afghanistan option | 360 × 800, dark | Foreground `rgb(59, 130, 246)` on `rgba(59, 130, 246, 0.1)` |
| Login scroll width | 360 × 800, dark | 360 px; no horizontal overflow observed |
| Login scroll width | 1280 × 720, dark | No horizontal overflow observed |
| Login helper label | 1280 × 720, dark | `rgb(107, 114, 128)` on card `rgb(30, 41, 59)` |
| Organization hint | 1280 × 720, dark | `rgb(100, 116, 139)` on card `rgb(30, 41, 59)` |

### Implemented source repairs, pending browser confirmation

- The login primary action now uses the shared primary `Button`, including its disabled
  and loading behavior, instead of inheriting the transparent bare-button reset.
- `.input-field` now inherits the body font; dark login helper and organization-hint
  copy use `$dark-text-secondary`.
- `$touch-target-min` is the reusable 44 px control token used by the key generator,
  shared modal close control, and shared searchable-select trigger.
- Selected searchable-select options use `$primary-dark` on the light tint and
  `$primary-on-dark` on a dark tint, with selected-hover styles that retain that pairing.

### Post-repair evidence and remaining acceptance work

The controller's rendered checks confirmed the brand-filled enabled action and its
distinct `.55` disabled opacity, system-font inputs with an unchanged serif heading,
and helper contrast of 5.71:1 in dark mode and at least 4.76:1 in light mode. The key
generator, modal close control, and country trigger measure 44 × 44, 44 × 44, and
280 × 44 px respectively. The light and dark selected-option pairs measure 4.61:1
and 5.67:1; source and alpha-composited contrast math give 4.61:1 and 5.32:1 for
their hover rules. A long country label fits without overflow.

At 360 × 800 the English login held in light and dark; French and Swahili were checked
in dark mode. Desktop layout held at 1280 × 720. Keyboard focus was visible, focused-button Enter
activation succeeded with synthetic local-demo credentials, the validation error state
rendered, and the modal focus trap, Escape close, and focus restoration worked. An
authenticated modal close control also measured 44 × 44.

Track A is not fully release-accepted. Runtime hover, the Button's isolated loading
branch, disabled nonactivation instrumentation, disabled shared-select consumers,
authenticated shared-select use, and the full theme × viewport × locale × interaction
matrix remain unverified. The before-state matrix was also partial. Exact observations
and the local-demo evidence boundary are in [browser evidence](./browser-evidence.md).

### Automated checks after the source repairs

| Check | Result | Evidence boundary |
| --- | --- | --- |
| `npm run build` | Pass | TypeScript and local Vite bundle completed successfully. |
| `npm run build:prod` | Pass | TypeScript and production-mode Vite bundle completed successfully. |
| `git diff --check` | Pass | No whitespace errors reported. |
| Project grep gates | Pass | The project verification script reported all gates clean. |
| Scoped ESLint on `LoginPage.tsx` | Pass | Re-run on 2026-09-22 against the repaired working tree; no findings. |

The controller subsequently received permission to use a synthetic demo login.
The mock API handled initialization, while `AuthContext` also attempted an SSE
connection to the configured default host with the random synthetic identifier
in its request URL. Server receipt was not observed or confirmed; see the
boundary correction in browser evidence.
Keyboard activation of the focused Get Started control succeeded. The observed
“Validating session…” state belongs to application session validation; the Button's own
loading branch has not yet been isolated in browser evidence. See
[browser evidence](./browser-evidence.md) for the controller's current measurements and
remaining post-fix matrix.
