import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageSquare, FileText, Vote, ScrollText, Plus, X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchCollaborations } from '../store/slices/communitiesSlice';
import { createInitiative } from '../services/contracts/community';
import { sanitizeExternalUrl } from '../utils/urlSafety';
import { useT } from '../i18n';
import { Button, CountryMultiSelect, InfoDisclosure, StageStrip } from '../components/shared';
import styles from './CreateInitiativePage.module.scss';

// ─── Vocabulary decision (Gloki product voice, confirmed with Eston, Batch 3 C7)
// An *initiative* is the whole effort that travels the 5-stage pipeline
// (Problem → Discussion → Proposals → Vote → Mandate). A *problem* is its
// starting point: the founding statement you name at Stage 1, which the
// community validates. So the object is ALWAYS an "initiative"; "problem" is
// reserved for Stage 1 and the founding statement. The single create verb is
// "Start" ("Start an initiative"), never "Create". Keep copy consistent with
// this across Home, the stage feed, the menus, and this page.

// English here is the source copy; the render wires each field through t().
// Stage labels use the canonical `stage.{id}` family (shared with the dashboard
// badges and the footer). Per-stage step-circle colors live in the SCSS module
// (.stepCircle_{id}) rather than as inline hex here.
const STAGES = [
  {
    id: 'problem',
    name: 'Problem',
    icon: AlertTriangle,
    description: 'Your community votes on whether this is a real problem. At least 50% of voters must agree it\'s worth addressing before it moves forward.',
  },
  {
    id: 'discussion',
    name: 'Discussion',
    icon: MessageSquare,
    description: 'Community members discuss the problem openly. At least 33% of members must participate in the conversation. Members can also suggest modifications to the initiative\'s framing.',
  },
  {
    id: 'proposals',
    name: 'Solutions',
    icon: FileText,
    description: 'Members submit concrete solutions for how to solve the problem. The community reviews and approves solutions. Modifications can still be suggested at this stage.',
  },
  {
    id: 'vote',
    name: 'Vote',
    icon: Vote,
    description: 'The community votes on approved solutions using quadratic voting \u2014 a system where you spread credits across solutions you care about. This prevents any single voter from dominating the outcome.',
  },
  {
    id: 'mandate',
    name: 'Mandate',
    icon: ScrollText,
    description: 'The winning solution becomes a mandate. Community members can pledge to support its implementation. This is the community\'s commitment to action.',
  },
];

const CreateInitiativePage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const t = useT();
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

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError(t('initiative.error.titleRequired', 'Please describe the problem'));
      return;
    }
    if (!description.trim()) {
      setError(t('initiative.error.descRequired', 'Please explain why this matters'));
      return;
    }
    if (!serverUrl || !publicKey || !communityId) {
      setError(t('common.notLoggedIn', 'Not logged in'));
      return;
    }

    const normalizedEvidence: string[] = [];
    for (const candidate of evidence) {
      const trimmed = candidate.trim();
      if (!trimmed) continue;

      const safeUrl = sanitizeExternalUrl(trimmed);
      if (!safeUrl) {
        setError(t('initiative.error.badEvidenceUrl', 'Evidence links must use a valid http or https URL'));
        return;
      }

      normalizedEvidence.push(safeUrl);
    }

    setIsSubmitting(true);
    try {
      await createInitiative(serverUrl, publicKey, communityId, {
        title: title.trim(),
        description: description.trim(),
        evidence: normalizedEvidence,
        countries,
      });
      dispatch(fetchCollaborations({ serverUrl, publicKey, contractId: communityId }));
      navigate(`/community/${communityId}`);
    } catch {
      setError(t('initiative.error.submitFailed', 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate(`/community/${communityId}`)}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={24} />
        </button>
        {/* Nested under CommunityView's AppHeader (community name = the page's
            single <h1>), so this title is an <h2>. */}
        <h2>{t('initiative.start', 'Start an initiative')}</h2>
        {/* Task-first: the "what is an initiative / 5 stages / tips" explainer
            prose lives behind the (i); the form below is the primary content. */}
        <InfoDisclosure
          className={styles.infoTrigger}
          size="md"
          label={t('initiative.howItWorks', 'How initiatives work')}
        >
          <div className={styles.explainer}>
            <section className={styles.explainerSection}>
              <h3>{t('initiative.whatTitle', 'What is an initiative?')}</h3>
              <p>
                {t(
                  'initiative.whatBody',
                  "An initiative is how your community turns a problem into action. You start one by naming a problem worth solving — then your community recognises it, discusses solutions, proposes actions, and votes on how to move forward.",
                )}
              </p>
              <p>
                {t(
                  'initiative.whatBody2',
                  'Think of it as a formal request for collective action — backed by a transparent, democratic process.',
                )}
              </p>
            </section>

            <section className={styles.explainerSection}>
              <h3>{t('initiative.stagesTitle', 'The 5 Stages')}</h3>
              <div className={styles.stepper}>
                {STAGES.map((stage, index) => {
                  const StageIcon = stage.icon;
                  return (
                    <div key={stage.id} className={styles.step}>
                      <div className={styles.stepIndicator}>
                        <div className={`${styles.stepCircle} ${styles[`stepCircle_${stage.id}`]}`}>
                          <StageIcon size={16} />
                        </div>
                        {index < STAGES.length - 1 && <div className={styles.stepLine} />}
                      </div>
                      <div className={styles.stepContent}>
                        <h4>{t(`stage.${stage.id}`, stage.name)}</h4>
                        <p>{t(`initiative.stages.${stage.id}.desc`, stage.description)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tips — each tip is a bold lead + body sentence. No <Trans>
                mechanism exists, so lead/body are split into sibling keys. */}
            <section className={`${styles.explainerSection} ${styles.tips}`}>
              <h3>{t('initiative.tipsTitle', 'What Makes a Good Initiative?')}</h3>
              <p><strong>{t('initiative.tips.specific.lead', 'Be specific.')}</strong> {t('initiative.tips.specific.body', '"Climate change is bad" won\'t get traction. "Our neighbourhood lacks recycling infrastructure" will.')}</p>
              <p><strong>{t('initiative.tips.why.lead', 'Explain why it matters.')}</strong> {t('initiative.tips.why.body', 'Help your community understand the impact. Who is affected? What happens if nothing changes?')}</p>
              <p><strong>{t('initiative.tips.evidence.lead', 'Provide evidence.')}</strong> {t('initiative.tips.evidence.body', 'Link to articles, reports, data, or personal accounts that support your case. Evidence builds trust and accelerates consensus.')}</p>
              <p><strong>{t('initiative.tips.local.lead', 'Think locally.')}</strong> {t('initiative.tips.local.body', 'The best initiatives are ones your community can actually act on.')}</p>
            </section>
          </div>
        </InfoDisclosure>
      </div>

      {/* Compact, read-only pipeline strip — keeps the 5-stage context visible
          even though the explainer prose is now behind the (i). */}
      <StageStrip />

      {/* Form */}
      <div className={styles.card}>
        <h2>{t('initiative.formTitle', 'Your Initiative')}</h2>

        <div className={styles.formGroup}>
          <label htmlFor="initiativeTitle" className={styles.label}>{t('initiative.form.titleLabel', "What's the problem?")}</label>
          <input
            id="initiativeTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('initiative.form.titlePlaceholder', 'Describe the problem in one clear sentence')}
            className={styles.inputField}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>{t('initiative.form.titleHint', "Be specific and actionable. This becomes the initiative's title.")}</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="initiativeDesc" className={styles.label}>{t('initiative.form.descLabel', 'Why does this matter?')}</label>
          <textarea
            id="initiativeDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('initiative.form.descPlaceholder', 'Explain the impact and why your community should care')}
            className={`${styles.inputField} ${styles.textarea}`}
            rows={6}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>{t('initiative.form.descHint', 'This is your case for action. Be persuasive but honest.')}</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('initiative.form.evidenceLabel', 'Supporting evidence')}</label>
          <p className={styles.hint}>{t('initiative.form.evidenceHint', 'Links to articles, reports, or data that back up your case.')}</p>
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
                  aria-label={t('initiative.form.removeLink', 'Remove link')}
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
            {t('initiative.form.addLink', 'Add link')}
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('initiative.form.countriesLabel', 'Countries affected')}</label>
          <p className={styles.hint}>{t('initiative.form.countriesHint', 'Select which countries are most affected by this problem.')}</p>
          <CountryMultiSelect
            value={countries}
            onChange={setCountries}
            ariaLabel={t('initiative.form.countriesLabel', 'Countries affected')}
            disabled={isSubmitting}
          />
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <Button
          size="lg"
          fullWidth
          className={styles.submit}
          loading={isSubmitting}
          disabled={!title.trim() || !description.trim()}
          onClick={handleSubmit}
        >
          {isSubmitting ? t('initiative.submitting', 'Submitting…') : t('initiative.start', 'Start an initiative')}
        </Button>
      </div>
    </div>
  );
};

export default CreateInitiativePage;
