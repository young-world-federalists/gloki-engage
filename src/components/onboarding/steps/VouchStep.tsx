import React from 'react';
import { Button, Card, CountryFlag } from '../../shared';
import { ShieldCheck } from 'lucide-react';
import { useT } from '../../../i18n';
import { initialsOf } from '../../../utils/initials';
import type { Persona } from '../../../services/demo/fixtures/identity';
import styles from './steps.module.scss';

interface Props {
  voucher: Persona;
  vouchCount: number;
  onContinue: () => void;
  onBack: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const VouchStep: React.FC<Props> = ({ voucher, vouchCount, onContinue, onBack, headingRef }) => {
  const t = useT();
  const others = Math.max(0, vouchCount - 1);
  return (
    <section className={styles.step}>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.vouch.title', 'A friend vouched for you')}
      </h1>
      <Card className={styles.voucherCard}>
        <div className={styles.voucherAvatar} aria-hidden>
          {initialsOf(`${voucher.firstName} ${voucher.lastName}`)}
        </div>
        <div className={styles.voucherInfo}>
          <span className={styles.voucherName}>
            {voucher.firstName} {voucher.lastName}
          </span>
          <CountryFlag code={voucher.country} showName size="sm" />
        </div>
        <ShieldCheck className={styles.voucherBadge} aria-hidden />
      </Card>
      {others > 0 && (
        <p className={styles.vouchedBy}>
          {t('onboarding.vouch.alsoVouched', 'Vouched by {count} people in the community', { count: vouchCount })}
        </p>
      )}
      <p className={styles.lead}>
        {t(
          'onboarding.vouch.explain',
          "A vouch is how Gloki stays real people, not bots. It's lightweight trust — no ID papers, no face scan. Someone already here said: this person belongs.",
        )}
      </p>
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

export default VouchStep;
