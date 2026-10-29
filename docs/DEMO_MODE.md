# One app, two states per page

**Status: introduced on branch `unified` (2026-10-29).** This replaces the old split, where the
`ui` branch was the app on stubs and `server-side` was the app on real servers. Until `unified`
becomes the trunk (`main`), `server-side` and `ui` keep deploying as before; see
[Branches and deployment](#branches-and-deployment).

## The idea

There is one app, and its base is the **real** network. Every page can also have a **demo
variant**, chosen per URL:

```
/identity/communities             the real page, on real data
/identity/communities?demo=true   the same page's demo variant, on demo data
```

Two people work on the same code, on the same trunk:

- **Eston** designs a new page or feature as a demo variant, on demo data, on top of the working
  real app.
- **Ouri** builds the real side against the same UI.
- Both compare the two states side by side (two tabs: one with `?demo=true`, one without).
- When Eston is happy, the demo variant is removed by hand.

A page without a demo variant ignores the flag and always shows real data. Nothing is
remembered: the flag lives only in the URL, so each tab and each link decides for itself.

## How a page with two states looks

```tsx
// Communities.tsx — the page's default export is the switch
const Communities: React.FC<Props> = (props) =>
  useDemoMode() ? <CommunitiesDemo {...props} /> : <CommunitiesReal {...props} />;
```

- `CommunitiesReal` lives in the page's own file and reads real data through `src/services/`.
- `CommunitiesDemo` lives next to it in **`Communities.demo.tsx`** and reads demo data through the
  demo layer (`src/services/demo/`).
- The switch picks a whole component. Don't branch on `demo` inside one component: hooks can't be
  called conditionally, and two whole variants are easy to compare and to delete.

The pieces (all in `src/`):

| Piece | Where | What it does |
|---|---|---|
| `useDemoMode()` | `hooks/useDemoMode.ts` | `true` when the URL has `?demo=true` |
| `useDemoLink()` / `withDemo(path)` | `hooks/useDemoMode.ts` | adds `?demo=true` to a link, so a demo variant's links stay in demo |
| `<DemoNotice />` | `components/shared/DemoNotice.tsx` | the banner every demo variant shows first, with a "Show real data" link |

## Rules

1. **A demo variant never reaches the network.** It reads and writes only through
   `src/services/demo/` (fixtures, mock contracts, browser storage). A real variant never uses the
   demo layer. File names make this checkable: in new code, only `*.demo.tsx` files import
   `services/demo`. (Older code still imports it for the id-based routing described under
   [Transition](#the-data-layers); that goes away page by page.)
2. **Demo data uses demo ids** (`demo-…`, from the demo layer). Both variants share the Redux store
   and some browser storage (starred/hidden communities, the flow-contract cache), all keyed by
   id. Because demo ids and real ids never overlap, the two states can't overwrite each other, even
   in two tabs at once. A reload does **not** clean up mixed data in browser storage, so keeping
   the ids apart is the only protection; don't rely on reloading.
3. **Links inside a demo variant keep the flag** (`useDemoLink()`); links in shared chrome (menu,
   header, footer) don't, so there is always a way back to real. A link may lead to a page that has
   no demo variant yet; that page then shows real data (see [Pages](#pages-and-their-state)).
4. **The flag covers the page's content, not the frame.** The header, menu, footer and the
   signed-in identity are real in both states.
5. **Every demo variant shows `<DemoNotice />` first** and lives in a `*.demo.tsx` file, so it is
   never mistaken for real and a cleanup is one search (`git ls-files '*.demo.tsx'`).

## A feature's life

1. **Eston** branches from the trunk, writes `Page.demo.tsx` (and any demo fixtures or stubs it
   needs in `src/services/demo/`), and adds the switch to the page. He merges back. The real page
   is unchanged; `?demo=true` shows the new design.
2. **Ouri** branches, builds the real side in `src/services/` and the page's real variant against
   the same UI, and merges back.
3. **Both** compare `/page` and `/page?demo=true`.
4. **Cleanup, by hand, once Eston is happy:** delete `Page.demo.tsx`, the switch, and any demo
   fixtures nothing else uses.

## The data layers

| Layer | Where | Used by |
|---|---|---|
| Real services | `src/services/api.ts` (`*OnChain`, routed `contractRead`/`contractWrite`), `src/services/contracts/`, `verificationRegistry.ts`, `applicationSettings.ts`, `contractHosts.ts` | real variants |
| Real contracts | `gloki_engage_community_contract.py`, `gloki_engage_initiative_contract.py`, `digital_agent_contract.py`, `gloki_verification_contract.py`, `gloki_engage_application_settings.py` | the real network |
| Demo layer | `src/services/demo/` (mock contracts, fixtures, personas, `DEMO_VERSION`) | demo variants |

**Transition.** Pages that have no demo variant yet still mix the two the old way: `contractRead`
and `contractWrite` send any `demo-…` id to the demo layer (`isDemoContract`), and `getContracts`
adds the seeded demo communities to the real list. That id-based routing is what each page's
two-state split replaces; remove it once no page needs it.

## Pages and their state

`2 states` = has a demo variant. The other columns describe what the single version shows today.

| Path | State |
|---|---|
| `/identity/communities`, `/identity/hidden` | **2 states.** Real: your gloki-engage communities. Demo: the seeded demo communities. |
| `/`, `/stage/:stageId` | mixed: real and demo issues together |
| `/community/:communityId` (feed), `…/members` | mixed by id |
| `/initiative/…/:initiativeId`, `…/discussion`, `/mandate/:communityId/:mandateId` | mixed by id |
| `/welcome/*`, `/identity/profile`, `/identity/join`, `/identity/verification`, `…/request`, `…/approve`, `/create-community`, `/community/:id/create-initiative`, `/community/:id/identity` | real only |
| `/community/:id/collab`, `collab/:collabId`, `chat`, `chat/:topicId`, `currency`, `settings`, `write-together`; `/identity/verification/invite`, `call`, `daily`; `/identity/notifications`; `…/:initiativeId/suggest`, `…/collaboration`; `/organization`; `/forum` | demo only: no real server methods yet |
| `/identity/about`, `/identity/contact`, `/lab/presence`, not-found, redirects | no data |

Convert the mixed pages first: their mixing is what the split removes. A demo-only page becomes two
states when its real side is built; until then its demo version simply stays as it is.

## Separate from the beta trim

The beta (sign-up, keys, verification, one forum) is a **build** setting, `VITE_APP_MODE=beta`
(`npm run dev:beta`, `npm run build:beta`), read only in `src/appMode.ts`. It hides parts of the
app; it doesn't change where data comes from. `?demo=true` works the same in both builds.

## Branches and deployment

- **Trunk:** `unified`, to become `main`. Work happens on short feature branches off it, merged
  back continuously; `?demo=true` variants keep the trunk usable while a feature is half done.
- **Retiring:** `server-side` and `ui`. Until the switch, GitHub Pages still builds from them
  (`.github/workflows/deploy.yml`: `server-side` with `build:prod` at the site root, `ui` with
  `build:beta` at `/demo/`). A push to `unified` doesn't deploy. Pointing the workflow at the trunk
  is part of the switch.
- **Settings:** `.env` holds the required `VITE_APPLICATION_SERVER_URL` / `VITE_APPLICATION_AGENT`
  (the central application account); `.env.local` and the `github-pages` environment variables
  override them; `vite.config.ts` refuses to build without them.
