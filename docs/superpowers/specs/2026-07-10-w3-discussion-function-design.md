# W3 — Discussion-as-function + redundancy removal (design)

**Session:** S26 · 2026-07-10 · branch `ui` @ `1b03eb1`
**Campaign:** `docs/ui-polish-campaign-2026-07.md` §3 Wave 3, §5 rules 10/19/20, §6 taste calls 8–9.
**Goal (one sentence):** kill every UI holdover that makes Discussion read as a 5th pipeline
stage, and remove the duplicate controls/back-arrows/labels the campaign flagged — WITHOUT
adding a Discussion stage or feed (locked: Discussion is a function, not a stage).

## Eston's locked decisions (2026-07-10, batched recommend-then-confirm)

1. **Pill reframe (§6 #9 + S25 border leftover):** label is always "Discussion" + live count;
   the dark border stays as-is (text carries AA 4.74:1; the loud active skin goes away).
2. **Extra "In discussion" instances (found in re-grounding, §5 rule 10):** remove the
   stage-feed compact-card badge AND fold HomeView's "In discussion" section into "Problems"
   (mirrors the existing stage-feed rule — Eston 2026-07-04 — that discussion-stage items
   surface in the Problem feed; that surfacing stays).
3. **Support-CTA wording (§6 #8):** Currency panel title → "Send points", button → "Send";
   mandate individual CTA → "Back this mandate"; org CTA → "Add your organization".
4. **3.6 mechanism:** write-together sub-views become URL-addressable via search params
   (S23 precedent: expansion lives in the URL). No new top-level routes.

## Re-grounded premises (verified vs HEAD `1b03eb1`)

- W2 was pushed; tree clean; `ui` == `origin/ui`.
- "In discussion" lives in THREE places: `DiscussionPill.tsx:66`, `StageFeedView.tsx:106`
  (badge), `HomeView.tsx:86` (`home.discussions` section title).
- `STAGE_META.discussion` is directly dereferenced at `StageFeedView.tsx:87` — card consumers
  use `|| STAGE_META.problem` fallbacks, so the entry can be deleted only together with the
  StageFeedView fix.
- The Discussion admin-permission row is generated from `PIPELINE_STAGES`; the permission is
  LIVE (DiscussionStageView gates thread participation on it, default `members`). Dropping the
  row freezes the rule at its stored/default value — presentation-only, no contract change.
- `SAMPLE_FEED` (CommunityHome) and `SAMPLE_INITIATIVES` are component constants, not demo
  fixtures → **no DEMO_VERSION bump**.
- VotePreview does NOT explain the QV mechanism — deleting VoteExplainer outright would strip
  S11's pre-gate auditability for gated-out users. The duplicate exists only for participants.

## Design, per item

### 3.1 DiscussionPill reframe
Drop the `active` prop entirely (label, tone, and skin no longer key on
`post.stage === 'discussion'`). Label is always `t('stage.discussionPill', 'Discussion')`;
the live comment count stays. Consumers stop passing `active`:
`InitiativeStageCard.tsx:186`, `FeedEngagePanel.tsx:207`. Remove the `.active` skin from
`DiscussionPill.module.scss`. Key `stage.discussionPillActive` retires from fr/sw.

### 3.2 Stage badge removal
Delete the `discussion` entry from `STAGE_META` (`stageMeta.ts:14`). Card consumers
(`InitiativeStageCard:85`, `ActivityCard:139`, `CommunityHome:218`) fall back to the Problem
badge — correct framing: an initiative in the Problem→Solutions gap is still a problem, being
discussed. In `StageFeedView`: remove the `inDiscussion` badge block + `STAGE_META.discussion`
deref (the `panelStage` remap and the problem-feed inclusion rule stay). If `stage.discussion`
has no remaining consumers it retires from fr/sw.

### Extra instance: HomeView section fold
Remove the `discussion` entry from `SECTIONS`; group discussion-stage initiatives under
`problem` in `realByStage` (and the sample reshaping inherits the same fold). `ActiveStage`
type drops `'discussion'`. Key `home.discussions` retires. Problems keeps `limit: 3`.

### 3.3 Sample feed + settings row
`SAMPLE_FEED` s2 (Ocean Plastic Pollution) → `stage: 'problem'` (it reads as a problem
statement). `CommunitySettings` renders `PIPELINE_STAGES.filter(s => s !== 'discussion')`
(the `STAGE_LABEL` Record stays complete — the type requires all keys; stored perms still
round-trip all 5 stages unchanged).

### 3.4 Duplicate discussion button (Problem card)
Remove the "Discuss this problem" secondary Button from `ProblemEngage.tsx:90-92`; the chin's
DiscussionPill is the single entry. Keep "Send suggestion to author". Retire
`card.discussProblem` + the dead `openDiscussion`/`MessageCircle` locals.

### 3.5 Duplicate on the Discussion card
Remove `onOpen`/`openLabel` from `DiscussionActivityCard`'s InitiativeStageCard usage
(→ pill-only chin, the Solution/Vote cards' look) + the dead `openDiscussion`/`useNavigate`.
`deliberation.discussion.open` retires if orphaned.

### 3.6 Write-together back arrows → URL-addressable sub-views
`WriteTogetherPage` view state moves to a search param: `?draft=new` (start form),
`?draft=<id>` (editor), absent (list).
- "Start a draft" → push `?draft=new`. `onStarted` → `setSearchParams({draft: id},
  {replace: true})` so back from the editor skips the spent form.
- Opening a draft from the list → push `?draft=<id>`.
- The S23 header back (`backTo` history-pop) now returns editor → list naturally; hardware
  back matches. Deep-linked sub-views (location.key === 'default') fall back to the section's
  existing hierarchy fallback.
- `StartDraftForm`: back arrow replaced by a labeled ghost **Cancel** (§5 rule 19) that pops
  history (with a clear-params fallback for deep links). `DraftEditor`: back arrow removed,
  `onBack` prop retired; list refresh happens via an effect when the param clears.
- Dead `.back` rules removed from both module.scss files.

### 3.7 Vote explainer dedupe
`VoteEngage` renders `<VoteExplainer />` only in the `!canVote` branch (above VotePreview).
Participants get the ballot's own "How hearts work" toggle; gated-out visitors keep the S11
pre-gate mechanism explainer. No key changes.

### 3.8 Support-CTA vocabulary (§5 rule 20)
Same keys, new defaults + fr/sw updates:
- `currency.sendTitle`: 'Send Support' → 'Send points'
- `currency.sendButton`: 'Send Support' → 'Send'
- `mandate.card.showSupport`: 'Show your support' → 'Back this mandate'
- `mandate.adoptCta`: 'Endorse / adopt' → 'Add your organization'

## i18n impact (gloki-i18n-playbook ritual applies)

- **Retired keys** (delete from fr+sw, annotate packet): `stage.discussionPillActive`,
  `home.discussions`, `card.discussProblem`, and — pending consumer greps —
  `deliberation.discussion.open`, `stage.discussion`.
- **Changed defaults** (update fr+sw in the same commit): the four §3.8 keys.
- **New keys:** none anticipated.
- Parity scanner before (OK, fr=sw=1135) and after; packet gets a "Session 26" section.

## Out of scope (flagged, not built)

- HowGlokiWorks / InitiativeStagePanel / CreateInitiativePage 5-step journey copy — journey
  description, not status UI; onboarding copy is its own taste call.
- W4 ContextCard, W5 kit sweep, W6 chrome. No Discussion feed/stage/route (locked IA).
- The `'discussion'` DATA stage (StageAdvanceBar order, InitiativeStageStrip 0.5 position,
  FeedEngagePanel pill-only engage) is the data model, not a holdover — untouched.

## Verification

`npx tsc -b` + `npm run build`; preview walk at 360px light+dark (reload after colorScheme
flip) of: stage feed (problem feed with a discussion-stage item), community feed cards,
Home sections, community settings, write-together (list→form→editor→back), vote card as
participant + gated-out, currency page, mandate page. i18n parity scan + fr spot-check at
360px. One h1 per route. Adversarial whole-branch review before the push gate.
