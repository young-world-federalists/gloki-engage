import React, { useState } from 'react';
import { Button, SearchableSelect } from '../../shared';
import { useT } from '../../../i18n';
import PhotoPicker from '../../identity/PhotoPicker';
import { type DigitalAgent } from '../../identity/agent/digitalAgentStore';
import { type Persona } from '../../../services/demo/fixtures/identity';
import { COUNTRIES, OTHER_COUNTRY } from '../../../utils/countries';
import { LANGUAGE_OPTIONS } from '../../../utils/languages';
import styles from './steps.module.scss';

export interface AgentFields {
  displayName: string;
  photo: string;
  country: string;
  languages: string[];
}

interface Props {
  agent: DigitalAgent | null;
  voucher: Persona;
  onContinue: (fields: AgentFields) => void;
  onSkip: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const AgentStep: React.FC<Props> = ({ agent, voucher, onContinue, onSkip, onBack, headingRef }) => {
  const t = useT();
  const [displayName, setDisplayName] = useState(agent?.displayName ?? '');
  const [photo, setPhoto] = useState(agent?.photo ?? '');
  const [country, setCountry] = useState(agent?.country || voucher.country);
  // Single primary language (legacy multi-language agents collapse to their first).
  const [language, setLanguage] = useState(agent?.languages?.[0] || voucher.languages?.[0] || '');

  const submit = () =>
    onContinue({ displayName: displayName.trim(), photo, country, languages: language ? [language] : [] });

  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.agent.title', 'Create your profile')}
      </h1>
      <p className={styles.lead}>
        {t('onboarding.agent.lead', 'Your profile represents you in deliberations. You can change any of this later.')}
      </p>

      <div className={styles.photoRow}>
        <PhotoPicker
          value={photo}
          onChange={setPhoto}
          label={t('onboarding.agent.photo', 'Add a photo (optional)')}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="agent-name">
          {t('onboarding.agent.name', 'Your name')}
        </label>
        <input
          id="agent-name"
          className={styles.input}
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('onboarding.agent.namePlaceholder', 'How should we call you?')}
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="agent-country">
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
        <label className={styles.fieldLabel} htmlFor="agent-language">
          {t('onboarding.agent.language', 'Your language')}
        </label>
        <SearchableSelect
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={setLanguage}
          placeholder={t('onboarding.agent.languagePlaceholder', 'Select your language')}
        />
      </div>

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={submit}>
          {t('common.continue', 'Continue')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            {t('onboarding.skip', 'Skip for now')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AgentStep;
