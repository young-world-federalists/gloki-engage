import React from 'react';
import { Button } from '../../shared';
import { MessagesSquare, Scale, HeartHandshake, Lock } from 'lucide-react';
import { useT } from '../../../i18n';
import styles from './steps.module.scss';

interface Props {
  onAgree: () => void;
  onSkip: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const RulesStep: React.FC<Props> = ({ onAgree, onSkip, onBack, headingRef }) => {
  const t = useT();
  const rules = [
    { icon: <MessagesSquare aria-hidden />, text: t('onboarding.rules.discuss', 'We discuss before we vote.') },
    { icon: <Scale aria-hidden />, text: t('onboarding.rules.equal', "One person, one voice — everyone gets the same say, and no one can buy more. When you vote, you spread that equal say across the issues you care about.") },
    { icon: <HeartHandshake aria-hidden />, text: t('onboarding.rules.kind', 'Disagree kindly — challenge ideas, not people.') },
    { icon: <Lock aria-hidden />, text: t('onboarding.rules.data', 'Your data stays yours.') },
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
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onAgree}>
          {t('onboarding.rules.agree', 'I agree')}
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

export default RulesStep;
