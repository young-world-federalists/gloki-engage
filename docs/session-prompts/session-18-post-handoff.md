# Session 18 — first post-handoff session

**Written 2026-07-03 at the close of S17 (S17 commits local at write time — if Eston green-lit
the push since, they're on `origin/ui` and the handoff message to Ouri may already be sent).
Goal owner: Eston.**

## Context

S17 closed the Handoff-blocking tier: the S16 findings fix tail shipped, the 4-persona sample
ran (one blocker fixed in-session), the whole-branch review came back 0 Critical / 0 Important,
and `ui` was frozen for Ouri to derive `new-features`. Everything left lives in MASTER_TODO §7
"Post-handoff" — this session picks up whichever item Eston prioritizes.

## Read first

1. `.claude/skills/gloki-change-control` + `gloki-session-lifecycle`.
2. MASTER_TODO §7 "Post-handoff" — the only open-work list.
3. This prompt's premise checks below. **Re-verify every one vs HEAD before building.**

## ⚠️ Re-verify these premises vs HEAD before building

| Premise (true at S17 close, local `ui`) | Check |
|---|---|
| S17 pushed; `ui == origin/ui`; Ouri told to derive | `git status -sb`; ask Eston re Ouri |
| Handoff happened (Ouri derived `new-features`) — determines whether `ui` is still frozen or open for post-handoff work | ask Eston; check `git log origin/main` |
| Language-switcher gap still open: LanguageSwitcher only on LoginPage; slide-out menu has no entry | `grep -rln "LanguageSwitcher" src/components src/pages --include='*.tsx'` |
| Wave-1.5 cleanup notes pending: 44px `::after` recipe ×4 (mixin candidate), `teaserTone` enum idea | grep `::after` blocks; read §7 Wave-1.5 bullet |
| DEMO_VERSION still `'global-v16'` | `grep -n "DEMO_VERSION = " src/services/demo/mockApi.ts` |
| Parity fr=sw=1120; gates clean; build green | Phase-0 commands |

## Candidate work items (Eston picks; do NOT start all)

1. **In-app language switcher** (S17 Thandiwe finding, major; smallest item): add a
   LanguageSwitcher entry to the slide-out menu (or Profile). Product call on placement —
   recommend-then-confirm.
2. **Chichewa `ny.ts`** (P5 tail): new locale at full key parity + LanguageSwitcher entry;
   needs a native-review plan like fr/sw.
3. **Wave-1.5 refactor lanes** (archive prompts exist): pick ONE lane; pure refactor, no
   behavior change; grep-gate + build + preview-walk verification.
4. **D3 liquid delegation** (P6, biggest): needs a full spec + Eston decisions first; check
   §6 boundaries (no full liquid-democracy depth).
5. **Coordination-driven work** arriving from Ouri's derivation (seam questions, FOR_OURI
   clarifications) — these outrank the list above when they arrive.

## Constraints

- If the handoff is in flight, prefer items that DON'T churn files Ouri is actively deriving
  from (docs-only or additive work) — confirm with Eston.
- All standing gates apply: docs-first spec/plan, per-chunk `tsc -b`, review before push,
  Eston's explicit push green light (push = production deploy).
