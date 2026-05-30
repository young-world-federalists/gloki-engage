import React, { useState } from 'react';
import clsx from 'clsx';
import { Button, SearchableSelect } from '../../shared';
import { useT } from '../../../i18n';
import PhotoPicker from '../../identity/PhotoPicker';
import { getInitials, type DigitalAgent } from '../../identity/agent/digitalAgentStore';
import { ONBOARDING_LANGUAGES, type Persona } from '../../../services/demo/fixtures/identity';
import { COUNTRIES, OTHER_COUNTRY } from '../../../utils/countries';
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
  const [languages, setLanguages] = useState<string[]>(
    agent?.languages?.length ? agent.languages : voucher.languages,
  );

  const toggleLang = (code: string) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));

  const submit = () => onContinue({ displayName: displayName.trim(), photo, country, languages });

  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.agent.title', 'Create your Digital Agent')}
      </h1>
      <p className={styles.lead}>
        {t('onboarding.agent.lead', 'Your Digital Agent represents you in deliberations. You can change any of this later.')}
      </p>

      <div className={styles.photoRow}>
        <PhotoPicker
          value={photo}
          onChange={setPhoto}
          initials={getInitials(displayName)}
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
        <span className={styles.fieldLabel}>{t('onboarding.agent.languages', 'Languages you speak')}</span>
        <div className={styles.chips} role="group" aria-label={t('onboarding.agent.languages', 'Languages you speak')}>
          {ONBOARDING_LANGUAGES.map((lang) => {
            const active = languages.includes(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                className={clsx(styles.chip, active && styles.chipActive)}
                aria-pressed={active}
                onClick={() => toggleLang(lang.code)}
              >
                {t(`lang.${lang.code}`, lang.defaultLabel)}
              </button>
            );
          })}
        </div>
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
