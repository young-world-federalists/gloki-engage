# Terra: fonts, colors and button audit

Read-only 2026-09-17. Live dark login and organization dialog at 1280x720/360x800, backed by target git show server-side a81218f. Local ui f606d9f inspected separately. No authenticated/live light-mode coverage.

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| UI-1 | major | Login primary action has no visible button fill; enabled/disabled visually identical | src/pages/LoginPage.module.scss:219-225 lacks surface/color; global button reset src/styles/index.scss:92-104 leaves transparent. Live enabled and disabled Get Started: transparent background and border, none bg-image, #f1f5f9 text, opacity1. Text remains visible: do not call entire button invisible. |
| UI-2 | major | Dark login helper text lacks contrast | LoginPage.module.scss:72-78 #6b7280 on card #1e293b =3.03:1; .orgHint:371-377 #64748b on same =3.07:1, both 12px vs4.5:1 requirement. |
| UI-3 | minor | Three touch targets below project44x44 rule | LoginPage.module.scss:88-104 generator42x44.5; shared/Modal.module.scss:54-66 close32x32; shared/SearchableSelect.module.scss:8-19 country trigger280x40. Measured live. This is project standard; do not mislabel all as WCAG2.1AA violations. |
| UI-4 | major, source-only | Selected SearchableSelect option color specificity defeats dark override | SearchableSelect.module.scss:96-106 .option.selected keeps primary #3b82f6 on10% primary tint; light composite #ebf3fe=3.29:1, dark #13223e=4.31:1, text14px. Not authenticated runtime-confirmed. Recheck layered cascade/backdrop before fix. |
| UI-5 | minor | Form input font mismatch | globals.scss:48-56 .input-field lacks font-family inherit; measured Arial16 in login and org fields vs system body. |

Retain: serif heading is deliberate variables.scss:111-113/globals.scss:10-12; #f1f5f9 on#1e293b13.35:1; #94a3b8 on dark surfaces5.71-6.96:1; no mobile horizontal overflow. White/#3b82f6=3.68 is recorded locked brand deviation, not new defect.

Acceptance: visible enabled primary fill, differentiated disabled state; helper pairs>=4.5; hitboxes>=44; selected dropdown pair>=4.5 both schemes; inputs system font; retain intentional serif and brand; 360px no overflow. Review light/dark, hover/focus/disabled and authenticated screens after access available.
