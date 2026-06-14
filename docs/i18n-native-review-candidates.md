# fr / sw native-speaker review — candidate list

**Status:** open · **Owner:** (assign a native fr + a native sw reviewer) · **Created:** Batch 14 (2026-06-14)

The French and Swahili UI overlays (`src/i18n/fr.ts`, `src/i18n/sw.ts`) were **model-translated**.
They are live, verified for layout (360px, light + dark, no `{token}` artifacts) and at **full key +
`{var}` parity** with each other. What they have **not** had is a human native-speaker pass for register,
idiom, and civic-vocabulary consistency. This doc is the **scoped** worklist for that pass — it lists the
least-reviewed key families and the specific concern per family, rather than dumping all ~859 keys.

> Scope note: this is *not* a request to rewrite the overlays wholesale. They read correctly. The goal is a
> targeted polish pass on the families below plus the two cross-cutting decisions (sw vocab consistency, fr
> register). If a string here is already good, leave it.

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
| proposal | **pendekezo** | 11 |

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

## How to deliver fixes

Edit `src/i18n/fr.ts` and/or `src/i18n/sw.ts` in place. Keep keys and `{var}` tokens identical across the
two files. Run the parity scanner (`RESULT: PARITY OK`) and a 360px fr/sw layout spot-check on any touched
screen. Small commits per family are easiest to review.
