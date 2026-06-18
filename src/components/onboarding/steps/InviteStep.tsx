import React from 'react';
import { Button, GlokiMark, CountryFlag } from '../../shared';
import { useT } from '../../../i18n';
import type { Persona } from '../../../services/demo/fixtures/identity';
import styles from './steps.module.scss';

interface Props {
  voucher: Persona;
  onContinue: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const InviteStep: React.FC<Props> = ({ voucher, onContinue, headingRef }) => {
  const t = useT();
  return (
    <section className={styles.step}>
      <div className={styles.hero}>
        <GlokiMark size={64} />
      </div>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.invite.title', "You've been invited")}
      </h1>
      <p className={styles.lead}>
        {t(
          'onboarding.invite.lead',
          '{name} invited you to Voices for the Climate — where young people across Africa decide what to do about the climate, together.',
          { name: voucher.firstName },
        )}
      </p>
      <div className={styles.inviterRow}>
        <CountryFlag code={voucher.country} showName />
      </div>
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onContinue}>
          {t('common.continue', 'Continue')}
        </Button>
      </div>
    </section>
  );
};

export default InviteStep;
