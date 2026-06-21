import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Key, Server, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { Button, Card, Modal, EmptyState, Banner, SearchableSelect } from '../shared';
import { useT } from '../../i18n';
import DigitalAgentCard from './DigitalAgentCard';
import PhotoPicker from './PhotoPicker';
import { useDigitalAgent } from './agent/useDigitalAgent';
import { COUNTRIES, OTHER_COUNTRY } from '../../utils/countries';
import { LANGUAGE_OPTIONS } from '../../utils/languages';
import { getLocalOpenAIApiKey, setLocalOpenAIApiKey } from '../../utils/localSecrets';
import styles from './Profile.module.scss';

const Profile: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.user);
  const { agent, hasAgent, isOnboarded, saveAgent } = useDigitalAgent();

  const [editing, setEditing] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);

  // Edit-form local state (seeded from the stored agent on open).
  const [displayName, setDisplayName] = useState('');
  const [photo, setPhoto] = useState('');
  const [country, setCountry] = useState('');
  // Single primary language (legacy multi-language agents collapse to their first).
  const [language, setLanguage] = useState('');
  const [apiKey, setApiKey] = useState('');

  const openEdit = () => {
    setDisplayName(agent?.displayName ?? '');
    setPhoto(agent?.photo ?? '');
    setCountry(agent?.country ?? '');
    setLanguage(agent?.languages?.[0] ?? '');
    setApiKey(getLocalOpenAIApiKey(user.serverUrl, user.publicKey));
    setEditing(true);
  };

  const saveEdit = () => {
    saveAgent({ displayName: displayName.trim(), photo, country, languages: language ? [language] : [] });
    if (user.serverUrl && user.publicKey) setLocalOpenAIApiKey(user.serverUrl, user.publicKey, apiKey);
    setEditing(false);
  };

  return (
    <div className={styles.container}>
      {/* Route heading — the page leads visually with the agent card, so the
          single <h1> is screen-reader-only (no visible title to promote). */}
      <h1 className={styles.srOnly}>{t('profile.title', 'Profile')}</h1>
      {!isOnboarded && hasAgent && (
        <Banner
          tone="info"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/welcome')}>
              {t('common.continue', 'Continue')}
            </Button>
          }
        >
          {t('agent.finishNudge', 'Finish setting up your profile')}
        </Banner>
      )}

      {hasAgent && agent ? (
        <DigitalAgentCard agent={agent} onEdit={openEdit} />
      ) : (
        <EmptyState
          icon={<UserPlus size={48} />}
          title={t('agent.empty.title', 'Set up your profile')}
          message={t('agent.empty.message', 'Create the identity that represents you in deliberations — it only takes a minute.')}
          action={<Button onClick={() => navigate('/welcome')}>{t('agent.empty.cta', 'Get started')}</Button>}
        />
      )}

      {/* Network identity (read-only, informative) */}
      <button
        className={styles.identityToggle}
        onClick={() => setShowIdentity((v) => !v)}
        aria-expanded={showIdentity}
      >
        <span>{t('agent.networkIdentity', 'Network identity')}</span>
        {showIdentity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {showIdentity && (
        <Card className={styles.identityCard}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <Key size={14} /> {t('agent.publicKey', 'Public key')}
            </span>
            <code className={styles.infoValue}>{user.publicKey || '—'}</code>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>
              <Server size={14} /> {t('agent.serverUrl', 'Server')}
            </span>
            <code className={styles.infoValue}>{user.serverUrl || '—'}</code>
          </div>
        </Card>
      )}

      {/* Edit modal */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title={t('agent.edit.title', 'Edit profile')}
        closeLabel={t('common.close', 'Close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={saveEdit}>{t('common.save', 'Save')}</Button>
          </>
        }
      >
        <div className={styles.editForm}>
          <div className={styles.photoRow}>
            <PhotoPicker value={photo} onChange={setPhoto} label={t('onboarding.agent.photo', 'Add a photo (optional)')} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-name">
              {t('onboarding.agent.name', 'Your name')}
            </label>
            <input id="edit-name" className={styles.input} type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-country">
              {t('onboarding.agent.country', 'Your country')}
            </label>
            <SearchableSelect
              options={[
                ...COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag })),
                { value: OTHER_COUNTRY.code, label: OTHER_COUNTRY.name, icon: OTHER_COUNTRY.flag },
              ]}
              value={country}
              onChange={setCountry}
              placeholder={t('onboarding.agent.countryPlaceholder', 'Select your country')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-language">
              {t('onboarding.agent.language', 'Your language')}
            </label>
            <SearchableSelect
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={setLanguage}
              placeholder={t('onboarding.agent.languagePlaceholder', 'Select your language')}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="edit-key">
              {t('agent.aiKey', 'AI API key (stored on this device)')}
            </label>
            <input
              id="edit-key"
              className={styles.input}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('common.optional', 'Optional')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
