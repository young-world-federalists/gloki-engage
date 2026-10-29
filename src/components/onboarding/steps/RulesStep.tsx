import React from 'react';
import { Button } from '../../shared';
import { MessagesSquare, Scale, HeartHandshake, Lock } from 'lucide-react';
import { useT } from '../../../i18n';
import styles from './steps.module.scss';

interface Props {
  onAgree: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

/**
 * Consent step (S11 P2). No longer skippable — core consent is required. Beyond
 * the four community promises it names what we collect and links placeholder
 * privacy/data terms, honest that this is a pilot stub where nothing leaves the
 * browser. The single primary action records consent.
 */
const RulesStep: React.FC<Props> = ({ onAgree, onBack, headingRef }) => {
  const t = useT();
  const rules = [
    { icon: <MessagesSquare aria-hidden />, text: t('onboarding.rules.discuss', 'We discuss before we vote.') },
    { icon: <Scale aria-hidden />, text: t('onboarding.rules.equal', "One person, one voice — everyone gets the same say, and no one can buy more. When you vote, you spread that equal say across the issues you care about.") },
    { icon: <HeartHandshake aria-hidden />, text: t('onboarding.rules.kind', 'Disagree kindly — challenge ideas, not people.') },
    { icon: <Lock aria-hidden />, text: t('onboarding.rules.data', 'Your data stays yours.') },
  ];
  const collected = [
    t('onboarding.consent.collect.key', 'Your public key — the identifier for your account'),
    t('onboarding.consent.collect.profile', 'Your profile: display name, photo, country, language'),
    t('onboarding.consent.collect.votes', 'What you post and how you vote (visible to your community)'),
    t('onboarding.consent.collect.server', 'The server address your community runs on'),
  ];
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.rules.title', 'How we work together')}
      </h1>
      <p className={styles.lead}>{t('onboarding.rules.lead', 'Four simple promises everyone here makes.')}</p>
      <ul className={styles.ruleList}>
        {rules.map((rule, i) => (
          <li key={i} className={styles.rule}>
            <span className={styles.ruleIcon}>{rule.icon}</span>
            <span>{rule.text}</span>
          </li>
        ))}
      </ul>

      <h2 className={styles.subheading}>{t('onboarding.consent.collectTitle', 'What we collect')}</h2>
      <ul className={styles.collectList}>
        {collected.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
      <p className={styles.consentNote}>
        {t('onboarding.consent.pilotNote', 'This is an early pilot — nothing here leaves your browser yet.')}{' '}
        <a href="#privacy" className={styles.consentLink}>{t('onboarding.consent.privacyLink', 'Privacy notice')}</a>
        {' · '}
        <a href="#data" className={styles.consentLink}>{t('onboarding.consent.dataLink', 'How your data is used')}</a>
        {' '}({t('onboarding.consent.placeholder', 'placeholders for the pilot')})
      </p>

      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onAgree}>
          {t('onboarding.consent.agree', 'I understand and agree')}
        </Button>
        <div className={styles.secondaryActions}>
          <Button variant="ghost" onClick={onBack}>
            {t('common.back', 'Back')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RulesStep;
