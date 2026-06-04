import React from 'react';
import { Button } from '../../shared';
import { useT } from '../../../i18n';
import HowGlokiWorks from '../HowGlokiWorks';
import styles from './steps.module.scss';

interface Props {
  vouchCount: number;
  onContinue: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const HowItWorksStep: React.FC<Props> = ({ vouchCount, onContinue, onBack, headingRef }) => {
  const t = useT();
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.how.title', 'How Gloki works')}
      </h1>
      <p className={styles.lead}>
        {t('onboarding.how.lead', 'Here’s how your community turns ideas into action.')}
      </p>
      <HowGlokiWorks variant="compact" vouchCount={vouchCount} />
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onContinue}>
          {t('common.continue', 'Continue')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onBack}>
          {t('common.back', 'Back')}
        </Button>
      </div>
    </section>
  );
};

export default HowItWorksStep;
