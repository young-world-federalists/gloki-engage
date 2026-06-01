# Archive

Docs kept for reference but **not** part of the active `ui` (UI-only) branch workflow.
They describe the full backend system or completed migrations.

- `PRD.md` — product requirements for the full decentralized system (backend + contracts).
- `SDD.md` — full system / software design (frontend + services + contracts + SSE). Superset of CLAUDE.md/ARCHITECTURE.md; the authoritative contract-API description lives here.
- `SSE_EVENT_SYSTEM.md` — Server-Sent Events real-time sync (backend contract).
- `REDUX_MIGRATION.md` — historical Redux Toolkit migration guide (migration complete).
- `TESTING_GUIDE.md` — superseded by the "No test framework — verify in browser" note in `CLAUDE.md`.
- `UI_TASKS.md` — empty stub.

The live UI branch builds against the `src/services/demo/` stub layer; backend/contract
detail (PRD/SDD/SSE) is Ouri's track and reaches the app via the `new-features` branch.
