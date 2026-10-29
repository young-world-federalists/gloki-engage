# Community Page & Navigation Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure community pages, replace dialog modals with full onboarding pages, separate Identity & Trust from Members, add tutorial language throughout, and fix visual issues in the Communities list.

**Architecture:** New full-page components replace modal dialogs for Create Initiative and Create Community. Identity & Trust gets its own page extracted from Members. CommunityView removes the redundant inline tab bar. All navigation wired through existing slide-out menus and React Router nested routes.

**Tech Stack:** React 19, TypeScript, SCSS Modules, React Router v6, Redux Toolkit, lucide-react icons

**No test framework** — verify all changes via `tsc -b --noEmit` (type checking) and `npm run dev` (visual).

**Spec:** `docs/superpowers/specs/2026-04-06-community-page-overhaul-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/pages/CreateInitiativePage.tsx` | Full-page initiative creation with 5-stage education |
| `src/pages/CreateInitiativePage.module.scss` | Styles for initiative creation page |
| `src/pages/CreateCommunityPage.tsx` | Full-page community creation with onboarding |
| `src/pages/CreateCommunityPage.module.scss` | Styles for community creation page |
| `src/components/community/IdentityTrust.tsx` | Identity & Trust page (extracted from Members) |
| `src/components/community/IdentityTrust.module.scss` | Styles for Identity & Trust page |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/CommunityView.tsx` | Remove inline tab bar, add menu items (Create Initiative, Identity & Trust), add nested routes |
| `src/pages/CommunityView.module.scss` | Remove `.inlineNav`/`.navTab` styles, add activity feed section header styles |
| `src/components/community/Members.tsx` | Remove Identity & Trust section, add title + description |
| `src/components/identity/Communities.tsx` | Add page title/description, fix icon contrast, add "Create a community" card, navigate to `/create-community` |
| `src/components/identity/Communities.module.scss` | Add title styles, fix star/hide button contrast, add create card styles |
| `src/components/identity/HomepageMenu.tsx` | Navigate to `/create-community` instead of calling `onCreateCommunity` |
| `src/components/community/ActivityHub.tsx` | Navigate to create-initiative page instead of opening dialog |
| `src/components/community/InitiativeList.tsx` | Navigate to create-initiative page instead of opening dialog |
| `src/components/PageHeader.tsx` | Increase EarthFlag from 32px to 40px |
| `src/App.tsx` | Add `/create-community` route |
| `src/pages/IdentityView.tsx` | Remove `onCreateCommunity` prop, navigate to `/create-community` |

---

## Task Dependency Graph

```
Task 1 (EarthFlag)        ─── independent
Task 2 (Remove tab bar)   ─── independent
Task 3 (Create Initiative page) ─── independent
Task 4 (Create Community page)  ─── independent
Task 5 (Identity & Trust page)  ─── independent
Task 6 (Members cleanup)  ─── after Task 5
Task 7 (Communities list)  ─── after Task 4 (needs route)
Task 8 (CommunityView menu + routes) ─── after Tasks 2, 3, 5
Task 9 (Wire navigation)  ─── after Tasks 3, 4, 8
Task 10 (Activity feed header) ─── after Task 2
Task 11 (Build & verify)  ─── after all
```

**Parallel groups:**
- Group A (parallel): Tasks 1, 2, 3, 4, 5
- Group B (parallel after A): Tasks 6, 7, 10
- Group C (sequential after B): Task 8, then Task 9
- Final: Task 11

---

### Task 1: EarthFlag Logo — 32px to 40px

**Files:**
- Modify: `src/components/PageHeader.tsx:53`

- [ ] **Step 1: Increase EarthFlag size**

In `src/components/PageHeader.tsx`, change line 53:

```tsx
// OLD:
<EarthFlag size={32} />

// NEW:
<EarthFlag size={40} />
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`
Check: Homepage header shows a larger EarthFlag logo next to "Gloki" wordmark. The flower-of-life pattern should be clearly visible with spaces between circles.

- [ ] **Step 3: Commit**

```bash
git add src/components/PageHeader.tsx
git commit -m "style: increase EarthFlag logo to 40px in header"
```

---

### Task 2: Remove Inline Tab Bar from CommunityView

**Files:**
- Modify: `src/pages/CommunityView.tsx:363-393`
- Modify: `src/pages/CommunityView.module.scss:281-319` (and dark mode lines 447-459)

- [ ] **Step 1: Remove inline nav JSX**

In `src/pages/CommunityView.tsx`, delete the entire `{/* Inline nav tabs */}` block (lines 363–393):

```tsx
// DELETE this entire block:
      {/* Inline nav tabs */}
      <nav className={styles.inlineNav}>
        <button
          className={`${styles.navTab} ${activeTab === 'collab' ? styles.navTabActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/collab`)}
        >
          <Users2 size={16} />
          <span>Collab</span>
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'chat' ? styles.navTabActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/chat`)}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'currency' ? styles.navTabActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/currency`)}
        >
          <Coins size={16} />
          <span>Currency</span>
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'members' ? styles.navTabActive : ''}`}
          onClick={() => navigate(`/community/${communityId}/members`)}
        >
          <Users size={16} />
          <span>Members</span>
        </button>
      </nav>
```

Also remove the unused `footerTabs` and `activeTab` variables (lines 264-265):

```tsx
// DELETE these two lines:
  const footerTabs = ['collab', 'chat', 'currency', 'members'];
  const activeTab = footerTabs.find((t) => location.pathname.includes(`/community/${communityId}/${t}`)) || null;
```

Also remove the `Coins` import from lucide-react (line 3) since it's only used in the inline nav. Check first — if Coins is used elsewhere in the file, keep it.

- [ ] **Step 2: Remove inline nav SCSS**

In `src/pages/CommunityView.module.scss`, delete the `.inlineNav`, `.navTab`, and `.navTabActive` rules (lines 282-319):

```scss
// DELETE everything from "// ─── Inline nav tabs" through .navTabActive
```

Also delete the dark mode rules for `.inlineNav` and `.navTab` (lines 447-459 in the `@media (prefers-color-scheme: dark)` block):

```scss
// DELETE:
  .inlineNav {
    background: $dark-bg;
    border-bottom-color: $dark-border;
  }

  .navTab {
    color: $dark-text-secondary;

    &:hover {
      color: $dark-text;
      background: $dark-surface;
    }
  }

  .navTabActive {
    color: $primary;
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors. If `Coins` import removal causes errors, it's used elsewhere — restore it.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CommunityView.tsx src/pages/CommunityView.module.scss
git commit -m "refactor: remove redundant inline tab bar from CommunityView"
```

---

### Task 3: Create Initiative — Full Onboarding Page

**Files:**
- Create: `src/pages/CreateInitiativePage.tsx`
- Create: `src/pages/CreateInitiativePage.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/pages/CreateInitiativePage.module.scss`:

```scss
@use '../styles/variables' as *;

.page {
  max-width: 600px;
  margin: 0 auto;
  padding: $spacing-xl;
  padding-bottom: 100px; // Clear stage footer
}

.header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  .backButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: $radius-full;
    color: $gray-500;
    cursor: pointer;
    transition: all $transition-base;
    flex-shrink: 0;

    &:hover {
      background: $gray-100;
      color: $gray-800;
    }
  }

  h1 {
    font-size: $text-xl;
    font-weight: $font-bold;
    color: $gray-800;
    margin: 0;
  }
}

.card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;

  h2 {
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $gray-800;
    margin: 0 0 $spacing-md 0;
  }

  p {
    font-size: $text-sm;
    color: $gray-700;
    line-height: 1.6;
    margin: 0;
  }
}

// Stage stepper
.stepper {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: $spacing-md;
}

.step {
  display: flex;
  gap: $spacing-md;
  position: relative;

  &:not(:last-child) {
    padding-bottom: $spacing-lg;
  }
}

.stepIndicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.stepCircle {
  width: 32px;
  height: 32px;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stepLine {
  width: 2px;
  flex: 1;
  background: $gray-200;
  min-height: 12px;
}

.stepContent {
  padding-top: 4px;

  h3 {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: $gray-800;
    margin: 0 0 $spacing-xs 0;
  }

  p {
    font-size: $text-xs;
    color: $gray-600;
    line-height: 1.5;
    margin: 0;
  }
}

// Tips card
.tips {
  p {
    margin-bottom: $spacing-md;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: $gray-800;
    }
  }
}

// Form
.formGroup {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  display: block;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gray-800;
  margin-bottom: $spacing-xs;
}

.hint {
  font-size: $text-xs;
  color: $gray-500;
  margin: $spacing-xs 0 0 0;
}

.inputField {
  width: 100%;
  padding: $spacing-md;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  font-size: $text-sm;
  color: $gray-800;
  background: white;
  transition: border-color $transition-base;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }

  &::placeholder {
    color: $gray-400;
  }

  &:disabled {
    background: $gray-50;
    color: $gray-400;
  }
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

// Evidence
.evidenceRow {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.removeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  color: $gray-400;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: $error;
    border-color: $error;
  }
}

.addEvidenceButton {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: 1px dashed $gray-300;
  border-radius: $radius-md;
  color: $gray-500;
  font-size: $text-sm;
  cursor: pointer;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

// Countries
.chipGroup {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.chip {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $gray-300;
  border-radius: $radius-full;
  background: white;
  color: $gray-700;
  font-size: $text-sm;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

.chipSelected {
  background: $primary;
  border-color: $primary;
  color: white;

  &:hover {
    background: $primary-dark;
    border-color: $primary-dark;
    color: white;
  }
}

// Submit
.submitButton {
  width: 100%;
  padding: $spacing-md $spacing-xl;
  background: $primary;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: $text-base;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: background $transition-base;
  margin-top: $spacing-lg;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.errorMessage {
  color: $error;
  font-size: $text-sm;
  margin-top: $spacing-sm;
}

.successMessage {
  color: $success;
  font-size: $text-sm;
  text-align: center;
  padding: $spacing-lg;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .header h1 {
    color: $dark-text;
  }

  .header .backButton {
    color: $dark-text-secondary;

    &:hover {
      background: $dark-border;
      color: $dark-text;
    }
  }

  .card {
    background: $dark-bg;
    border-color: $dark-border;

    h2 { color: $dark-text; }
    p { color: $dark-text-secondary; }
  }

  .stepContent {
    h3 { color: $dark-text; }
    p { color: $dark-text-secondary; }
  }

  .stepLine {
    background: $dark-border;
  }

  .tips p strong {
    color: $dark-text;
  }

  .label {
    color: $dark-text;
  }

  .inputField {
    background: $dark-surface;
    border-color: $dark-border;
    color: $dark-text;

    &:focus {
      border-color: $primary;
    }

    &::placeholder {
      color: $dark-text-secondary;
    }

    &:disabled {
      background: $dark-bg;
      color: $dark-text-secondary;
    }
  }

  .chip {
    background: $dark-surface;
    border-color: $dark-border;
    color: $dark-text-secondary;
  }

  .chipSelected {
    background: $primary;
    border-color: $primary;
    color: white;
  }

  .removeButton {
    border-color: $dark-border;
    color: $dark-text-secondary;
  }

  .addEvidenceButton {
    border-color: $dark-border;
    color: $dark-text-secondary;
  }
}
```

- [ ] **Step 2: Create the page component**

Create `src/pages/CreateInitiativePage.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageSquare, FileText, Vote, ScrollText, Plus, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCollaborations } from '../store/slices/communitiesSlice';
import { createInitiative } from '../services/contracts/community';
import styles from './CreateInitiativePage.module.scss';

const COUNTRY_OPTIONS = [
  { code: 'KE', label: 'Kenya' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'MW', label: 'Malawi' },
  { code: 'CD', label: 'DR Congo' },
  { code: 'OTHER', label: 'Other' },
];

const STAGES = [
  {
    name: 'Problem Recognition',
    color: '#ef4444',
    icon: AlertTriangle,
    description: 'Your community votes on whether this is a real problem. At least 67% of voters must agree it\'s worth addressing before it moves forward.',
  },
  {
    name: 'Discussion',
    color: '#f59e0b',
    icon: MessageSquare,
    description: 'Community members discuss the problem openly. At least 33% of members must participate in the conversation. Members can also suggest modifications to the initiative\'s framing.',
  },
  {
    name: 'Proposals',
    color: '#8b5cf6',
    icon: FileText,
    description: 'Members submit concrete proposals for how to solve the problem. The community reviews and approves proposals. Modifications can still be suggested at this stage.',
  },
  {
    name: 'Vote',
    color: '#3b82f6',
    icon: Vote,
    description: 'The community votes on approved proposals using quadratic voting \u2014 a system where you spread credits across proposals you care about. This prevents any single voter from dominating the outcome.',
  },
  {
    name: 'Mandate',
    color: '#10b981',
    icon: ScrollText,
    description: 'The winning proposal becomes a mandate. Community members can pledge to support its implementation. This is the community\'s commitment to action.',
  },
];

const CreateInitiativePage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { publicKey, serverUrl } = useAppSelector((s) => s.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>(['']);
  const [countries, setCountries] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvidenceChange = (index: number, value: string) => {
    setEvidence((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleAddEvidence = () => {
    setEvidence((prev) => [...prev, '']);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleCountry = (code: string) => {
    setCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Please describe the problem');
      return;
    }
    if (!description.trim()) {
      setError('Please explain why this matters');
      return;
    }
    if (!serverUrl || !publicKey || !communityId) {
      setError('Not logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInitiative(serverUrl, publicKey, communityId, {
        title: title.trim(),
        description: description.trim(),
      });
      dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
      navigate(`/community/${communityId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(`/community/${communityId}`)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Start an Initiative</h1>
      </div>

      {/* What is an Initiative? */}
      <div className={styles.card}>
        <h2>What is an Initiative?</h2>
        <p>
          An initiative is a problem you want your community to solve together. When you start an initiative,
          you're asking your community to recognize a problem, discuss solutions, propose actions, and vote
          on how to move forward.
        </p>
        <br />
        <p>
          Think of it as a formal request for collective action — backed by a transparent, democratic process.
        </p>
      </div>

      {/* The 5 Stages */}
      <div className={styles.card}>
        <h2>The 5 Stages</h2>
        <div className={styles.stepper}>
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            return (
              <div key={stage.name} className={styles.step}>
                <div className={styles.stepIndicator}>
                  <div className={styles.stepCircle} style={{ background: stage.color }}>
                    <StageIcon size={16} />
                  </div>
                  {index < STAGES.length - 1 && <div className={styles.stepLine} />}
                </div>
                <div className={styles.stepContent}>
                  <h3>{stage.name}</h3>
                  <p>{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className={`${styles.card} ${styles.tips}`}>
        <h2>What Makes a Good Initiative?</h2>
        <p><strong>Be specific.</strong> "Climate change is bad" won't get traction. "Our neighbourhood lacks recycling infrastructure" will.</p>
        <p><strong>Explain why it matters.</strong> Help your community understand the impact. Who is affected? What happens if nothing changes?</p>
        <p><strong>Provide evidence.</strong> Link to articles, reports, data, or personal accounts that support your case. Evidence builds trust and accelerates consensus.</p>
        <p><strong>Think locally.</strong> The best initiatives are ones your community can actually act on.</p>
      </div>

      {/* Form */}
      <div className={styles.card}>
        <h2>Your Initiative</h2>

        <div className={styles.formGroup}>
          <label htmlFor="initiativeTitle" className={styles.label}>What's the problem?</label>
          <input
            id="initiativeTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Describe the problem in one clear sentence"
            className={styles.inputField}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>Be specific and actionable. This becomes the initiative's title.</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="initiativeDesc" className={styles.label}>Why does this matter?</label>
          <textarea
            id="initiativeDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the impact and why your community should care"
            className={`${styles.inputField} ${styles.textarea}`}
            rows={6}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>This is your case for action. Be persuasive but honest.</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Supporting evidence</label>
          <p className={styles.hint}>Links to articles, reports, or data that back up your case.</p>
          {evidence.map((url, index) => (
            <div key={index} className={styles.evidenceRow}>
              <input
                type="url"
                value={url}
                onChange={(e) => handleEvidenceChange(index, e.target.value)}
                placeholder="https://..."
                className={styles.inputField}
                disabled={isSubmitting}
              />
              {evidence.length > 1 && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveEvidence(index)}
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.addEvidenceButton}
            onClick={handleAddEvidence}
            disabled={isSubmitting}
          >
            <Plus size={14} />
            Add link
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Countries affected</label>
          <p className={styles.hint}>Select which countries are most affected by this problem.</p>
          <div className={styles.chipGroup}>
            {COUNTRY_OPTIONS.map((country) => (
              <button
                key={country.code}
                type="button"
                className={`${styles.chip} ${countries.includes(country.code) ? styles.chipSelected : ''}`}
                onClick={() => handleToggleCountry(country.code)}
                disabled={isSubmitting}
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
        >
          {isSubmitting ? 'Submitting...' : 'Start Initiative'}
        </button>
      </div>
    </div>
  );
};

export default CreateInitiativePage;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CreateInitiativePage.tsx src/pages/CreateInitiativePage.module.scss
git commit -m "feat: add Create Initiative full onboarding page"
```

---

### Task 4: Create Community — Full Onboarding Page

**Files:**
- Create: `src/pages/CreateCommunityPage.tsx`
- Create: `src/pages/CreateCommunityPage.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/pages/CreateCommunityPage.module.scss`. Reuse the same card/form pattern as CreateInitiativePage:

```scss
@use '../styles/variables' as *;

.page {
  max-width: 600px;
  margin: 0 auto;
  padding: $spacing-xl;
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-xl;

  .backButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: $radius-full;
    color: $gray-500;
    cursor: pointer;
    transition: all $transition-base;
    flex-shrink: 0;

    &:hover {
      background: $gray-100;
      color: $gray-800;
    }
  }

  h1 {
    font-size: $text-xl;
    font-weight: $font-bold;
    color: $gray-800;
    margin: 0;
  }
}

.card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;

  h2 {
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $gray-800;
    margin: 0 0 $spacing-md 0;
  }

  p {
    font-size: $text-sm;
    color: $gray-700;
    line-height: 1.6;
    margin: 0 0 $spacing-md 0;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: $gray-800;
    }
  }
}

// Features list
.featureList {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.featureItem {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
}

.featureIcon {
  width: 32px;
  height: 32px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($primary, 0.1);
  color: $primary;
  flex-shrink: 0;
}

.featureContent {
  h3 {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: $gray-800;
    margin: 0 0 2px 0;
  }

  p {
    font-size: $text-xs;
    color: $gray-600;
    margin: 0;
  }
}

// Form
.formGroup {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  display: block;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: $gray-800;
  margin-bottom: $spacing-xs;
}

.hint {
  font-size: $text-xs;
  color: $gray-500;
  margin: $spacing-xs 0 0 0;
}

.inputField {
  width: 100%;
  padding: $spacing-md;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  font-size: $text-sm;
  color: $gray-800;
  background: white;
  transition: border-color $transition-base;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }

  &::placeholder {
    color: $gray-400;
  }

  &:disabled {
    background: $gray-50;
    color: $gray-400;
  }
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.submitButton {
  width: 100%;
  padding: $spacing-md $spacing-xl;
  background: $primary;
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: $text-base;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: background $transition-base;
  margin-top: $spacing-lg;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.errorMessage {
  color: $error;
  font-size: $text-sm;
  margin-top: $spacing-sm;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .header h1 {
    color: $dark-text;
  }

  .header .backButton {
    color: $dark-text-secondary;

    &:hover {
      background: $dark-border;
      color: $dark-text;
    }
  }

  .card {
    background: $dark-bg;
    border-color: $dark-border;

    h2 { color: $dark-text; }
    p { color: $dark-text-secondary; }
    p strong { color: $dark-text; }
  }

  .featureIcon {
    background: rgba($primary, 0.2);
  }

  .featureContent {
    h3 { color: $dark-text; }
    p { color: $dark-text-secondary; }
  }

  .label {
    color: $dark-text;
  }

  .inputField {
    background: $dark-surface;
    border-color: $dark-border;
    color: $dark-text;

    &:focus {
      border-color: $primary;
    }

    &::placeholder {
      color: $dark-text-secondary;
    }

    &:disabled {
      background: $dark-bg;
      color: $dark-text-secondary;
    }
  }
}
```

- [ ] **Step 2: Create the page component**

Create `src/pages/CreateCommunityPage.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Coins, Users2, Shield, Globe } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { createCommunity } from '../services/contracts/community';
import styles from './CreateCommunityPage.module.scss';

const FEATURES = [
  {
    name: 'Governance Pipeline',
    icon: GitBranch,
    description: '5-stage democratic process from problem recognition to mandated action',
  },
  {
    name: 'Community Currency',
    icon: Coins,
    description: 'Mint, send, and manage a currency owned by your community',
  },
  {
    name: 'Collaboration Tools',
    icon: Users2,
    description: 'Shared workspaces for documents, tasks, scheduling, and roles',
  },
  {
    name: 'Identity & Trust',
    icon: Shield,
    description: 'Verify members through a web of trust, QR-based identity cards',
  },
  {
    name: 'AI Translation',
    icon: Globe,
    description: 'Automatic translation across 12 languages so everyone can participate',
  },
];

const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey, serverUrl, profileContractId } = useAppSelector((s) => s.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter a community name');
      return;
    }
    if (!serverUrl || !publicKey) {
      setError('Not logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCommunity(
        serverUrl,
        publicKey,
        name.trim(),
        description.trim(),
        profileContractId,
      );
      navigate('/identity/communities');
    } catch {
      setError('Failed to create community. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/identity/communities')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Create a Community</h1>
      </div>

      {/* What is a Community? */}
      <div className={styles.card}>
        <h2>What is a Community on Gloki?</h2>
        <p>
          A community is a group of people united by a shared interest, location, cause, or goal.
          On Gloki, communities are spaces for collective decision-making — where members can
          identify problems, propose solutions, and vote on actions together.
        </p>
        <p>
          Every community on Gloki has access to the same democratic tools: a 5-stage governance
          pipeline, community currency, collaboration workspaces, and identity verification.
        </p>
      </div>

      {/* Why Create? */}
      <div className={styles.card}>
        <h2>Why Create a Community?</h2>
        <p>
          <strong>Bring direct democracy to your group.</strong> Whether you're a neighbourhood
          association, a student union, a workplace team, or an activist collective — Gloki gives
          your group the tools to make decisions transparently and fairly.
        </p>
        <p>
          <strong>Every voice counts.</strong> Quadratic voting ensures no single person dominates
          the outcome. Thresholds ensure decisions have genuine community support before moving forward.
        </p>
        <p>
          <strong>From problems to mandates.</strong> Don't just talk about issues — turn them into
          commitments. Gloki's pipeline moves problems through discussion, proposals, and voting
          into mandates your community can act on.
        </p>
      </div>

      {/* Features */}
      <div className={styles.card}>
        <h2>What Gloki Provides Your Community</h2>
        <div className={styles.featureList}>
          {FEATURES.map((feature) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={feature.name} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FeatureIcon size={16} />
                </div>
                <div className={styles.featureContent}>
                  <h3>{feature.name}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className={styles.card}>
        <h2>What We Need From You</h2>
        <p>To create a community, we just need two things:</p>

        <div className={styles.formGroup}>
          <label htmlFor="communityName" className={styles.label}>Community name</label>
          <input
            id="communityName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Berlin Climate Action Network"
            className={styles.inputField}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>This is how your community appears to other Gloki users.</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="communityDesc" className={styles.label}>Description</label>
          <textarea
            id="communityDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this community about? What are you trying to achieve?"
            className={`${styles.inputField} ${styles.textarea}`}
            rows={4}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>A good description helps attract the right members.</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Community'}
        </button>
      </div>
    </div>
  );
};

export default CreateCommunityPage;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors. Verify `profileContractId` exists on the user state — it's used in the existing `CreateCommunityDialog.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CreateCommunityPage.tsx src/pages/CreateCommunityPage.module.scss
git commit -m "feat: add Create Community full onboarding page"
```

---

### Task 5: Identity & Trust — New Page

**Files:**
- Create: `src/components/community/IdentityTrust.tsx`
- Create: `src/components/community/IdentityTrust.module.scss`

- [ ] **Step 1: Create the SCSS module**

Create `src/components/community/IdentityTrust.module.scss`:

```scss
@use '../../styles/variables' as *;

.container {
  max-width: 800px;
  margin: 0 auto;
}

.pageHeader {
  margin-bottom: $spacing-2xl;

  h2 {
    font-size: $text-2xl;
    font-weight: $font-bold;
    color: $gray-800;
    margin: 0 0 $spacing-sm 0;
  }

  p {
    font-size: $text-sm;
    color: $gray-600;
    line-height: 1.6;
    margin: 0;
  }
}

.trustSection {
  padding: $spacing-xl;
  background: $gray-50;
  border-radius: $radius-lg;
  border: 1px solid $gray-200;
}

.trustActions {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}

.trustBtn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: white;
  border: 1px solid $gray-300;
  border-radius: $radius-md;
  color: $gray-700;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;
  min-height: 40px;

  &:hover {
    background: $gray-100;
    border-color: $gray-400;
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    flex-shrink: 0;
    color: $primary;
  }
}

.shareEmbed {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $gray-200;
}

.notMember {
  text-align: center;
  padding: $spacing-3xl;
  color: $gray-500;
  font-size: $text-sm;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  .pageHeader {
    h2 { color: $dark-text; }
    p { color: $dark-text-secondary; }
  }

  .trustSection {
    background: $dark-surface;
    border-color: $dark-border;
  }

  .trustBtn {
    background: $dark-bg;
    border-color: $dark-border;
    color: $dark-text-secondary;

    &:hover {
      background: $dark-border;
      color: $dark-text;
    }
  }

  .shareEmbed {
    border-color: $dark-border;
  }
}
```

- [ ] **Step 2: Create the component**

Create `src/components/community/IdentityTrust.tsx`:

```tsx
import React, { useState, Suspense, lazy } from 'react';
import { IdCard, QrCode, Share2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import styles from './IdentityTrust.module.scss';

const IdentityCardDialog = lazy(() => import('./dialogs/IdentityCardDialog'));
const QRScannerDialog = lazy(() => import('./dialogs/QRScannerDialog'));
const Share = lazy(() => import('./Share'));

interface IdentityTrustProps {
  communityId: string;
}

const IdentityTrust: React.FC<IdentityTrustProps> = ({ communityId }) => {
  const { communityMembers, communityProperties } = useAppSelector((s) => s.communities);
  const { publicKey } = useAppSelector((s) => s.user);

  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const allMembers: string[] = Array.isArray(communityMembers[communityId]) ? communityMembers[communityId] : [];
  const isMember = publicKey && allMembers.includes(publicKey);
  const communityName = communityProperties[communityId]?.name || 'Community';

  if (!isMember) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h2>Identity & Trust</h2>
          <p>You must be a member of this community to access identity features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2>Identity & Trust</h2>
        <p>
          Gloki uses a web of trust to verify community members. By scanning each other's QR codes
          and confirming real-world identity, you strengthen the trust network within your community.
          The more verified connections you have, the stronger your community's democratic foundation.
        </p>
      </div>

      <div className={styles.trustSection}>
        <div className={styles.trustActions}>
          <button className={styles.trustBtn} onClick={() => setShowIdentityCard(true)}>
            <IdCard size={18} />
            <span>My ID Card</span>
          </button>
          <button className={styles.trustBtn} onClick={() => setShowQRScanner(true)}>
            <QrCode size={18} />
            <span>Scan Member</span>
          </button>
          <button className={styles.trustBtn} onClick={() => setShowShare((v) => !v)}>
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
        {showShare && (
          <div className={styles.shareEmbed}>
            <Suspense fallback={<p>Loading...</p>}>
              <Share communityId={communityId} />
            </Suspense>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <IdentityCardDialog
          isOpen={showIdentityCard}
          onClose={() => setShowIdentityCard(false)}
          communityName={communityName}
        />
        <QRScannerDialog
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          communityId={communityId}
        />
      </Suspense>
    </div>
  );
};

export default IdentityTrust;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/community/IdentityTrust.tsx src/components/community/IdentityTrust.module.scss
git commit -m "feat: add Identity & Trust as dedicated page"
```

---

### Task 6: Update Members — Remove Identity Section, Add Title

**Files:**
- Modify: `src/components/community/Members.tsx`

**Depends on:** Task 5 (Identity & Trust page exists to replace the removed section)

- [ ] **Step 1: Remove Identity & Trust section and unused imports**

In `src/components/community/Members.tsx`:

Remove these imports (lines 3, 14-15) since they're no longer needed in Members:

```tsx
// DELETE these imports:
import { IdCard, QrCode, Share2 } from 'lucide-react';
const IdentityCardDialog = lazy(() => import('./dialogs/IdentityCardDialog'));
const QRScannerDialog = lazy(() => import('./dialogs/QRScannerDialog'));
const Share = lazy(() => import('./Share'));
```

Also remove the `Suspense` and `lazy` imports if they're no longer used (check — `Suspense` may still be needed if other lazy components remain). Keep `React, { useState, useRef, useCallback, useEffect }`.

Remove the state variables for Identity section (around lines 83-85):

```tsx
// DELETE:
  const [showIdentityCard, setShowIdentityCard] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showShare, setShowShare] = useState(false);
```

Remove the `communityName` variable (line 97) if it's only used by the Identity section. Check if it's used elsewhere first.

Remove the entire Identity & Trust JSX section (lines 209-240):

```tsx
// DELETE this entire block:
        {/* Identity & Trust section — members only */}
        {isMember && (
          <div className={styles.trustSection}>
            ...
          </div>
        )}
```

Remove the IdentityCardDialog and QRScannerDialog at the bottom (lines 295-306):

```tsx
// DELETE:
      <Suspense fallback={null}>
        <IdentityCardDialog
          isOpen={showIdentityCard}
          onClose={() => setShowIdentityCard(false)}
          communityName={communityName}
        />
        <QRScannerDialog
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          communityId={communityId}
        />
      </Suspense>
```

- [ ] **Step 2: Add descriptive header**

Update the existing `.header` div in Members (around lines 242-245) to include a description:

```tsx
// OLD:
        <div className={styles.header}>
          <h2>Members</h2>
          <p>{allMembers.length} community members</p>
        </div>

// NEW:
        <div className={styles.header}>
          <h2>Members</h2>
          <p>People in this community. Members can propose initiatives, vote on decisions, and participate in governance.</p>
          <p className={styles.memberCount}>{allMembers.length} community member{allMembers.length !== 1 ? 's' : ''}</p>
        </div>
```

Add the `.memberCount` style in `Members.module.scss` inside the `.header` block:

```scss
    .memberCount {
      font-size: $text-xs;
      color: $gray-400;
      margin-top: $spacing-xs;
    }
```

- [ ] **Step 3: Clean up unused SCSS**

In `Members.module.scss`, the `.trustSection` styles (lines 9-71) and their dark mode counterparts (lines 295-319) are now unused. Delete them.

- [ ] **Step 4: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/community/Members.tsx src/components/community/Members.module.scss
git commit -m "refactor: remove Identity section from Members, add description"
```

---

### Task 7: Communities List — Title, Description, Icon Fix, Create Button

**Files:**
- Modify: `src/components/identity/Communities.tsx`
- Modify: `src/components/identity/Communities.module.scss`

**Depends on:** Task 4 (Create Community page exists for navigation)

- [ ] **Step 1: Add page title, description, and create card**

In `src/components/identity/Communities.tsx`, add `PlusCircle` to the lucide-react import:

```tsx
// OLD:
import { Star, EyeOff, Eye, ArrowLeft, Users, ScrollText } from 'lucide-react';

// NEW:
import { Star, EyeOff, Eye, ArrowLeft, Users, ScrollText, PlusCircle } from 'lucide-react';
```

Remove the `CreateCommunityDialog` import and related state/handlers, since the dialog is replaced by a page:

```tsx
// DELETE:
import CreateCommunityDialog from './communities/CreateCommunityDialog';

// DELETE state (line 26-28):
  const [showCreateForm, setShowCreateForm] = useState(
    !!(location.state as { createCommunity?: boolean })?.createCommunity
  );

// DELETE handler (lines 55-60):
  const handleCloseDialog = useCallback(() => {
    setShowCreateForm(false);
    if ((location.state as { createCommunity?: boolean })?.createCommunity) {
      window.history.replaceState({}, '');
    }
  }, [location.state]);
```

If `location` is no longer used after removing the state check, remove the `useLocation` import and `const location = useLocation()` too.

In the main return JSX, add the title/description before the grid, remove the dialog component, and add a create card after the grid:

```tsx
  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Your Communities</h2>
        <p className={styles.pageDescription}>
          Communities you've joined on Gloki. Star your favourites to keep them at the top,
          or hide ones you don't need right now.
        </p>
      </div>

      <div className={styles.grid}>
        {sortedContracts.map((contract) => {
          // ... existing card rendering unchanged ...
        })}
      </div>

      {/* Create a community card */}
      <button
        className={styles.createCard}
        onClick={() => navigate('/create-community')}
      >
        <PlusCircle size={20} />
        <span>Create a community</span>
      </button>

      {sortedContracts.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <h3 className={styles.title}>No Communities Yet</h3>
          <p className={styles.description}>Create or join a community to get started</p>
        </div>
      )}

      {!showHidden && hiddenCount > 0 && (
        <button
          className={styles.hiddenToggle}
          onClick={() => navigate('/identity/hidden')}
        >
          {hiddenCount} hidden communit{hiddenCount === 1 ? 'y' : 'ies'}
        </button>
      )}
    </div>
  );
```

- [ ] **Step 2: Fix star/hide button contrast and add new styles**

In `src/components/identity/Communities.module.scss`, update the `.starBtn, .hideBtn` styles:

```scss
// OLD:
      .starBtn,
      .hideBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: $gray-50;
        border: 1px solid $gray-200;
        border-radius: $radius-full;
        color: $gray-500;
        cursor: pointer;
        transition: all $transition-fast;

        &:hover {
          background-color: $gray-100;
          color: $gray-700;
          border-color: $gray-300;
        }
      }

      .starBtnActive {
        color: #f59e0b;

        &:hover {
          color: #d97706;
        }
      }

// NEW:
      .starBtn,
      .hideBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: $gray-200;
        border: 1px solid $gray-300;
        border-radius: $radius-full;
        color: $gray-500;
        cursor: pointer;
        transition: all $transition-fast;

        &:hover {
          background-color: $gray-300;
          color: $gray-700;
        }
      }

      .starBtnActive {
        background: #f59e0b;
        border-color: #f59e0b;
        color: white;

        &:hover {
          background: #d97706;
          border-color: #d97706;
          color: white;
        }
      }
```

Add the new styles for the page header and create card. Add these right inside `.container`, before `.grid`:

```scss
  .pageHeader {
    margin-bottom: $spacing-lg;
    padding: 0 $spacing-xl;
  }

  .pageTitle {
    font-size: $text-xl;
    font-weight: $font-semibold;
    color: $gray-800;
    margin: 0 0 $spacing-xs 0;
  }

  .pageDescription {
    font-size: $text-sm;
    color: $gray-500;
    line-height: 1.5;
    margin: 0;
  }

  .createCard {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    width: 100%;
    margin-top: $spacing-lg;
    padding: $spacing-lg;
    background: transparent;
    border: 2px dashed $gray-300;
    border-radius: $radius-lg;
    color: $gray-400;
    font-size: $text-sm;
    font-weight: $font-medium;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      border-color: $primary;
      color: $primary;
    }
  }
```

Add dark mode support for the new elements inside the existing `@media (prefers-color-scheme: dark)` block:

```scss
    .pageTitle {
      color: $dark-text;
    }

    .pageDescription {
      color: $dark-text-secondary;
    }

    .createCard {
      border-color: $dark-border;
      color: $dark-text-secondary;

      &:hover {
        border-color: $primary;
        color: $primary;
      }
    }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/identity/Communities.tsx src/components/identity/Communities.module.scss
git commit -m "feat: add title, description, create button to Communities list; fix icon contrast"
```

---

### Task 8: Update CommunityView — Menu Items + Nested Routes

**Files:**
- Modify: `src/pages/CommunityView.tsx`

**Depends on:** Tasks 2 (tab bar removed), 3 (CreateInitiativePage exists), 5 (IdentityTrust exists)

- [ ] **Step 1: Add lazy imports for new pages**

In `src/pages/CommunityView.tsx`, add lazy imports for the new components:

```tsx
const IdentityTrust = lazy(() => import('../components/community/IdentityTrust'));
const CreateInitiativePage = lazy(() => import('./CreateInitiativePage'));
```

Add `PlusCircle` and `Shield` to the lucide-react import:

```tsx
// Add to the existing import:
import { Home, Menu, X, Users2, MessageSquare, Users, Coins, Share2, UserPlus, LogOut, AlertCircle, MessageCircle, Lightbulb, Vote, ScrollText, PlusCircle, Shield } from 'lucide-react';
```

- [ ] **Step 2: Add new menu items**

In the slide-out menu JSX (inside `.menuList`), add "Create Initiative" and "Identity & Trust" items. Insert "Create Initiative" right after the "Home" button and before the divider:

```tsx
              <button className={styles.menuItem} onClick={() => { navigate('/stage/problem'); setShowMenu(false); }}>
                <Home size={20} />
                <span>Home</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/create-initiative`); setShowMenu(false); }}>
                <PlusCircle size={20} />
                <span>Create Initiative</span>
              </button>

              <div className={styles.menuDivider} />
```

Add "Identity & Trust" after "Members" and before the second divider:

```tsx
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/members`); setShowMenu(false); }}>
                <Users size={20} />
                <span>Members</span>
              </button>
              <button className={styles.menuItem} onClick={() => { navigate(`/community/${communityId}/identity`); setShowMenu(false); }}>
                <Shield size={20} />
                <span>Identity & Trust</span>
              </button>

              <div className={styles.menuDivider} />
```

- [ ] **Step 3: Add nested routes**

In the `<Routes>` block inside CommunityView, add routes for the new pages:

```tsx
              <Route path="identity" element={<IdentityTrust communityId={communityId!} />} />
              <Route path="create-initiative" element={<CreateInitiativePage />} />
```

Place them before the `<Route path="*"` catch-all.

- [ ] **Step 4: Add activity feed section header**

In the `CommunityFeed` component (inside `CommunityView.tsx`), add a section header above the feed cards. Update the return JSX:

```tsx
    return (
      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <h2 className={styles.feedTitle}>Community Activity</h2>
          <p className={styles.feedDescription}>
            Recent initiatives and updates from this community. Tap an initiative to see its
            progress through the governance pipeline.
          </p>
        </div>

        {/* Real initiatives */}
        {initiatives.map((item) => {
          // ... unchanged ...
        })}
        // ... rest unchanged ...
      </div>
    );
```

Add matching styles in `CommunityView.module.scss` inside the `.feed` section:

```scss
.feedHeader {
  margin-bottom: $spacing-md;
}

.feedTitle {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: $gray-800;
  margin: 0 0 $spacing-xs 0;
}

.feedDescription {
  font-size: $text-sm;
  color: $gray-500;
  margin: 0;
  line-height: 1.5;
}
```

Add dark mode rules for these:

```scss
  .feedTitle {
    color: $dark-text;
  }

  .feedDescription {
    color: $dark-text-secondary;
  }
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/CommunityView.tsx src/pages/CommunityView.module.scss
git commit -m "feat: add Create Initiative and Identity & Trust to community menu and routes"
```

---

### Task 9: Wire Navigation — HomepageMenu, ActivityHub, InitiativeList, App.tsx, IdentityView

**Files:**
- Modify: `src/components/identity/HomepageMenu.tsx`
- Modify: `src/components/community/ActivityHub.tsx`
- Modify: `src/components/community/InitiativeList.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/IdentityView.tsx`

**Depends on:** Tasks 3, 4, 8

- [ ] **Step 1: Update HomepageMenu to navigate instead of callback**

In `src/components/identity/HomepageMenu.tsx`:

Add `useNavigate` import:

```tsx
import { useNavigate } from 'react-router-dom';
```

Remove `onCreateCommunity` from the props interface and destructuring:

```tsx
// OLD interface:
interface HomepageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onCreateCommunity: () => void;
}

// NEW interface:
interface HomepageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
```

Update the destructuring:

```tsx
// OLD:
const HomepageMenu: React.FC<HomepageMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  onCreateCommunity,
}) => {

// NEW:
const HomepageMenu: React.FC<HomepageMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const navigate = useNavigate();
```

Update the "Create Community" button to navigate:

```tsx
// OLD:
          <button className={styles.menuItem} onClick={() => { onCreateCommunity(); onClose(); }}>
            <Plus size={20} />
            <span>Create Community</span>
          </button>

// NEW:
          <button className={styles.menuItem} onClick={() => { navigate('/create-community'); onClose(); }}>
            <Plus size={20} />
            <span>Create Community</span>
          </button>
```

- [ ] **Step 2: Update IdentityView to remove onCreateCommunity**

In `src/pages/IdentityView.tsx`, remove the `onCreateCommunity` prop from the HomepageMenu usage:

```tsx
// OLD:
      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onCreateCommunity={() => {
          navigate('/identity/communities', { state: { createCommunity: true } });
        }}
      />

// NEW:
      <HomepageMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
```

- [ ] **Step 3: Update App.tsx — add /create-community route**

In `src/App.tsx`, add a lazy import and route for CreateCommunityPage:

```tsx
// Add import:
const CreateCommunityPage = lazy(() => import('./pages/CreateCommunityPage'));

// Add route (inside <Routes>, before the catch-all or after /identity/*):
            <Route path="/create-community" element={<CreateCommunityPage />} />
```

- [ ] **Step 4: Update ActivityHub — navigate to create-initiative page**

In `src/components/community/ActivityHub.tsx`:

Remove the dialog import and state:

```tsx
// DELETE:
import CreateInitiativeDialog, { type InitiativeFormData } from './dialogs/CreateInitiativeDialog';

// DELETE state:
  const [showInitiativeDialog, setShowInitiativeDialog] = useState(false);

// DELETE handler:
  const handleCreateInitiative = async (data: InitiativeFormData) => {
    if (!serverUrl || !publicKey) throw new Error('Not logged in');
    await createInitiative(serverUrl, publicKey, communityId, {
      title: data.title,
      description: data.description,
    });
    dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
  };
```

Remove the `createInitiative` import from `services/contracts/community` (keep `addCollaboration` and `Collaboration`):

```tsx
// OLD:
import {
  addCollaboration,
  createInitiative,
  type Collaboration,
} from '../../services/contracts/community';

// NEW:
import {
  addCollaboration,
  type Collaboration,
} from '../../services/contracts/community';
```

Update the "Start Initiative" button to navigate:

```tsx
// OLD:
        <button
          className={`${styles.cardAction} ${styles.initiativeAction}`}
          onClick={() => setShowInitiativeDialog(true)}
        >
          Start Initiative
        </button>

// NEW:
        <button
          className={`${styles.cardAction} ${styles.initiativeAction}`}
          onClick={() => navigate(`/community/${communityId}/create-initiative`)}
        >
          Start Initiative
        </button>
```

Remove the `CreateInitiativeDialog` JSX at the bottom:

```tsx
// DELETE:
      <CreateInitiativeDialog
        isVisible={showInitiativeDialog}
        onClose={() => setShowInitiativeDialog(false)}
        onSubmit={handleCreateInitiative}
      />
```

Clean up unused imports: remove `createInitiative` from the services import, and remove `InitiativeFormData` type import if present.

- [ ] **Step 5: Update InitiativeList — navigate to create-initiative page**

In `src/components/community/InitiativeList.tsx`:

Remove the dialog import and state:

```tsx
// DELETE:
import CreateInitiativeDialog, { type InitiativeFormData } from './dialogs/CreateInitiativeDialog';
import { createInitiative, type Collaboration } from '../../services/contracts/community';

// REPLACE with:
import { type Collaboration } from '../../services/contracts/community';

// DELETE state:
  const [showDialog, setShowDialog] = useState(false);

// DELETE handler:
  const handleCreate = async (data: InitiativeFormData) => { ... };
```

Update the button:

```tsx
// OLD:
      <button className={styles.createBtn} onClick={() => setShowDialog(true)}>
        Start Initiative
      </button>

      <CreateInitiativeDialog
        isVisible={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleCreate}
      />

// NEW:
      <button className={styles.createBtn} onClick={() => navigate(`/community/${communityId}/create-initiative`)}>
        Start Initiative
      </button>
```

Clean up unused imports (`useState` if no longer used, `createInitiative`, `InitiativeFormData`).

- [ ] **Step 6: Type-check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/identity/HomepageMenu.tsx src/pages/IdentityView.tsx src/App.tsx src/components/community/ActivityHub.tsx src/components/community/InitiativeList.tsx
git commit -m "feat: wire navigation to new full-page Create Initiative and Create Community"
```

---

### Task 10: Build Verification & Final Commit

**Files:** None new — verification only.

- [ ] **Step 1: Type-check entire project**

Run: `npx tsc -b --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Production build**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Dev server visual check**

Run: `npm run dev`
Verify in browser:
1. Homepage: EarthFlag logo is visibly larger (40px)
2. Communities list at `/identity/communities`: Shows "Your Communities" title and description. Star/hide buttons have visible contrast. "Create a community" dashed card appears below list, navigates to `/create-community`.
3. `/create-community`: Full-page with educational sections, form, and back button. Submission creates a community and redirects.
4. Community page: No horizontal tab bar. Slide-out menu has "Create Initiative" and "Identity & Trust" items.
5. "Create Initiative" from menu: Navigates to full page with 5-stage stepper, tips, and form. Back button returns to community.
6. "Identity & Trust" from menu: Shows dedicated page with QR/ID card buttons and descriptive text.
7. Members page: No Identity section, has descriptive header text.
8. Stage footer: Still visible on all pages.

- [ ] **Step 4: Update CLAUDE.md if needed**

If any routing or structural changes need to be reflected in CLAUDE.md, update it. At minimum, add the new routes to the routing section and note the removed dialogs.

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "docs: update CLAUDE.md with community page overhaul changes"
git push origin eston/dev
```
