import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper, Button, Card } from '../shared';
import { useT } from '../../i18n';
import { useDigitalAgent } from '../identity/agent/useDigitalAgent';
import { getVoucher, defaultVouchers } from '../../services/demo/fixtures/identity';
import { ONBOARDING_SEED } from '../../services/trustModel';
import InviteStep from './steps/InviteStep';
import VouchStep from './steps/VouchStep';
import HowItWorksStep from './steps/HowItWorksStep';
import AgentStep from './steps/AgentStep';
import RulesStep from './steps/RulesStep';
import ReadyStep from './steps/ReadyStep';
import styles from './OnboardingFlow.module.scss';

/**
 * Lane A — guided first-run journey, routed at `/welcome/*`.
 * Single screen, resumable: invite → vouch → Digital Agent → consent → ready.
 */
const OnboardingFlow: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { agent, progress, isOnboarded, saveAgent, saveProgress, startOver } = useDigitalAgent();

  const voucher = getVoucher(params.get('invite'));
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [step, setStep] = useState(progress.completed ? 0 : progress.step);

  // Seed the vouch as soon as the newcomer arrives, so it survives a later skip.
  useEffect(() => {
    if (!agent?.invitedBy) {
      saveAgent({ invitedBy: voucher.publicKey, vouchedBy: defaultVouchers(voucher.publicKey) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the step heading on each step change (announced via the live region).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const go = (next: number) => {
    setStep(next);
    saveProgress({ step: next });
  };

  // Return state: already onboarded → compact "all set" with Start over.
  if (isOnboarded) {
    return (
      <div className={styles.flow}>
        <Card className={styles.doneCard}>
          <h1 className={styles.doneTitle}>{t('onboarding.alreadyDone.title', "You're all set up")}</h1>
          <p className={styles.doneLead}>
            {t('onboarding.alreadyDone.lead', 'Your Digital Agent is ready. Jump back into the deliberation, or start the welcome guide over.')}
          </p>
          <div className={styles.doneActions}>
            <Button fullWidth onClick={() => navigate('/stage/problem')}>
              {t('onboarding.cta.explore', 'Explore the climate deliberation')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => { startOver(); setStep(0); }}>
              {t('onboarding.cta.startOver', 'Start over')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { label: t('onboarding.step.invite', 'Invite') },
    { label: t('onboarding.step.vouch', 'Trust') },
    { label: t('onboarding.step.how', 'How') },
    { label: t('onboarding.step.agent', 'You') },
    { label: t('onboarding.step.rules', 'Rules') },
    { label: t('onboarding.step.ready', 'Ready') },
  ];
  const vouchCount = agent?.vouchedBy?.length ?? 1;
  const consented = !!agent?.consentedAt;

  return (
    <div className={styles.flow}>
      <div className={styles.stepperWrap}>
        <Stepper steps={steps} current={step} onStepClick={(i) => go(i)} />
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite">
        {t('onboarding.announce', 'Step {n} of {total}: {label}', { n: step + 1, total: steps.length, label: steps[step].label })}
      </p>

      <div className={styles.stepBody}>
        {step === 0 && <InviteStep headingRef={headingRef} voucher={voucher} onContinue={() => go(1)} />}
        {step === 1 && (
          <VouchStep headingRef={headingRef} voucher={voucher} vouchCount={vouchCount} onBack={() => go(0)} onContinue={() => go(2)} />
        )}
        {step === 2 && (
          <HowItWorksStep
            headingRef={headingRef}
            vouchCount={agent?.vouchedBy?.length ?? ONBOARDING_SEED}
            onBack={() => go(1)}
            onContinue={() => go(3)}
          />
        )}
        {step === 3 && (
          <AgentStep
            headingRef={headingRef}
            agent={agent}
            voucher={voucher}
            onBack={() => go(2)}
            onContinue={(fields) => { saveAgent(fields); go(4); }}
            onSkip={() => go(4)}
          />
        )}
        {step === 4 && (
          <RulesStep
            headingRef={headingRef}
            onBack={() => go(3)}
            onAgree={() => { saveAgent({ consentedAt: Date.now() }); go(5); }}
            onSkip={() => go(5)}
          />
        )}
        {step === 5 && (
          <ReadyStep
            headingRef={headingRef}
            agent={agent}
            consented={consented}
            onConsentNudge={() => go(4)}
            onExplore={() => { saveProgress({ completed: true }); navigate('/stage/problem'); }}
            onViewAgent={() => { saveProgress({ completed: true }); navigate('/identity/profile'); }}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
