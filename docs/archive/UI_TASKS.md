I have a list of UI tasks for the Communities2 app. Work through them in order. Read the relevant files before making changes. Run `tsc -b --noEmit` and `vite build` after completing all tasks. Commit and push to `ui` when done.

**1. Communities list — hide toggle visibility**
In the communities grid (likely in `src/pages/IdentityView.tsx` or a component it renders), there's a toggle to hide/show communities but it's not visually obvious. Replace or supplement it with an `EyeOff` icon (from lucide-react) so users can clearly see and tap it. Make sure the icon changes to `Eye` when the community is hidden (to indicate "show again").

**2. Problem stage cards — remove click navigation, relabel vote buttons**
In `src/pages/StageFeedView.tsx`, for problem-stage cards:
- Remove the `onClick={() => handleCardClick(item)}` from the card div so clicking a problem card does nothing (no navigation to the "Step 1 of 5" page).
- Change vote button labels from "Approve X" / "Reject X" to "Problem for me" / "Not a problem for me" (keep the vote counts displayed). Same for sample cards.

**3. Community page — move footer nav inline, remove fixed footer**
In `src/pages/CommunityView.tsx` and `src/pages/CommunityView.module.scss`:
- Move the community nav (Collab, Chat, Currency, Members, Options) from the fixed bottom footer to an inline horizontal row just below the community description/member count and above the activity feed.
- Style it as a compact tab bar (not a fixed footer). Remove the fixed positioning entirely — there should be no footer at all on the community page.
- Adjust body padding since there's no longer a footer to clear.

**4. Collab — diagnose and fix white screen**
Clicking into a collab template from the community collab tab causes a white screen. Investigate `src/components/community/CollabList.tsx` and the `CollaborationPage` it navigates to. Check for missing error boundaries, failed lazy loads, or broken contract reads. The fix might be in the collab flow components or routing. Add error handling so it degrades gracefully instead of going blank.

**5. Chat — diagnose and fix error**
The chat function throws an error when used. Check `src/components/community/chat/ChatTopicList.tsx` and `ChatTopic.tsx`. Likely an issue with the in-memory chat API or missing data. Fix the error and make sure the chat UI loads without crashing.

**6. Profile page — more compact, explain technical fields**
In `src/components/identity/Profile.tsx` and `Profile.module.scss`:
- Make the collapsible "Identity Information" section include brief explanations: "Public Key — your unique identity on the network" and "Server URL — the server hosting your data".
- Keep the layout compact. Don't expand the overall profile size.

**7. Communities list — redesign to single column with details**
In the communities grid component:
- Switch from a multi-column grid to a single-column list layout.
- Each community card should show: name, description (truncated to 2 lines), creation date (if available), member count, and mandate count (if available, otherwise "0 mandates").
- Keep the hide/show toggle (from task 1) visible on each card.

**8. Currency page — redesign with explainer**
In `src/components/community/Currency.tsx` and its styles:
- Add an explainer section at the top explaining the concept: community currency lets members allocate value to initiatives and proposals, creating a transparent resource allocation system governed by the community.
- Redesign the layout to match the app's card-based style (white cards, consistent spacing, proper dark mode support).
