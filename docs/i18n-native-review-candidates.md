# fr / sw native-speaker review — candidate list

**Status:** open · **Owner:** (assign a native fr + a native sw reviewer) · **Created:** Batch 14 (2026-06-14)
· **Last verified against HEAD `27f24b3`:** 2026-06-29 (parity OK, fr = sw = 1032 keys; stale references
struck through — see the Reviewer quick-start below)

The French and Swahili UI overlays (`src/i18n/fr.ts`, `src/i18n/sw.ts`) were **model-translated**.
They are live, verified for layout (360px, light + dark, no `{token}` artifacts) and at **full key +
`{var}` parity** with each other. What they have **not** had is a human native-speaker pass for register,
idiom, and civic-vocabulary consistency. This doc is the **scoped** worklist for that pass — it lists the
least-reviewed key families and the specific concern per family, rather than dumping all ~859 keys.

> Scope note: this is *not* a request to rewrite the overlays wholesale. They read correctly. The goal is a
> targeted polish pass on the families below plus the two cross-cutting decisions (sw vocab consistency, fr
> register). If a string here is already good, leave it.

---

## Reviewer quick-start — read this first

**Verified against `ui` HEAD `27f24b3` (2026-06-29):** key parity is clean — `fr.ts` and `sw.ts` each hold
**1032 keys** with identical key sets and matching `{var}` tokens (`RESULT: PARITY OK`). `en.ts` is the small
70-key base; everything else is the inline-default fallback (see Ground rule 3). The families below were
auto-checked against HEAD: every key the worklist still asks you to review **exists in the live overlays**,
*except* the small set of keys retired since this doc was first written — those are now struck through and
labelled **[removed]** / **[relocated]** inline so you don't hunt for them.

**Where to spend your time (highest signal first):**

1. **The two cross-cutting decisions** (bottom of this doc) are the most leveraged — decide each *once*,
   then apply consistently:
   - **sw — one term per concept** (Cross-cutting decision 1). The biggest machine-translation risk. Confirm
     the canonical-term table, with special attention to the **Suluhisho** noun-class concord (the Wave 2a
     lexical swap that may have left wrong agreement).
   - **fr — register & inclusive writing** (Cross-cutting decision 2): confirm **vous** throughout, and pick
     one house style for *écriture inclusive* (currently standard forms, no midpoints).
2. **Swahili noun-class agreement** — the recurring error class. Concentrated in: `communities.*`
   (jumuiya / mpango concord), the three `*.howItWorks` subject prefixes, `stage.pipelineOverview`,
   `mechanisms.approval.*` + `mechanisms.qv.*` (the *suluhisho* concord), and
   `problems.thresholdHintShort`.
3. **The named S6 doubts** (Session 6 section): sw `mandate.card.viewLess` = *Tazama chache* ("see fewer"
   for a collapse control), sw `mandate.card.jurisdictionLabel` = *Mamlaka* (authority vs. territory), and
   the fr `mandate.card.reachNote` phrasing/apostrophe.
4. Everything else is per-family polish — work top-to-bottom through the sections as time allows.

**Keys retired since this list was written (do NOT review — they no longer exist):**

| cited key(s) | status |
|---|---|
| `dashboard.stage.{proposals,vote}.desc`, `dashboard.proposals.summary.*` | **[removed]** — the dashboard pipeline view was retired |
| `pipeline.hint.{proposals,vote}` | **[removed]** — PipelineView deleted |
| `currency.explainerBody1` | **[removed]** |
| `country.quickAdd` | **[removed]** — only `country.add` / `country.remove` / `country.other` remain |
| `region.*` (africa/asia/americas/europe/oceania) | **[relocated]** — continent labels now live in `src/utils/regions.ts` as data, not i18n keys; the only live region-label key is `mechanisms.qv.regionOther` |
| `discussionFlow.category.solutions` | **[superseded]** — review `deliberation.category.solutions` instead (= fr *Idées* / sw *Mawazo* / en *Ideas*); it still exists and carries the "Ideas" category |

> To re-verify parity after any edit, run the scanner (recreate it per Ground rule 4 if missing) and confirm
> `RESULT: PARITY OK`.

---

## Ground rules for the reviewer (do not break these)

1. **Keep fr and sw at identical key sets.** Never add a key to one without the other. The two overlays
   must stay parallel.
2. **Never change the `{var}` tokens** inside a string (e.g. `{error}`, `{count}`, `{name}`). They are
   interpolation slots — the surrounding words may move around them, but the token text must stay exactly
   `{error}` etc., and every token present in a string must remain present.
3. **Don't worry about English.** `en.ts` intentionally does **not** contain most feature keys — English is
   the inline default in each component, resolved via the `active → en → inline default → key` fallback in
   `src/i18n/index.tsx`. So you are editing **only** `fr.ts` and `sw.ts`. The "Intended meaning" column
   below is the English gloss to translate against.
4. **After editing, re-run the parity scanner** and confirm `RESULT: PARITY OK`:
   ```
   node /tmp/i18ncheck_b12.mjs "$(pwd)"
   ```
   (If `/tmp` was cleared, the scanner is trivial to recreate — it parses single-line `'key': 'value'`
   entries from `en/fr/sw.ts`, diffs the fr↔sw key sets, and compares the `{var}` set per shared key.)
5. **Then layout-check** the touched screens at 360px in `fr` and `sw` (`localStorage.setItem('gloki.locale','fr')`,
   reload). Longer strings must not clip or overflow buttons.

---

## Priority families (newest, least-reviewed — Batch 12 + Batch 13 additions)

### ⚑ Proposals → **Solutions** rename (Wave 2a, 2026-06-20) — sw needs an agreement pass

The "Proposals" pipeline stage was relabelled **Solutions** app-wide (label-only; the contract id /
stage key stays `proposals`). Per-locale terms, **decided by Eston 2026-06-20**:

- **fr** → **Solutions** (clean noun swap; "Propositions" → "Solutions").
- **sw** → **Suluhisho** (Eston chose *Suluhisho* over *Suluhu*). ⚠️ **This was a lexical swap**
  (`Mapendekezo`/`pendekezo` → `Suluhisho`) that preserved the surrounding words, so **noun-class
  agreement may now be wrong** and needs a native fix. Examples to check: `dashboard.stage.proposals.desc`
  ("Suluhisho **yanawasilishwa**…"), `mechanisms.approval.noResults` ("Suluhisho **za** kuonyesha…"),
  `mechanisms.qv.*`. `mandate.recapPropose*` already used the **zi-/za-** concord for *suluhisho* — make
  the rest consistent with whichever class is correct.
- Affected keys (live): `nav.proposals`, `stage.proposals`, `home.proposals`, `stagefeed.{sample.proposals,
  proposals.info, discussion.info, vote.info}`, `initiative.stages.{proposals,vote,mandate}.desc`,
  `deliberation.proposals.error`, `mechanisms.approval.*`, `mechanisms.qv.*` (the votable-item words), plus
  the `createCommunity.why.mandates.body` prose mention.
- ~~`dashboard.stage.{proposals,vote}.desc`, `dashboard.proposals.summary.*`,
  `pipeline.hint.{proposals,vote}`, `currency.explainerBody1`~~ **[removed]** — these were retired with the
  dashboard pipeline view; skip them.
- **Category collision:** the discussion-board "Solutions" *category* was renamed to avoid clashing with
  the stage — **fr Idées · sw Mawazo · en Ideas** (`deliberation.category.solutions`; the old
  `discussionFlow.category.solutions` duplicate is **[removed]**; internal key stays `solutions`). Confirm
  *Mawazo* reads as "Ideas".
- **Intentionally NOT renamed** (stay `pendekezo`/`proposition`): the **Merge** feature
  (`deliberation.merge.*`, `collab.tabMerges`), `collab.tabSuggestions` (edit *suggestions*), and the
  *propose* verb (`pendekeza`, `proposer`). Confirm these read as distinct from the Solutions stage.

### `join.*` — the Join-a-Community screen (Batch 13, 14 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `join.intro` | Pour rejoindre une communauté, demandez à un membre de partager son QR code d'invitation ou son identifiant JSON. Vous pouvez scanner le code ou coller le JSON ci-dessous. | Ili kujiunga na jumuiya, mwombe mwanachama ashiriki msimbo wa QR wa mwaliko au kitambulisho cha JSON. Unaweza kuchanganua msimbo au kubandika JSON hapa chini. | To join a community, ask a member to share their invite QR code or JSON ID. You can scan the code or paste the JSON below. |
| `join.scannerPlaceholder` | Espace réservé du scanner de QR code | Nafasi ya kichanganuzi cha msimbo wa QR | QR code scanner placeholder |
| `join.scanQr` | Scanner le QR code | Changanua msimbo wa QR | Scan QR Code |
| `join.joining` | Connexion… En attente de confirmation | Inajiunga… Inasubiri uthibitisho | Joining… Waiting for confirmation |
| `join.resetting` | Réinitialisation… | Inaweka upya… | Resetting… |
| `join.cta` | Rejoindre la communauté | Jiunge na jumuiya | Join community |
| `join.manualTitle` | Saisie manuelle | Kuweka kwa mikono | Manual input |
| `join.manualHelp` | Collez l'identifiant JSON de la communauté qui vous a été partagé. Il doit contenir trois champs : | Bandika kitambulisho cha JSON cha jumuiya ulichoshirikiwa. Kinapaswa kuwa na sehemu tatu: | Paste the community JSON ID shared with you. It must contain three fields: |
| `join.credentialsLabel` | Identifiants de la communauté (JSON) | Vitambulisho vya jumuiya (JSON) | Community credentials (JSON) |
| `join.successTitle` | Communauté rejointe avec succès ! | Umejiunga na jumuiya kwa mafanikio! | Joined community successfully! |
| `join.successBody` | Vous pouvez maintenant accéder à la communauté depuis votre page Communautés. | Sasa unaweza kufikia jumuiya kutoka ukurasa wako wa Jumuiya. | You can now access the community from your Communities page. |
| `join.invalidTitle` | Données de QR code non valides | Data ya msimbo wa QR si sahihi | Invalid QR code data |
| `join.invalidBody` | Les données scannées ne contiennent pas d'identifiants de communauté valides. | Data iliyochanganuliwa haina vitambulisho halali vya jumuiya. | The scanned data doesn't contain valid community credentials. |
| `join.failed` | Impossible de rejoindre cette communauté : {error} | Imeshindwa kujiunga na jumuiya hii: {error} | Couldn't join this community: {error} |

**Specific concerns flagged at handback:**
- fr `join.scannerPlaceholder` — "Espace réservé du scanner de QR code" is faithful but clunky; a native may
  prefer something shorter (e.g. "Zone de scan du QR code").
- sw `join.manualTitle` — "Kuweka kwa mikono" (lit. "to place by hand") — confirm this reads naturally for
  "manual input" vs. an alternative like "Kuingiza mwenyewe".

### `identityCard.*` — the ID-card dialog chrome (Batch 13, 4 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `identityCard.title` | Carte d'identité | Kadi ya utambulisho | Identity card |
| `identityCard.generating` | Génération… | Inatengeneza… | Generating… |
| `identityCard.download` | Télécharger la carte | Pakua kadi | Download card |
| `identityCard.pdfError` | Impossible de générer le PDF : {error} | Imeshindwa kutengeneza PDF: {error} | Couldn't generate PDF: {error} |

> Note: the **downloadable credential card itself** (`IdentityCardSVG.tsx`) is deliberately kept in
> canonical English (Batch 14 decision) — it is **out of scope** for this pass.

### `identityTrust.*` — the Identity & Trust page (Batch 13, 5 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `identityTrust.title` | Identité et confiance | Utambulisho na uaminifu | Identity & Trust |
| `identityTrust.nonMember` | Vous devez être membre de cette communauté pour accéder aux fonctionnalités d'identité. | Lazima uwe mwanachama wa jumuiya hii ili kufikia vipengele vya utambulisho. | You must be a member of this community to access identity features. |
| `identityTrust.intro` | Gloki utilise une toile de confiance pour vérifier les membres de la communauté. En scannant les QR codes des autres et en confirmant leur identité réelle, vous renforcez le réseau de confiance au sein de votre communauté. Plus vous avez de connexions vérifiées, plus la base démocratique de votre communauté est solide. | Gloki hutumia mtandao wa uaminifu kuthibitisha wanachama wa jumuiya. Kwa kuchanganua misimbo ya QR ya kila mmoja na kuthibitisha utambulisho halisi, unaimarisha mtandao wa uaminifu ndani ya jumuiya yako. Kadri unavyokuwa na miunganisho zaidi iliyothibitishwa, ndivyo msingi wa kidemokrasia wa jumuiya yako unavyoimarika. | Gloki uses a web of trust to verify community members. By scanning others' QR codes and confirming their real identity, you strengthen the trust network within your community. The more verified connections you have, the stronger your community's democratic foundation. |
| `identityTrust.myIdCard` | Ma carte d'identité | Kadi yangu | My ID card |
| `identityTrust.scanMember` | Scanner un membre | Changanua mwanachama | Scan member |

**Specific concern:** `identityTrust.intro` is the longest civic paragraph in either overlay and the most
worth a careful read — it sets the tone for the whole trust feature. Check that "toile de confiance" /
"mtandao wa uaminifu" (web of trust) is the term you want, and that "base démocratique" / "msingi wa
kidemokrasia" reads well.

### `collab.flow.*` / `collab.group.*` / `collab.template.*` — collaboration picker (Batch 12)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `collab.flow.approval` | Vote d'approbation | Kupiga kura ya idhini | Approval vote |
| `collab.flow.quadratic` | Vote quadratique | Kupiga kura ya quadratic | Quadratic vote |
| `collab.flow.concerns` | Résolution des préoccupations | Utatuzi wa wasiwasi | Concerns resolution |
| `collab.flow.discussion` | Discussion | Majadiliano | Discussion |
| `collab.flow.roles` | Attribution des rôles | Ugawaji wa majukumu | Role assignment |
| `collab.group.decisionMaking` | Prise de décision | Kufanya maamuzi | Decision-making |
| `collab.group.teamwork` | Travail d'équipe | Kazi ya pamoja | Teamwork |
| `collab.group.planning` | Planification | Kupanga | Planning |
| `collab.template.discuss.label` | Discussion ouverte | Majadiliano ya wazi | Open discussion |
| `collab.template.discuss.description` | Un espace de dialogue communautaire et de décisions partagées | Nafasi ya mazungumzo ya jumuiya na maamuzi ya pamoja | A space for community dialogue and shared decisions |
| `collab.template.project.label` | Projet communautaire | Mradi wa jumuiya | Community project |
| `collab.template.project.description` | Attribuez des rôles et gardez la conversation au même endroit | Gawa majukumu na uweke mazungumzo mahali pamoja | Assign roles and keep the conversation in one place |
| `collab.template.custom.label` | Espace personnalisé | Nafasi maalum ya kazi | Custom workspace |
| `collab.template.custom.description` | Commencez à vide et ajoutez les outils dont votre communauté a besoin | Anza wazi na uongeze zana ambazo jumuiya yako inahitaji | Start empty and add the tools your community needs |

**Specific concern:** these are the civic-action labels users pick from when starting a collaboration —
worth confirming they read like natural product labels, not literal translations. sw
`collab.flow.quadratic` keeps the English loanword "quadratic" — confirm that's acceptable (it is a
technical term of art; there may be no better Swahili rendering).

### `community.reset*` — reset-demo confirmation (Batch 12)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `community.resetTitle` | Réinitialiser la démo ? | Anzisha upya demo? | Reset the demo? |
| `community.resetBody` | Cela efface toutes les interactions de démo et restaure l'état initial. | Hii itafuta mwingiliano wote wa demo na kurejesha hali ya awali. | This clears all demo interactions and restores the initial state. |
| `community.resetConfirm` | Réinitialiser | Anzisha upya | Reset |

---

## Wave 3 additions (2026-06-21) — country widget, communities list, identity titles

New model-translated keys added during Wave 3. Live, layout-verified (360px light/dark), at full fr/sw +
`{var}` parity. The Swahili **noun-class agreement** items are the priority for the pass.

- ~~**`region.*`** (5: africa/asia/americas/europe/oceania) — continent labels for the country
  quick-picks.~~ **[relocated]** — these continent labels are no longer i18n keys; they now live in
  `src/utils/regions.ts` as data and are out of scope for this overlay pass. (The only live region-label
  i18n key is `mechanisms.qv.regionOther`, reviewed in the Session 5 section.)
- **`country.add` / `country.remove` / `country.other`** — CountryMultiSelect chrome. (~~`country.quickAdd`~~
  **[removed]** — the quick-add section label no longer exists.)
- **`communities.*`** (23: the identity communities list/dashboard) — **Swahili noun-class agreement is the
  main concern.** Check the relative/possessive concord with *jumuiya* (N-class) and *mpango / mipango*
  (M/MI-class) in: `communities.hiddenCount.one/.many` (`Jumuiya 1 iliyofichwa` / `Jumuiya {n} zilizofichwa`),
  `communities.unresolvedTitle.one/.many` (`Mpango 1 haukuweza kutatuliwa…` / `Mipango {n} haikuweza…`),
  `communities.mandates.one/.many` (`Agizo 1` / `Maagizo {n}`), and `communities.description`.
- **`join.title`** (`Jiunge na jumuiya`) and **`profile.title`** (`Wasifu`) — page titles; quick confirm.

(These join the existing **Suluhisho** noun-class caveat already tracked under Cross-cutting decision 1.)

---

## Wave 4 + 5 additions (2026-06-21) — "How it works" disclosures + StageStrip overview label

New model-translated keys from the task-first onboarding (Wave 4) and the StageStrip aria-label work
(Wave 5b). Live, layout-verified (360px light/dark), at full fr/sw + `{var}` parity. **The Swahili
noun-class agreement on the three "How it works" strings is the priority for this pass.**

### `*.howItWorks` / `login.help.title` — the (i) disclosure triggers (Wave 4, 3 keys)

These three label the `(i)` "how it works" disclosures on the two create screens and the login screen. All
three sw renderings use the **`jinsi … -vyo-`** manner-relative ("the way X works"); the concern is the
subject concord on the verb.

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `initiative.howItWorks` | Comment fonctionnent les initiatives | Jinsi mipango inavyofanya kazi | How initiatives work |
| `createCommunity.howItWorks` | Comment fonctionnent les communautés | Jinsi jumuiya zinavyofanya kazi | How communities work |
| `login.help.title` | Comment fonctionne Gloki | Jinsi Gloki inavyofanya kazi | How Gloki works |

**Specific concern (sw, priority):** the verb's subject prefix must match its noun class —
`mipango` (MI-class plural → **i-**: "mipango **i**navyofanya"), `jumuiya` (N-class plural → **zi-**:
"jumuiya **zi**navyofanya"), `Gloki` (proper-noun singular thing → **i-**: "Gloki **i**navyofanya").
Confirm each subject prefix is right (these are the agreements Eston flagged). Note `initiative` is rendered
**mpango/mipango** here, consistent with Cross-cutting decision 1 (not *jitihada*).

### `stage.pipelineOverview` — the StageStrip accessible name (Wave 5b, 1 key)

The read-only 5-stage `StageStrip` `<ol>` now has its own accessible name, distinct from the StageFooter
nav's "Pipeline stages" (`nav.stagesLabel`). Screen-reader-only — never shown visually.

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `stage.pipelineOverview` | Les cinq étapes de gouvernance | Hatua tano za utawala | The 5 governance stages |

**Specific concern (sw):** confirm `Hatua tano za utawala` ("five stages of governance") — the `za`
possessive agrees with `hatua` (N-class plural), and `utawala` is the chosen term for "governance" (vs.
`uongozi` "leadership"). Keep it consistent with `nav.stagesLabel` = `Hatua za mchakato`.

---

## Cross-cutting decision 1 — Swahili civic-vocabulary consistency

The biggest risk in a model-translated overlay is the **same English concept rendering as two different
Swahili words** in different screens. Confirm **one term per concept** across all of `sw.ts`. Current
canonical choices and their occurrence counts:

| concept | intended sw term | occurrences in `sw.ts` |
|---|---|---|
| initiative / plan | **mpango** | 23 |
| mandate / order | **agizo** | 28 |
| vouching / sponsorship | **udhamini** | 4 |
| collaboration | **ushirikiano** | 15 |
| vote | **kura** | 54 |
| solution (Solutions stage + votable items) | **suluhisho** | renamed Wave 2a — agreement needs a native pass |
| proposal (merge motions / edit suggestions / "propose" verb only) | **pendekezo** | merge.* + collab.tabSuggestions + verbs |

**Drift to actively check** (greps that returned *more* than the canonical term — confirm the extras are
genuinely a different concept, not the same concept rendered inconsistently):

- **mandate vs. authority vs. approval:** `agizo` (28) but `agizo|mamlaka|idhini` together hit **49**. So
  ~21 uses of *mamlaka* / *idhini*. These may legitimately mean "authority" / "approval/consent" (distinct
  from "mandate") — but verify none of them are a "mandate" that drifted to *mamlaka*.
- **initiative/effort:** `mpango` (23) but `jitihada|mradi|mpango|kampeni` hit **24** — one stray. Confirm
  whether that one is a deliberate "project/effort" (*mradi*/*jitihada*) or a drifted "initiative".
- **vote:** `kura` (54); confirm the verb form is consistently "piga kura" where a verb is needed.

To re-run any of these:
```
rg -ci "\bmpango" src/i18n/sw.ts        # repeat per term
rg -ci "agizo|mamlaka|idhini" src/i18n/sw.ts
```

## Cross-cutting decision 2 — French register & inclusive writing

Two house-style calls a native fr reviewer should make once, then apply consistently:

- **Formality (tu / vous):** the overlay currently uses **vous** throughout (e.g. `join.intro`: "Vous
  pouvez scanner…", `join.manualHelp`: "Collez…"). Confirm vous is the intended register for a civic /
  democratic-participation product (it likely is), and that no string slipped into tu.
- **Inclusive writing (écriture inclusive):** the overlay currently uses **standard forms, no midpoints**
  (e.g. "membres", "vérifiés" — not "membre·s", "vérifié·e·s"). Decide a single house style — adopt
  inclusive midpoints everywhere, or standard forms everywhere — and apply it consistently. (Recommendation:
  pick one and note it here so future strings follow it.)

---

---

## `funds.*` + `community.menu.funds` — Community Funds feature (Task 7 / 2026-06-24, 96 keys)

95 `funds.*` keys + 1 `community.menu.funds` key added at fr/sw parity. Machine-translated. Live at Task 8 verification. Specific concerns for native review:

**Swahili (sw) priority:**
- **`funds.policyTitle`** = "Sera Yako ya Fedha" ("Your Money Policy") — confirm "sera ya fedha" is natural for "monetary policy" in a community-points context (vs. a more colloquial term like "jinsi pointi zinavyozalishwa").
- **`funds.commonsTreasury`** = "Hazina ya Pamoja" — confirm this reads as a shared pool/treasury, not a national treasury.
- **`funds.ptsAbbrev`** = "pti" (points abbreviation) — there is no standard sw short-form; confirm "pti" is acceptable or propose a better abbreviation.
- **`funds.fundsTitle` / `funds.createFund`** = "Mifuko" / "Unda mfuko" — "mfuko" (N-class) is "bag/fund". Confirm the N-class concord is right throughout: "mifuko {n}" for plural.
- **`funds.mintRateLabel` / `funds.commonsMintLabel`** use "uchimbaji" (mining/digging) for minting points — confirm this metaphor reads naturally for digital points, or propose an alternative (e.g. "kuzalisha").
- **`funds.burnRateLabel`** uses "uchomaji" (burning/incineration) — same question; "kupungua" (reduction) might be more intuitive.

**French (fr) priority:**
- **`funds.policyTitle`** = "Votre politique monétaire" — confirm "politique monétaire" reads naturally in a community/civic context (vs. something like "vos préférences de circulation des points").
- **`funds.mintRateLabel`** = "Taux de frappe" — confirm "frappe" (minting/striking) is the right metaphor here, vs. "émission".
- **`funds.burnRateLabel`** = "Taux de combustion" — confirm "combustion" reads naturally for point burning, vs. "destruction" or "déflation".
- **`funds.commonsTreasury`** = "Trésorerie des biens communs" — confirm this phrasing vs. a shorter "Trésor commun".
- **`funds.fundsTitle`** = "Fonds" — unambiguous.

| Concern level | Namespace | Files |
|---|---|---|
| Medium | `funds.*` | `src/i18n/fr.ts`, `src/i18n/sw.ts` |
| Low | `community.menu.funds` | both |

---

## Session 2 (2026-06-26) — thread/DM/CTA strings + reworded discussion keys

New keys added during Session 2 of the design-consistency + card-redesign work. All are best-effort machine
drafts awaiting fr/sw native review. Full key parity confirmed (fr = sw = 954 keys).

### New keys added (Step 1)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `card.discussProblem` | Discuter de ce problème | Jadili tatizo hili | Open the discussion on this problem (card CTA) |
| `card.suggestToAuthor` | Envoyer une suggestion à l'auteur | Tuma pendekezo kwa mwandishi | Send a private suggestion to the initiative author |
| `problems.thresholdHintShort` | Cela devient un problème commun lorsqu'au moins la moitié de votre communauté est d'accord. | Inakuwa tatizo la pamoja pindi angalau nusu ya jamii yako inakubali. | Short threshold hint on problem cards |
| `deliberation.thread.addPlaceholder` | Ajouter à la discussion… | Changia kwenye majadiliano… | Thread composer placeholder |
| `deliberation.thread.comment` | Commenter | Toa maoni | Post a top-level comment |
| `deliberation.thread.reply` | Répondre | Jibu | Reply to a comment |
| `deliberation.thread.replyPlaceholder` | Répondre à {name}… | Mjibu {name}… | Reply composer placeholder |
| `deliberation.thread.delete` | Supprimer | Futa | Delete a comment |
| `deliberation.thread.like` | J'aime | Penda | Like/heart a comment |
| `deliberation.thread.expand` | Afficher les réponses | Onyesha majibu | Expand collapsed reply thread |
| `deliberation.thread.collapse` | Masquer les réponses | Ficha majibu | Collapse expanded replies |
| `deliberation.thread.sortLabel` | Trier les commentaires | Panga maoni | Sort picker label |
| `deliberation.thread.sortTop` | Populaires | Maarufu | Sort by top/popular |
| `deliberation.thread.sortNewest` | Récents | Mpya | Sort by newest |
| `deliberation.thread.continue` | Continuer ce fil ({n}) → | Endelea na uzi huu ({n}) → | Continue reading nested thread |
| `deliberation.thread.back` | Retour à la discussion complète | Rudi kwenye majadiliano kamili | Back to full discussion |
| `deliberation.thread.emptyTitle` | Pas encore de commentaires | Hakuna maoni bado | Thread empty state title |
| `deliberation.thread.empty` | Lancez la conversation sur ce problème. | Anzisha mazungumzo kuhusu tatizo hili. | Thread empty state body |
| `deliberation.thread.count.one` | 1 commentaire | Maoni 1 | Singular comment count |
| `deliberation.thread.count.many` | {n} commentaires | Maoni {n} | Plural comment count |
| `deliberation.discussion.teaser` | {c} commentaires · {p} personnes | Maoni {c} · watu {p} | Discussion teaser on collapsed card |
| `suggest.eyebrow` | Suggestion | Pendekezo | Eyebrow label on DM suggestion page |
| `suggest.author` | l'auteur | mwandishi | Author reference in empty-state copy |
| `suggest.emptyTitle` | Envoyer une suggestion privée | Tuma pendekezo la faragha | Empty-state title on suggestion DM |
| `suggest.empty` | Votre suggestion est envoyée en privé à {name}. | Pendekezo lako litatumwa kwa faragha kwa {name}. | Empty-state body on suggestion DM |
| `suggest.placeholder` | Écrivez votre suggestion… | Andika pendekezo lako… | Suggestion composer placeholder |
| `suggest.send` | Envoyer la suggestion | Tuma pendekezo | Send button on suggestion DM |

### Reworded keys (Step 2)

| key | fr (old → new) | sw (old → new) | Reason |
|---|---|---|---|
| `deliberation.discussion.open` | "Ouvrir l'espace de co-rédaction" → "Ouvrir la discussion" | "Fungua nafasi ya uandishi wa pamoja" → "Fungua majadiliano" | Discussion is now a thread, not a co-authoring panel |
| `deliberation.settingUp` | "Préparation de l'espace de co-rédaction…" → "Préparation de la discussion…" | "Inaandaa nafasi ya uandishi wa pamoja…" → "Inaandaa majadiliano…" | Same — loading state for the threaded discussion |
| `deliberation.empty.body` | "Soyez le premier à co-rédiger une déclaration commune pour ce problème." → "Soyez le premier à donner votre avis sur ce problème." | "Kuwa wa kwanza kuandika pamoja taarifa ya pamoja kwa tatizo hili." → "Kuwa wa kwanza kutoa maoni kuhusu tatizo hili." | Reflects that the empty state is now for commenting, not co-authoring |

**Native-review concerns for Session 2 strings:**

- **fr `deliberation.thread.*`:** most are functional labels. Confirm `J'aime` (like) reads naturally as a comment action vs. a generic "I like" verb (could be `Aimer` as infinitive or `👍` instead). Confirm `Populaires` vs `Les plus populaires` for the sort label.
- **sw `deliberation.thread.*`:** `Toa maoni` is used for both `deliberation.thread.comment` and `deliberation.thread.reply` is `Jibu` — confirm these are clearly distinct in context. `Maarufu` for "popular/top" — confirm this reads as a sorting criterion, not as "famous".
- **sw `suggest.*`:** `Pendekezo la faragha` ("private suggestion") — confirm `faragha` is the right register (privacy/intimacy) for a private DM context. `Andika pendekezo lako…` ("write your suggestion") — natural as a composer placeholder?
- **fr `suggest.author`:** `l'auteur` (lowercase, with elision) — this appears inline in a sentence like "Envoyer une suggestion à {name} / l'auteur". Confirm the case and article choice read naturally in all contexts.
- **sw `problems.thresholdHintShort`:** `pindi … inakubali` — `pindi` ("when/once") with present tense `inakubali` (she/it accepts) — the subject of `inakubali` should be `nusu ya jamii yako` (N-class singular → `i-` prefix). Confirm the agreement is right: "nusu … **i**nakubali".

---

## Session 3 (2026-06-26) — "Write Together" feature (`writeTogether.*` + `community.menu.writeTogether`)

36 new keys added for the co-authoring draft page (Task 12 / Batch S3). All are machine-translated
(fr + sw) and await a native-speaker pass. Full key parity confirmed (fr = sw = 992 keys after this batch).

> **Note:** The 3-word problem-code wordlist (e.g. `brave-otter-river`, shown in
> `writeTogether.pasteCode`) is **intentionally English** — it is a spoken shared code that users
> read aloud to each other, so no per-word i18n keys were created and the wordlist does not need
> translation.

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `community.menu.writeTogether` | Écrire ensemble | Andika Pamoja | Community menu entry for Write Together page |
| `writeTogether.title` | Écrire ensemble | Andika Pamoja | Page heading |
| `writeTogether.subtitle` | Co-rédigez un problème ou une solution, puis soumettez-le au fil. | Andika tatizo au suluhisho pamoja na wengine, kisha liwasilishe kwenye mtiririko. | Page subtitle |
| `writeTogether.emptyTitle` | Aucun brouillon pour l'instant | Hakuna rasimu bado | Empty state title |
| `writeTogether.empty` | Lancez-en un et rédigez-le ensemble. | Anza moja na mliandike pamoja. | Empty state body |
| `writeTogether.startDraft` | Commencer un brouillon | Anza rasimu | CTA in empty state |
| `writeTogether.startHeading` | Commencer un brouillon | Anza rasimu | Form heading |
| `writeTogether.start` | Commencer le brouillon | Anza rasimu | Form submit button |
| `writeTogether.titleLabel` | Titre | Kichwa | Draft title field label |
| `writeTogether.titlePlaceholder` | Un titre clair en une ligne | Kichwa kifupi na wazi | Title field placeholder |
| `writeTogether.bodyLabel` | Premier brouillon | Rasimu ya kwanza | Body field label |
| `writeTogether.bodyPlaceholder` | Rédigez la première version — les autres peuvent suggérer des modifications. | Andika toleo la kwanza — wengine wanaweza kupendekeza mabadiliko. | Body field placeholder |
| `writeTogether.modeLabel` | Type de brouillon | Aina ya rasimu | Draft mode picker label |
| `writeTogether.modeProblem` | Problème | Tatizo | Draft mode option: Problem |
| `writeTogether.modeSolution` | Solution | Suluhisho | Draft mode option: Solution |
| `writeTogether.tagToProblem` | Associer à un problème | Unganisha na tatizo | Tag-to-problem section heading |
| `writeTogether.pickProblem` | Choisissez un problème… | Chagua tatizo… | Problem picker placeholder |
| `writeTogether.problemCodeLabel` | Code du problème | Msimbo wa tatizo | Problem code input label |
| `writeTogether.pasteCode` | ou collez un code · brave-loutre-rivière | au bandika msimbo · brave-otter-river | Problem code input hint (wordlist example intentionally English) |
| `writeTogether.resolveCode` | Trouver | Tafuta | Resolve problem-code button |
| `writeTogether.codeNotFound` | Aucun problème trouvé pour ce code. | Hakuna tatizo lililopatikana kwa msimbo huo. | Error: no problem found for code |
| `writeTogether.chooseCommunity` | Choisissez une communauté… | Chagua jumuiya… | Community picker placeholder |
| `writeTogether.draftingFor` | Brouillon pour | Rasimu kwa ajili ya | Label showing which community the draft is for |
| `writeTogether.forCommunity` | pour {name} | kwa {name} | Community name suffix |
| `writeTogether.taggedTo` | Associé à {title} | Imeunganishwa na {title} | Shows which problem the draft is tagged to |
| `writeTogether.copyCode` | Copier le code du problème | Nakili msimbo wa tatizo | Copy problem code button |
| `writeTogether.discuss` | Discuter de ce brouillon | Jadili rasimu hii | Discuss CTA in draft detail |
| `writeTogether.discussEmpty` | Discutez ensemble de ce brouillon. | Jadilini rasimu hii pamoja. | Thread empty state body in draft |
| `writeTogether.submitTo` | Soumettre à {name} | Wasilisha kwa {name} | Submit draft to community button |
| `writeTogether.alreadySubmitted` | Soumis à {name}. | Imewasilishwa kwa {name}. | Already-submitted status label |
| `writeTogether.statusDraft` | Brouillon | Rasimu | Status badge: draft |
| `writeTogether.statusSubmitted` | Soumis | Imewasilishwa | Status badge: submitted |
| `writeTogether.startFailed` | Impossible de démarrer le brouillon. Veuillez réessayer. | Haikuweza kuanza rasimu. Tafadhali jaribu tena. | Error starting draft |
| `writeTogether.submitFailed` | Impossible de soumettre. Veuillez réessayer. | Haikuweza kuwasilisha. Tafadhali jaribu tena. | Error submitting draft |
| `writeTogether.explainerTitle` | Comment fonctionne l'écriture collective | Jinsi uandishi wa pamoja unavyofanya kazi | Explainer (i) disclosure title |
| `writeTogether.explainerBody` | Rédigez un problème ou une solution en communauté… | Andika tatizo au suluhisho kwa jumuiya… | Explainer (i) disclosure body |

**Specific native-review concerns:**

- **fr `writeTogether.pasteCode`:** "brave-loutre-rivière" is the French translation of the English example wordlist "brave-otter-river" — reviewer should confirm a French speaker would understand this is just an example code placeholder, not a real instruction. If that risks confusion, revert to `brave-otter-river` (the wordlist is English).
- **sw `writeTogether.explainerTitle`:** "Jinsi uandishi wa pamoja unavyofanya kazi" uses the `-vyo-` relative. The subject is *uandishi* (M/U-class singular → **u-**: "uandishi **u**navyofanya"). Confirm the concord is correct.
- **sw `writeTogether.discussEmpty`:** "Jadilini" uses the -ni imperative plural (inclusive). Confirm this reads naturally as an invitation to all readers, not as a command to multiple people.
- **sw `writeTogether.statusSubmitted`:** "Imewasilishwa" (passive perfect, it-has-been-submitted). Confirm this reads as a status label, not a sentence fragment.
- **fr `writeTogether.subtitle`:** "au fil" (to the feed) — confirm "fil" is the right word here vs. "flux".

---

## Session 4 (2026-06-27) — Solutions board + commitments spine (`problems.scope*` + `mechanisms.approval.*` additions)

26 new keys added for the SolutionsBoard feature (solution authoring, commitments, expert review, merge,
metrics). All are machine-translated (fr + sw) and await a native-speaker pass. Full key parity confirmed.

> **Results-tab keys remain live:** `mechanisms.approval.tabResults`, `mechanisms.approval.noResults`,
> `mechanisms.approval.approvalsCount`, `mechanisms.approval.viewToggle`, and
> `mechanisms.approval.tabProposals` are **still referenced by `ApprovalFlow.tsx`** (the collab-registry
> flow) and were NOT removed. They are tracked under the existing Proposals→Solutions rename concern above.

### `problems.scope*` — problem scope badge (2 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `problems.scopeGlobal` | Problème mondial | Tatizo la kimataifa | "Global problem" badge on a problem card |
| `problems.scopeCommunity` | Problème de la communauté | Tatizo la jamii | "Community problem" badge on a problem card |

**Native-review concern:** sw `Tatizo la jamii` — confirm `jamii` reads as "community" in this civic context
(vs `jumuiya`, the established term used elsewhere). If they are equivalent, pick one for consistency.

### `mechanisms.approval.*` — SolutionsBoard additions (24 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `mechanisms.approval.addSolutionCta` | Ajouter une solution à ce problème | Ongeza suluhisho kwa tatizo hili | Primary CTA to add a solution |
| `mechanisms.approval.addSolutionTitle` | Ajouter une solution | Ongeza suluhisho | Modal/panel heading |
| `mechanisms.approval.solutionPlaceholder` | Décrivez votre solution | Eleza suluhisho lako | Solution text field placeholder |
| `mechanisms.approval.addSolutionSubmit` | Ajouter la solution | Ongeza suluhisho | Submit button in add-solution form |
| `mechanisms.approval.commitmentsPrompt` | Qui et quoi doivent changer ? | Nani na nini lazima vibadilike? | Commitments section heading prompt |
| `mechanisms.approval.commitmentsHint` | Indiquez jusqu'à trois engagements. Au moins un. | Orodhesha hadi ahadi tatu. Angalau moja. | Helper text below commitments |
| `mechanisms.approval.commitmentPlaceholder` | Un engagement nécessaire à cette solution | Ahadi inayohitajika kwa suluhisho hili | Commitment field placeholder |
| `mechanisms.approval.expertReviewed` | examiné par un expert | imekaguliwa na mtaalam | Badge label on an expert-reviewed solution |
| `mechanisms.approval.upvote` | Soutenir | Unga mkono | Upvote / support button label |
| `mechanisms.approval.thresholdSolutions` | Solutions soutenues par la moitié de la communauté | Suluhisho zinazoungwa mkono na nusu ya jamii | Threshold indicator: community support |
| `mechanisms.approval.thresholdExperts` | Experts ayant examiné | Wataalam waliokagua | Threshold indicator: expert reviews |
| `mechanisms.approval.requestReview` | Demander un examen par un expert | Omba ukaguzi wa mtaalam | Request-expert-review button |
| `mechanisms.approval.suggestMerge` | Proposer une fusion | Pendekeza muunganiko | Suggest-merge button |
| `mechanisms.approval.mergePickTarget` | Touchez la solution dans laquelle fusionner celle-ci | Gusa suluhisho la kuunganisha hili ndani yake | Prompt shown when picking a merge target |
| `mechanisms.approval.mergeIntoThis` | Toucher pour fusionner dans celle-ci | Gusa kuunganisha ndani ya hili | Per-card label during merge picking |
| `mechanisms.approval.mergeCancel` | Annuler | Ghairi | Cancel merge button |
| `mechanisms.approval.metricsLabel` | Comment nous saurons que ça marche | Jinsi tutakavyojua inafanya kazi | Metrics section heading |
| `mechanisms.approval.metricsPrompt` | Comment saurons-nous que cela fonctionne ? | Tutajuaje kama hili linafanya kazi? | Metrics section prompt |
| `mechanisms.approval.metricPlaceholder` | Un indicateur mesurable | Kipimo kinachoweza kupimika | Metric field placeholder |
| `mechanisms.approval.addExpertReview` | Ajouter un examen d'expert | Ongeza ukaguzi wa mtaalam | Add-expert-review button |
| `mechanisms.approval.submitReview` | Envoyer l'examen | Wasilisha ukaguzi | Submit expert review button |
| `mechanisms.approval.reviewNotePlaceholder` | Une brève note d'examen (facultatif) | Dokezo fupi la ukaguzi (hiari) | Expert review note placeholder |

**Specific native-review concerns:**

- **sw `mechanisms.approval.expertReviewed`:** "imekaguliwa na mtaalam" is a passive perfect participle
  ("has been reviewed by an expert"). It appears as a badge label — confirm this reads naturally as a short
  label vs. a sentence fragment.
- **sw `mechanisms.approval.thresholdSolutions`:** "Suluhisho **zinazoungwa** mkono" — the subject-relative
  concord on `suluhisho` (N-class plural → `zi-`): "Suluhisho **zi**nazo-ungwa mkono". Confirm the
  agreement is correct (the existing noun-class concern for *suluhisho* applies here too).
- **sw `mechanisms.approval.commitmentsPrompt`:** "Nani na nini lazima **vibadilike**?" — `vi-` prefix
  suggests a VI-class subject, but the expected answer is people (`watu`, `nani`) and things. Confirm
  whether `vibadilike` is grammatically acceptable here or whether a different mood/subject is better.
- **sw `mechanisms.approval.mergeCancel`:** "Ghairi" — confirm this is the preferred short form for
  "Cancel" (vs `Kataa` or `Sitisha`). It is also used elsewhere (`writeTogether.*`) so keep it consistent.
- **fr `mechanisms.approval.expertReviewed`:** lowercase "examiné par un expert" — appears as a badge; if
  the component capitalises the first letter automatically, this is fine. Confirm usage context.
- **fr `mechanisms.approval.thresholdSolutions`:** "Solutions soutenues par **la moitié** de la communauté"
  — confirm "la moitié" is the intended phrasing for the 50% threshold (vs. "au moins la moitié" for
  clarity).
- **fr `mechanisms.approval.suggestMerge`:** "Proposer une fusion" — confirm "fusion" is preferred over
  "fusionnement" for a merge action in a civic/democratic UI context.

---

## Session 5 (2026-06-27) — Vote card redesign (`mechanisms.qv.*` additions)

16 new keys added for the redesigned QV (Quadratic Voting) card in the Solutions stage (Task 5 / Session 5). All are machine-translated (fr + sw) and await a native-speaker pass. Full key parity confirmed (fr = sw).

> **Note:** Region names (e.g. "Autre" / "Nyingine") stay English in the source data layer and are **not i18n keys** — they are rendered via lookup in the countries list. The `regionOther` keys below are UI fallback labels only.

### `mechanisms.qv.*` — QV card status, guidance, and metrics (16 keys)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `mechanisms.qv.statusOpen` | Vote ouvert · {n} solutions | Upigaji kura uko wazi · suluhu {n} | Card heading when vote is open |
| `mechanisms.qv.statusVoted` | Vous avez voté | Umepiga kura | Card heading after user has voted |
| `mechanisms.qv.votedSub` | Résultats en direct ci-dessous · le vote ne peut pas être modifié | Matokeo ya moja kwa moja hapa chini · kura haiwezi kubadilishwa | Subheading shown after voting |
| `mechanisms.qv.guide` | Touchez ♥ pour soutenir ce qui vous tient à cœur — répartir vos cœurs coûte moins que de tout miser sur une seule solution. | Gusa ♥ kuunga mkono unachojali — kueneza mioyo yako kwenye suluhu nyingi kunagharimu kidogo kuliko kuirundika kwenye moja. | Voting guidance text |
| `mechanisms.qv.supportUsedPct` | {pct} % de votre soutien utilisé | Asilimia {pct} ya uungaji mkono wako imetumika | Support budget indicator |
| `mechanisms.qv.solutionN` | Solution {i} sur {n} | Suluhu {i} kati ya {n} | Solution card numbering |
| `mechanisms.qv.commitsLabel` | Ce à quoi cela engage ({n}) | Inachojitolea ({n}) | Commitments section heading (with count) |
| `mechanisms.qv.metricsLabel` | Comment nous saurons que ça marche ({n}) | Jinsi tutakavyojua inafanya kazi ({n}) | Metrics section heading (with count) |
| `mechanisms.qv.commitsMetrics` | Engagements et indicateurs | Ahadi na vipimo | Tab label showing both commitments and metrics together |
| `mechanisms.qv.yourVote` | Votre vote | Kura yako | Results card heading showing user's own votes |
| `mechanisms.qv.leading` | en tête | inaongoza | Badge label for leading solution |
| `mechanisms.qv.turnoutLabel` | Participation de la communauté | Ushiriki wa jamii | Turnout section heading |
| `mechanisms.qv.turnoutValue` | {pct} % sur {target} % requis | Asilimia {pct} kati ya {target} zinazohitajika | Turnout percentage display |
| `mechanisms.qv.turnoutNote` | Le vote se termine lorsque {target} % des membres ont participé. | Upigaji kura unakamilika wakati asilimia {target} ya wanachama wameshiriki. | Turnout completion note |
| `mechanisms.qv.regionOther` | Autre | Nyingine | Fallback label if region name is missing |
| `mechanisms.qv.expertReviewed` | examiné par un expert | imekaguliwa na mtaalam | Badge label on expert-reviewed solution |

**Specific native-review concerns:**

- **sw `mechanisms.qv.guide`:** The string uses the imperative "Gusa ♥" ("Touch ♥") — confirm this reads naturally as guidance, not a command. The rest uses `-nchi-` relatives and gerunds (`kueneza`, `kunagharimu`, `kuirundika`) — confirm these convey the intended meaning about cost optimization.
- **sw `mechanisms.qv.solutionN`:** "Suluhu {i} kati ya {n}" — confirm "kati ya" ("out of / among") reads naturally for numbering, vs. "ya {n}".
- **sw `mechanisms.qv.leading`:** "inaongoza" (present progressive, "it is leading") — confirm this reads as a badge label vs. a full sentence. Capitalization choice: lowercase is intentional here.
- **sw `mechanisms.qv.turnoutLabel` / `mechanisms.qv.turnoutNote`:** "Ushiriki wa jamii" (community participation) and "wanachama" (members) — confirm consistency with existing civic terminology. Note "jamii" vs. "jumuiya": here we use "jamii" (kin/community as collective) in the label but "wanachama" (members) in the explanatory note — confirm this reads as parallel, not contradictory.
- **sw `mechanisms.qv.expertReviewed`:** Same concern as Session 4: passive perfect participle used as a badge label. Confirm readability.
- **fr `mechanisms.qv.guide`:** "touchez ♥ pour soutenir ce qui vous tient à cœur" — confirm register and phrasing are natural (imperative in guidance context). "répartir vos cœurs coûte moins" — confirm "coûte" metaphor works for "costs voting hearts" vs. an alternative phrasing.
- **fr `mechanisms.qv.leading`:** lowercase "en tête" — confirm this is the intended short-form badge label for "leading/in the lead".
- **fr `mechanisms.qv.turnoutNote`:** "Le vote se termine lorsque {target} %" — confirm "lorsque" timing language is clear (vs. "quand").

---

## Session 6 (2026-06-28) — MandateCard redesign strings (`mandate.card.*` additions + reachValue update)

9 new `mandate.card.*` keys added for the redesigned MandateCard component (Task 7 / S6). `mandate.card.reachValue` updated to "across" phrasing. 6 orphaned card keys pruned (`decided`, `ratified`, `ratifiedOn`, `mandateValue`, `oneVote`, `readFull`). All machine-translated (fr + sw). Full key parity confirmed (parity diff empty).

| key | en (inline default) | fr | sw | Intended meaning |
|---|---|---|---|---|
| `mandate.card.brand` | Gloki Mandate | Gloki Mandate | Gloki Mandate | Product eyebrow label on the card |
| `mandate.card.problemLabel` | Problem | Problème | Tatizo | Row label for the problem description |
| `mandate.card.viewFull` | View full | Voir en entier | Tazama kamili | Expand link to read the full mandate text |
| `mandate.card.reachValue` | {people} people across {countries} countries | {people} personnes dans {countries} pays | Watu {people} katika nchi {countries} | Reach stat (changed from "·" separator to "across/dans/katika") |
| `mandate.card.reachNote` | over a year of open deliberation | au fil d'une année de délibération ouverte | kwa mwaka mzima wa majadiliano ya wazi | Note below the reach stat |
| `mandate.card.jurisdictionLabel` | Jurisdiction | Juridiction | Mamlaka | Row label for jurisdiction list |
| `mandate.card.viewAll` | View all | Voir tout | Tazama zote | Expand button for jurisdiction list |
| `mandate.card.viewLess` | View less | Voir moins | Tazama chache | Collapse button for jurisdiction list |
| `mandate.card.showSupport` | Show your support | Apportez votre soutien | Onyesha uungaji mkono wako | Primary CTA button on the card |

**Native-review concerns for Session 6 strings:**

- **fr `mandate.card.reachNote`:** "au fil d'une année" uses the right apostrophe (`'`, U+2019). Confirm "au fil d" reads naturally ("over the course of a year") for a civic context, vs. "au cours d'une année".
- **sw `mandate.card.jurisdictionLabel`:** "Mamlaka" means "authority/jurisdiction" — confirm this is the preferred term for listing the territories/regions a mandate covers (vs. "Eneo la mamlaka").
- **sw `mandate.card.viewLess`:** "Tazama chache" is literally "see fewer" — confirm this reads naturally as a collapse control (vs. "Ficha" / hide).
- **sw `mandate.card.showSupport`:** "Onyesha uungaji mkono wako" (show your support/backing) — confirm register is appropriate for a civic endorsement CTA.
- **fr `mandate.card.showSupport`:** "Apportez votre soutien" (bring/give your support) — confirm this reads as a call-to-action vs. stating a fact.

| Concern level | Namespace | Files |
|---|---|---|
| Medium | `mandate.card.*` | `src/i18n/fr.ts`, `src/i18n/sw.ts` |

---

---

## Session 9 / Task 1 (2026-06-30) — claims-honesty copy reconciliation

Five keys changed or added to reconcile the 1p1v↔QV copy, fix the vouch/identity story, and add ballot + composer disclosure lines.

### Changed keys

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `onboarding.rules.equal` | Une personne, une voix — chacun a le même poids, et personne ne peut en acheter davantage. Au moment de voter, vous répartissez cette voix égale sur les sujets qui vous tiennent à cœur. | Mtu mmoja, sauti moja — kila mtu ana uzito sawa, na hakuna anayeweza kununua zaidi. Unapopiga kura, unagawanya sauti hiyo sawa kwenye masuala unayoyajali. | Onboarding Rules step — equal-voice rule now explains 1p1v+QV link |
| `mechanisms.qv.guide` | Chacun ici dispose du même nombre de cœurs. Touchez ♥ pour soutenir ce qui compte pour vous — les répartir entre les solutions coûte moins cher que de tout miser sur une seule. | Kila mtu hapa ana mioyo sawa. Gusa ♥ kuunga mkono unachokijali — kuigawanya kwenye suluhisho mbalimbali kunagharimu kidogo kuliko kuiweka yote kwenye moja. | QV ballot guide — now leads with equal-budget framing |
| `identityTrust.intro` | Gloki s'appuie sur un réseau de confiance pour garantir que la communauté est composée de vraies personnes, pas de robots. En scannant les QR codes des autres, les membres attestent qu'ils savent que vous êtes une personne réelle — sans papiers d'identité ni reconnaissance faciale. Plus vous avez de cautions, plus le socle démocratique de votre communauté est solide. | Gloki hutumia mtandao wa kuaminiana ili kuhakikisha jamii ina watu halisi, si roboti. Kwa kuskani misimbo ya QR ya wenzao, wanachama wanathibitisha kuwa wanakujua wewe ni mtu halisi — bila vitambulisho wala uchunguzi wa uso. Kadiri unavyokuwa na uthibitisho zaidi, ndivyo msingi wa kidemokrasia wa jamii yako unavyokuwa imara. | Identity & Trust page intro — now says social/peer vouch ("no ID papers, no face scan"), not formal identity verification |

### New keys

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `mechanisms.qv.disclosure` | Vos cœurs sont visibles par la communauté et comptés dans le décompte public. | Mioyo yako inaonekana na jamii na inahesabiwa katika jumla ya wazi. | Muted disclosure line on QV ballot — votes are attributable/public in this demo |
| `deliberation.thread.disclosure` | Les commentaires sont publics au sein de la communauté et conservés dans l'historique de la discussion. | Maoni ni ya wazi kwa jamii na yanahifadhiwa kama sehemu ya kumbukumbu ya majadiliano. | Muted disclosure line below thread composer — comments are public and kept |

**Native-review concerns:**

- **fr `onboarding.rules.equal`:** Long rule-list item — confirm it reads as a crisp civic promise, not a paragraph. "Vous répartissez" (present tense, you distribute) — natural for describing a mechanic? "Qui vous tiennent à cœur" — confirm register is appropriately warm/civic.
- **sw `onboarding.rules.equal`:** "Unagawanya sauti hiyo sawa kwenye masuala unayoyajali" — confirm `unayoyajali` (the ones you care about) concord is correct for *masuala* (N-class plural).
- **fr `mechanisms.qv.guide`:** "Chacun ici dispose du même nombre de cœurs" — confirm "dispose de" reads naturally (lit. "has at their disposal"). "coûte moins cher" — confirm this cost metaphor reads well vs. "coûte moins de cœurs".
- **sw `mechanisms.qv.guide`:** "Unachokijali" — confirm `ki-` prefix agrees with `unachokijali` (the thing you care about; ki-class object pronoun). Should this be `unachoyajali` (ya-class)? The object is abstract so confirm the concord.
- **fr `identityTrust.intro`:** "cautions" (vouches/guarantees) — confirm this civic usage is natural (vs. "parrainages" or "attestations"). "socle démocratique" — confirm this reads as "democratic foundation".
- **sw `identityTrust.intro`:** Changed from `mtandao wa uaminifu` (trust network) to `mtandao wa kuaminiana` (network of mutual trust) — confirm the new form is more idiomatic. "kuskani" (to scan) — confirm this is an accepted Swahili loanword form of "scan".
- **fr `mechanisms.qv.disclosure`:** "décompte public" — confirm "décompte" reads as "tally/count" in a voting context (vs. "résultat" or "comptage").
- **sw `deliberation.thread.disclosure`:** "kumbukumbu ya majadiliano" (record of discussion) — confirm "kumbukumbu" reads as an archival record here, not just "memory".
- **fr `deliberation.thread.posted`:** "Commentaire publié" — confirm this reads as a natural screen-reader announcement after posting (vs. "Votre commentaire a été publié").
- **sw `deliberation.thread.posted`:** "Maoni yamechapishwa" — confirm `yamechapishwa` (ya-class passive perfect of *-chapisha* = publish/print) is natural for "comment posted" as an SR live-region announcement; `yametumwa` (sent) may be a more colloquial alternative.

### S9 Task 5 — a11y micro-fixes (2026-06-30)

| key | fr | sw | Intended meaning |
|---|---|---|---|
| `deliberation.thread.likeCount` | J'aime ({count}) | Penda ({count}) | Like button aria-label including the count — screen readers announce "Like (3)" etc. |
| `app.title` | Gloki — Autogouvernance décentralisée | Gloki — Utawala wa Kujitegemea Uliogatuliwa | Document `<title>` set on locale change (WCAG 2.4.2) |
| `mandate.country.one` | pays | nchi | Singular "country" for pluralization in adoption breakdown |
| `mandate.country.other` | pays | nchi | Plural "countries" for pluralization in adoption breakdown |

**Native-review concerns:**

- **fr `app.title`:** "Autogouvernance décentralisée" — confirm this reads naturally as the app's subtitle; "autogouvernance" vs "gouvernance autonome" preference?
- **sw `app.title`:** "Utawala wa Kujitegemea Uliogatuliwa" — confirm "uliogatuliwa" (decentralized, from -gatua) is idiomatic; "uliosambazwa" may be an alternative.
- **fr `deliberation.thread.likeCount`:** "J'aime ({count})" — confirm this reads naturally as a button label when announced by a screen reader with count (e.g. "J'aime (4), appuyé").
- **sw `deliberation.thread.likeCount`:** "Penda ({count})" — confirm this reads as a natural button name for a screen reader announcement.

### S9 — local multi-model panel concord flags (2026-06-30)

A local review panel (qwen3:30b + qwen3:8b, Swahili/French-aware) flagged these specific points on the new
S9 strings for a native speaker to confirm or correct. Treated as candidates, not corrections:

- **sw `onboarding.rules.equal`** ("…masuala unayoyajali"): confirm the relative concord `unayoyajali` agrees
  with `masuala` (ma-/class-6) — a reviewer flagged a possible concord mismatch.
- **sw `mechanisms.qv.guide`** ("…unachokijali"): confirm the ki-/class-7 relative `unachokijali` is the right
  agreement for the intended object ("what you care about").
- **sw `mechanisms.qv.disclosure`**: "jumla ya wazi" for "public tally" — confirm the "tally/count" word choice.
- **fr `mechanisms.qv.guide`**: "dispose du même nombre de cœurs" — confirm register; "dispose de" was flagged
  as possibly over-formal for the audience.
- **`mandate.country.one` vs `.other`**: fr `pays`/`pays` and sw `nchi`/`nchi` are intentionally identical
  (both nouns are invariant for number) — NOT a bug; included only so the reviewer knows it's deliberate.

### S10 — Navigation & IA strings (2026-06-30)

Three new keys from the P1 nav work. The new `{stage}` token in `stage.goTo` interpolates a stage label
(Problem/Discussion/Solutions/Vote/Mandate) — confirm the preposition + word order read naturally for each.

- **fr/sw `nav.browseByStage`** (the reframed global footer caption + aria): fr "Parcourir par étape", sw
  "Vinjari kwa hatua". Confirm it reads as *cross-community discovery* ("browse initiatives by stage"), not
  "advance through the stages".
- **fr/sw `stage.initiativeStripLabel`** (the per-initiative strip's list aria-label): fr "Étapes de cette
  initiative", sw "Hatua za mpango huu". Confirm "mpango" vs "mradi" for "initiative" (kept consistent with the
  existing initiative vocabulary).
- **fr/sw `stage.goTo`** (strip button aria, e.g. "Go to Mandate"): fr "Aller à {stage}", sw "Nenda kwa
  {stage}". Confirm "Aller à" / "Nenda kwa" + the stage label reads naturally for a screen-reader announcement.

---

## S11 (2026-07-01) — Trust, Privacy & Consent (P2)

New/changed strings from the P2 work. The consent copy and the vote-visibility line are trust-sensitive —
they must read as *honest and non-alarming*, and must not over-claim a secrecy or data guarantee.

- **fr/sw `mechanisms.qv.disclosure`** (CHANGED — ballot + read-only preview): now states the vote is
  *attributable, not secret*. fr "…votre vote est attribuable, pas secret.", sw "…kura yako inahusishwa nawe,
  si ya siri." Confirm "attribuable"/"inahusishwa nawe" reads as *"linked to you / visible to your community"*
  without implying surveillance.
- **fr/sw `mechanisms.qv.explainer.*`** (`inline`, `label`, `title`, `equalSay`, `cost`, `conviction`) — the
  "How this vote works" explainer. `cost` contains the quadratic numbers (1→1, 2→4, 3→9); confirm the number
  phrasing and the "goes further than shouting for one" idiom translate naturally (fr "réclamer", sw "kupigia
  kelele"). `conviction` describes support building over time.
- **fr/sw `mechanisms.qv.preview.header`** — "Preview — sign in and get verified to take part." fr "Aperçu —
  connectez-vous et faites-vous vérifier pour participer.", sw "Onyesho la awali — ingia na uthibitishwe ili
  kushiriki." Confirm "get verified" = the web-of-trust verification, not email/identity verification.
- **fr/sw `profile.displayName.label` / `profile.displayName.hint`** — the profile name field, relabelled
  "Display name" with a hint that it's public and may be a pseudonym. Confirm "nom affiché" / "jina la
  kuonyesha" and "pseudonyme" / "jina bandia" are the natural terms.
- **fr/sw `onboarding.consent.*`** (`collectTitle`, `collect.key`, `collect.profile`, `collect.votes`,
  `collect.server`, `pilotNote`, `privacyLink`, `dataLink`, `placeholder`, `agree`) — the non-skippable consent
  screen. `collect.key` = public key; `pilotNote` = "nothing leaves your browser yet"; confirm the tone is
  plain-language and reassuring, and that "placeholders for the pilot" reads as *not-yet-real terms*, not a
  legal disclaimer.

### S12 — evidence & expertise loop (added 2026-07-01)
- **fr/sw `sources.*`** (`urlPlaceholder`, `urlLabel`, `labelPlaceholder`, `labelFieldLabel`, `remove`, `add`)
  — the repeatable citation composer (URL + optional label). Confirm "Lien source" / "Kiungo cha chanzo" and
  "Libellé (facultatif)" / "Lebo (hiari)" read naturally as form-field labels.
- **fr/sw `mechanisms.approval.credentialsPrompt` / `credentialsHint` / `credentialsPlaceholder`** — an
  expert's self-described affiliation on their review (e.g. "Epidemiologist, WHO"). Confirm "qualifications" /
  "sifa" and "rôle et affiliation" / "wadhifa na taasisi" are natural, and the WHO example reads right.
- **fr/sw `mechanisms.approval.assessmentPrompt` / `assessmentPlaceholder`** — the expert's structured
  judgement. Confirm "évaluation" / "tathmini" and "jugement d'expert" / "hukumu ya kitaalamu".
- **fr/sw `mechanisms.approval.authorMetricsPrompt` / `authorMetricsHint` / `authorMetricsLabel`** — indicators
  a solution *author* proposes (distinct from expert-validated). `authorMetricsLabel` ("Indicators proposed by
  the author") is the on-card heading — confirm it reads as author-proposed, not expert-confirmed.
- **fr/sw `mechanisms.approval.sourcesLabel/Hint`, `reviewSourcesLabel/Hint`, `solutionSources`,
  `reviewSourcesHeading`, `expertReviewHeading`** — evidence/source labels + card headings. "Sources" vs
  "Preuves/Ushahidi" (Evidence) are used deliberately (solution sources vs review evidence); confirm both fit.
- **fr/sw `mechanisms.approval.reviewResolved` / `reviewPending`** — carry `{count}` and (resolved) `{names}`.
  reviewResolved = "Review requested by {count} · reviewed by {names}"; reviewPending = "…awaiting an expert".
  Keep the tokens; confirm the middot/dash punctuation is natural.
- **fr/sw `writeTogether.sourcesLabel/Hint`, `deliberation.thread.sourcesLabel`,
  `deliberation.thread.addSources`** — the same sources field on the write-together + comment composers.
  `addSources` is a "+ Add sources" toggle; confirm the "+ " prefix + phrasing.

### S13 — mandate rigor (added 2026-07-01)
- **fr/sw `mandate.statusPending`** — "Pending ratification", the badge on a mandate whose indicators aren't
  yet complete. Confirm "Ratification en attente" / "Inasubiri kuidhinishwa" reads as *not-yet-ratified*, not
  *rejected*.
- **fr/sw `mandate.turnoutLine`** — "{voters} of {eligible} eligible members voted ({pct}%)". Carries three
  tokens; keep them. Confirm "membres sur … ont voté" / "kati ya … walipiga kura" is the natural turnout
  phrasing, and the `%` placement reads right.
- **fr/sw `mandate.verification.title` / `mandate.verification.body`** — the static Sybil-resistance
  statement. **Highest-value review item**: the body must stay honest and match the app's existing
  web-of-trust / one-person-one-vote copy (no ID papers, no biometrics, no face scans, no one can buy
  influence). Confirm "toile de confiance communautaire" / "mtandao wa kuaminiana wa jamii" and the
  biometric/face-scan disclaimers land accurately and don't overclaim.
- **fr/sw `mandate.indicatorPending`** ("Target not yet set"), **`mandate.indicatorBaseline`** ("From
  {baseline}"), **`mandate.indicatorCadence`** ("Measured {cadence}") — the indicator target/baseline/cadence
  render. Confirm "À partir de" / "Kutoka" (baseline) and "Mesuré" / "Hupimwa" (cadence) read naturally with
  the interpolated value.
- **fr/sw `mandate.verifiedAdopter`** ("Verified") / **`mandate.claimedAdopter`** ("Claimed") — the
  endorsement badges. Confirm "Vérifié"/"Déclaré" and "Imethibitishwa"/"Imedaiwa" convey *confirmed* vs
  *self-asserted*, not *approved* vs *rejected*.
- **fr/sw `mandate.ratify.*`** (`title`, `intro`, `target`, `targetPlaceholder`, `baseline`,
  `baselinePlaceholder`, `cadence`, `cadencePlaceholder`, `ready`, `incomplete`, `save`, `saving`, `saved`) —
  the host/expert "Prepare for ratification" panel. `intro` explains the host/expert sets each indicator's
  target/baseline/cadence; confirm "hôte ou expert" / "mwenyeji au mtaalamu" and the placeholders' example
  values read naturally.

---

## Session 14 (2026-07-01) — Offline banner (`connectivity.offlineBanner.*`)

Two new keys for the global `OfflineBanner` (shown app-wide, `role="status"`, only while the browser reports
no connection). Distinct from the pre-existing `connectivity.offline` (SyncBadge's short "Offline" pill) — this
is the fuller banner title + body.

- **fr/sw `connectivity.offlineBanner.title`** — "You're offline". fr "Vous êtes hors ligne", sw "Uko nje ya
  mtandao". Confirm this reads as a neutral status statement, not an error/alarm.
- **fr/sw `connectivity.offlineBanner.body`** — "Some content may not load until you reconnect." fr "Certains
  contenus peuvent ne pas se charger tant que vous n'êtes pas reconnecté.", sw "Baadhi ya maudhui yanaweza
  yasipakie hadi utakapounganishwa tena." Confirm the tone stays reassuring/informational rather than
  implying data loss.

One new key for the Profile page's new preferences section (wraps the `DataSaverToggle`, which reuses
existing `connectivity.dataSaver`/`connectivity.dataSaverHint` strings already reviewed):

- **fr/sw `profile.prefs`** — "Preferences". fr "Préférences", sw "Mapendeleo". Section `aria-label` only
  (not visibly rendered as a heading) — confirm it still reads naturally as an accessible section name.

---

## Session 15 (2026-07-02) — SolutionsBoard recomposition + P5.5 generalization

**New keys (Phase 0 — SolutionsBoard):**
- **fr/sw `mechanisms.approval.progressBacked`** — "solutions backed". fr "solutions soutenues", sw
  "suluhisho zilizoungwa mkono". Short inline stat label under the "progress to vote" count — confirm it
  reads naturally truncated (no verb).
- **fr/sw `mechanisms.approval.progressReviewed`** — "experts reviewed". fr "experts ayant examiné", sw
  "wataalam waliokagua". Same compact-stat context.
- **fr/sw `mechanisms.approval.evidenceReviewToggle`** — "Evidence & expert review ({n})". fr "Preuves et
  examen par un expert ({n})", sw "Ushahidi na ukaguzi wa mtaalam ({n})". Inline expand toggle label with a
  count — confirm the `{n}` placement reads naturally.
- **fr/sw `mechanisms.approval.evidenceToggle`** — "Evidence & indicators". fr "Preuves et indicateurs", sw
  "Ushahidi na viashiria". Same toggle when there are no expert reviews.

**Reframed keys (Phase 1 — P5.5 generalization, VftC/Africa → global):**
- **fr/sw `onboarding.invite.lead`** — now "{name} invited you to Gloki — where people across the world
  decide together what to do about the challenges they share." fr "{name} vous a invité·e à Gloki — où des
  personnes du monde entier décident ensemble quoi faire face aux défis qu'elles partagent.", sw "{name}
  amekualika kwenye Gloki — ambapo watu kote ulimwenguni huamua pamoja la kufanya kuhusu changamoto
  wanazoshiriki." Confirm the neutralized (no campaign/region) invite still feels warm and welcoming.
- **fr/sw `mandate.provenanceLine`** — dropped the youth framing → "Deliberated by {participants} people
  across {countries} countries over {months} months." fr "Délibéré par {participants} personnes dans
  {countries} pays pendant {months} mois.", sw "Limejadiliwa na watu {participants} kutoka nchi {countries}
  kwa miezi {months}." Confirm "personnes"/"watu" read naturally in place of the former "jeunes"/"vijana".

## Session 16 (2026-07-03) — Discussion-as-function + page-model repairs

**New keys (DiscussionPill — the persistent per-initiative Discussion button):**
- **fr/sw `stage.discussionPill`** — "Discussion". fr "Discussion", sw "Majadiliano". Compact pill button
  label beside the 4-stage strip.
- **fr/sw `stage.discussionPillActive`** — "In discussion". fr "En discussion", sw "Katika majadiliano".
  The pill's active state when the initiative currently sits in its discussion phase — confirm it reads as
  a state ("currently being discussed"), not a command.
- **fr/sw `stage.discussionPillCount`** — "{label} — {n} comments" (aria-label). fr "{label} — {n}
  commentaires", sw "{label} — maoni {n}". Screen-reader only; confirm the sw noun-number order.

**New keys (CommunityView loading/not-found branches — previously hardcoded English):**
- **fr/sw `community.loading`** — "Loading community…". fr "Chargement de la communauté…", sw "Inapakia
  jumuiya…".
- **fr/sw `community.notFound.title`** — "Community not found". fr "Communauté introuvable", sw "Jumuiya
  haipatikani".
- **fr/sw `community.notFound.body`** — "The community doesn't exist or hasn't loaded yet." fr "Cette
  communauté n’existe pas ou n’a pas encore été chargée.", sw "Jumuiya hii haipo au bado haijapakiwa."
- **fr/sw `community.notFound.back`** — "Back to Communities". fr "Retour aux communautés", sw "Rudi
  kwenye jumuiya".

**Changed keys (5-stage → 4-stage / count-neutral copy after the Discussion IA change):**
- **fr/sw `stage.pipelineOverview`** — now "The governance stages". fr "Les étapes de gouvernance" (was
  "Les cinq étapes…"), sw "Hatua za utawala" (was "Hatua tano…").
- **fr/sw `howGloki.pointer.body`** — "five steps" → "four steps". fr "Ces quatre étapes…", sw "Hatua hizi
  nne…".
- **fr/sw `createCommunity.feature.governance.desc`** — "5-stage" → staged. fr "Processus démocratique par
  étapes…", sw "Mchakato wa kidemokrasia wa hatua kwa hatua…". Confirm "hatua kwa hatua" (step-by-step)
  carries the intended "staged process" sense.
- **fr/sw `createCommunity.whatBody2`** — same "5 étapes"/"hatua 5" → "par étapes"/"hatua kwa hatua" swap
  inside the longer tools sentence.

---

## Session 17 (2026-07-03) — turnout plain language

**Changed key (QV vote footer):**
- **fr/sw `mechanisms.qv.turnoutValue`** — was "{pct}% of {target}% needed" (fr "{pct} % sur {target} %
  requis", sw "Asilimia {pct} kati ya {target} zinazohitajika"); now plain "{pct}% have voted". fr
  "{pct} % ont voté", sw "Asilimia {pct} wamepiga kura". The `{target}` token moved out of this string
  entirely — the note below it (`mechanisms.qv.turnoutNote`, unchanged) still explains "the vote
  completes when {target}% of members have taken part". Confirm the sw subject agreement ("wamepiga
  kura" with an implicit "wanachama") reads naturally in the compact footer.

---

## Session 18 / Wave 1 (2026-07-03) — create-initiative confirmation

**New key (community feed, one-shot success banner after starting an initiative):**
- **fr/sw `initiative.createdConfirmation`** — "Your initiative was created — it appears at the
  top of the feed as soon as it's ready." fr "Votre initiative a été créée — elle apparaîtra en
  haut du fil dès qu'elle sera prête.", sw "Mpango wako umeundwa — utaonekana juu ya orodha mara
  tu utakapokuwa tayari." Confirm the sw subject: the banner refers to the *mpango* (initiative)
  appearing, not the person — "utaonekana" should read as "it will appear".

---

## Session 19 / Wave 2 (2026-07-04) — vote-card recomposition + identity eyebrow

**Merged/renamed keys (vote ballot — the two per-solution accordions became one fold):**
- **fr/sw `mechanisms.qv.commitsMetricsN`** — "Commitments & metrics ({n})". fr "Engagements et
  indicateurs ({n})", sw "Ahadi na vipimo ({n})". Replaces the removed `commitsLabel`
  ("What this commits to ({n})"), `metricsLabel` ("How we'll know it's working ({n})") and the
  un-counted `commitsMetrics` — one label now covers both lists with a combined count. Confirm
  the sw pairing "Ahadi na vipimo" still reads naturally when the list mixes commitments AND
  indicators.

**New keys (vote ballot header + results):**
- **fr/sw `mechanisms.qv.guideToggle`** — "How hearts work" (the inline expand that now holds the
  hearts explainer + privacy line; open on a user's first ballot, collapsed after). fr
  "Comment fonctionnent les cœurs", sw "Jinsi mioyo inavyofanya kazi". Short button label — check
  it doesn't wrap awkwardly at 360px next to "{pct}% of your support used".
- **fr/sw `mechanisms.qv.regionKeyToggle`** — "Region colour key" (the fold hiding the region
  legend under the results). fr "Légende des couleurs par région", sw "Ufunguo wa rangi za
  maeneo". Confirm sw "ufunguo" (key/legend) is the natural word here rather than "maelezo".

**New key (identity pages eyebrow):**
- **fr/sw `identity.eyebrow`** — "Account" (the small line above the page title on
  Communities/Profile/Join pages). fr "Compte", sw "Akaunti".

**Removed keys (removed from en+fr+sw together):** `stage.goTo` (the stage strip no longer
navigates), `mechanisms.qv.commitsLabel`, `mechanisms.qv.metricsLabel`,
`mechanisms.qv.commitsMetrics`.

---

## How to deliver fixes

Edit `src/i18n/fr.ts` and/or `src/i18n/sw.ts` in place. Keep keys and `{var}` tokens identical across the
two files. Run the parity scanner (`RESULT: PARITY OK`) and a 360px fr/sw layout spot-check on any touched
screen. Small commits per family are easiest to review.
