import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Coins, Users2, Shield, Globe, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createCommunity } from '../services/contracts/community';
import { isDemoContract } from '../services/demo/demoRegistry';
import { seedDemoCommunity } from '../services/demo/seedDemoCommunity';
import { fetchContracts } from '../store/slices/userSlice';
import { useT } from '../i18n';
import styles from './CreateCommunityPage.module.scss';

// English here is the source copy; the render wires each field through t()
// (createCommunity.feature.{id}.*).
const FEATURES = [
  {
    id: 'governance',
    name: 'Governance Pipeline',
    icon: GitBranch,
    description: '5-stage democratic process from problem recognition to mandated action',
  },
  {
    id: 'currency',
    name: 'Community Currency',
    icon: Coins,
    description: 'Mint, send, and manage a currency owned by your community',
  },
  {
    id: 'collab',
    name: 'Collaboration Tools',
    icon: Users2,
    description: 'Shared workspaces for documents, tasks, scheduling, and roles',
  },
  {
    id: 'trust',
    name: 'Identity & Trust',
    icon: Shield,
    description: 'Verify members through a web of trust, QR-based identity cards',
  },
  {
    id: 'translation',
    name: 'AI Translation',
    icon: Globe,
    description: 'Automatic translation across 12 languages so everyone can participate',
  },
];

const CreateCommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const t = useT();
  const { publicKey, serverUrl, profileContractId } = useAppSelector((s) => s.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError(t('createCommunity.error.nameRequired', 'Please enter a community name'));
      return;
    }
    if (!serverUrl || !publicKey) {
      setError(t('common.notLoggedIn', 'Not logged in'));
      return;
    }

    setIsSubmitting(true);
    try {
      const contractId = await createCommunity(
        serverUrl,
        publicKey,
        name.trim(),
        description.trim(),
        profileContractId,
      );

      if (contractId && isDemoContract(contractId)) {
        seedDemoCommunity(contractId, publicKey);
      }

      // Refresh the contracts list so the new (including demo) community shows up.
      await dispatch(fetchContracts());

      navigate(contractId && isDemoContract(contractId) ? `/community/${contractId}` : '/identity/communities');
    } catch (err) {
      console.error('[CreateCommunity] Deploy failed:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(t('createCommunity.error.failed', 'Failed to create community: {detail}', { detail }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/identity/communities')}
          aria-label={t('common.back', 'Back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>{t('createCommunity.title', 'Create a Community')}</h1>
      </div>

      {/* What is a Community? */}
      <div className={styles.card}>
        <h2>{t('createCommunity.whatTitle', 'What is a Community on Gloki?')}</h2>
        <p>
          {t(
            'createCommunity.whatBody',
            'A community is a group of people united by a shared interest, location, cause, or goal. On Gloki, communities are spaces for collective decision-making — where members can identify problems, propose solutions, and vote on actions together.',
          )}
        </p>
        <p>
          {t(
            'createCommunity.whatBody2',
            'Every community on Gloki has access to the same democratic tools: a 5-stage governance pipeline, community currency, collaboration workspaces, and identity verification.',
          )}
        </p>
      </div>

      {/* Why Create? — bold lead + body split around <strong> (no <Trans>; W5 may restructure) */}
      <div className={styles.card}>
        <h2>{t('createCommunity.whyTitle', 'Why Create a Community?')}</h2>
        <p>
          <strong>{t('createCommunity.why.democracy.lead', 'Bring direct democracy to your group.')}</strong>{' '}
          {t('createCommunity.why.democracy.body', "Whether you're a neighbourhood association, a student union, a workplace team, or an activist collective — Gloki gives your group the tools to make decisions transparently and fairly.")}
        </p>
        <p>
          <strong>{t('createCommunity.why.voice.lead', 'Every voice counts.')}</strong>{' '}
          {t('createCommunity.why.voice.body', 'Quadratic voting ensures no single person dominates the outcome. Thresholds ensure decisions have genuine community support before moving forward.')}
        </p>
        <p>
          <strong>{t('createCommunity.why.mandates.lead', 'From problems to mandates.')}</strong>{' '}
          {t('createCommunity.why.mandates.body', "Don't just talk about issues — turn them into commitments. Gloki's pipeline moves problems through discussion, proposals, and voting into mandates your community can act on.")}
        </p>
      </div>

      {/* Features */}
      <div className={styles.card}>
        <h2>{t('createCommunity.featuresTitle', 'What Gloki Provides Your Community')}</h2>
        <div className={styles.featureList}>
          {FEATURES.map((feature) => {
            const FeatureIcon = feature.icon;
            return (
              <div key={feature.id} className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FeatureIcon size={16} />
                </div>
                <div className={styles.featureContent}>
                  <h3>{t(`createCommunity.feature.${feature.id}.name`, feature.name)}</h3>
                  <p>{t(`createCommunity.feature.${feature.id}.desc`, feature.description)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <div className={styles.card}>
        <h2>{t('createCommunity.formTitle', 'What We Need From You')}</h2>
        <p>{t('createCommunity.formIntro', 'To create a community, we just need two things:')}</p>

        <div className={styles.formGroup}>
          <label htmlFor="communityName" className={styles.label}>{t('createCommunity.form.nameLabel', 'Community name')}</label>
          <input
            id="communityName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('createCommunity.form.namePlaceholder', 'e.g. Berlin Climate Action Network')}
            className={styles.inputField}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>{t('createCommunity.form.nameHint', 'This is how your community appears to other Gloki users.')}</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="communityDesc" className={styles.label}>{t('createCommunity.form.descLabel', 'Description')}</label>
          <textarea
            id="communityDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('createCommunity.form.descPlaceholder', 'What is this community about? What are you trying to achieve?')}
            className={`${styles.inputField} ${styles.textarea}`}
            rows={4}
            disabled={isSubmitting}
          />
          <p className={styles.hint}>{t('createCommunity.form.descHint', 'A good description helps attract the right members.')}</p>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? t('createCommunity.submitting', 'Creating...') : t('createCommunity.submit', 'Create Community')}
        </button>
        {!isSubmitting && !name.trim() && (
          <p className={styles.submitHint}>{t('createCommunity.submitHint', 'Enter a community name to continue.')}</p>
        )}
      </div>
    </div>
  );
};

export default CreateCommunityPage;
