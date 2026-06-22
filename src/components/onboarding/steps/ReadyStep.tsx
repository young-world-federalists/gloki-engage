import React from 'react';
import { Button, Card, CountryFlag, Badge, Banner } from '../../shared';
import { CheckCircle2 } from 'lucide-react';
import { useT } from '../../../i18n';
import { getInitials, type DigitalAgent } from '../../identity/agent/digitalAgentStore';
import { getLanguageNative } from '../../../utils/languages';
import styles from './steps.module.scss';

interface Props {
  agent: DigitalAgent | null;
  consented: boolean;
  onExplore: () => void;
  onViewAgent: () => void;
  onConsentNudge: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

const ReadyStep: React.FC<Props> = ({ agent, consented, onExplore, onViewAgent, onConsentNudge, headingRef }) => {
  const t = useT();
  const name = agent?.displayName?.trim();
  return (
    <section className={styles.step}>
      <div className={styles.readyIcon} aria-hidden>
        <CheckCircle2 size={56} />
      </div>
      <h1 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t('onboarding.ready.title', "You're ready to participate")}
      </h1>
      <Card className={styles.recapCard}>
        <div className={styles.recapAvatar} aria-hidden>
          {agent?.photo ? <img src={agent.photo} alt="" /> : <span>{getInitials(name || '')}</span>}
        </div>
        <div className={styles.recapInfo}>
          <span className={styles.recapName}>{name || t('onboarding.ready.anon', 'Your profile')}</span>
          <div className={styles.recapMeta}>
            {agent?.country && <CountryFlag code={agent.country} showName size="sm" />}
            {agent?.languages?.map((code) => (
              <Badge key={code} tone="neutral" size="sm">
                {getLanguageNative(code)}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
      {!consented && (
        <Banner
          tone="info"
          action={
            <Button size="sm" variant="secondary" onClick={onConsentNudge}>
              {t('onboarding.ready.review', 'Review')}
            </Button>
          }
        >
          {t('onboarding.ready.consentNudge', 'You skipped the community promises — take a quick look when you can.')}
        </Banner>
      )}
      <div className={styles.actions}>
        <Button fullWidth size="lg" onClick={onExplore}>
          {t('onboarding.cta.explore', 'Explore Gloki')}
        </Button>
        <Button variant="secondary" fullWidth onClick={onViewAgent}>
          {t('onboarding.cta.viewAgent', 'View my profile')}
        </Button>
      </div>
    </section>
  );
};

export default ReadyStep;
