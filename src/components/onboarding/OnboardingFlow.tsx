import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper, Button, Card } from '../shared';
import AppHeader from '../AppHeader';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { isBeta } from '../../appMode';
import { useDigitalAgent } from '../identity/agent/useDigitalAgent';
import { getVoucher, defaultVouchers } from '../../services/demo/fixtures/identity';
import { ONBOARDING_SEED } from '../../services/trustModel';
import { getBetaDoor } from './betaDoor';
import InviteStep from './steps/InviteStep';
import VouchStep from './steps/VouchStep';
import HowItWorksStep from './steps/HowItWorksStep';
import AgentStep from './steps/AgentStep';
import RulesStep from './steps/RulesStep';
import ReadyStep from './steps/ReadyStep';
import BackupStep from './steps/BackupStep';
import KindStep from './steps/KindStep';
import styles from './OnboardingFlow.module.scss';

type StepId = 'invite' | 'vouch' | 'how' | 'agent' | 'rules' | 'ready' | 'backup' | 'kind';

// The demo journey: invite → vouch → Digital Agent → consent → ready.
const DEMO_STEPS: StepId[] = ['invite', 'vouch', 'how', 'agent', 'rules', 'ready'];
// S42 — the beta journey: save your key → account kind → profile → ready.
// Invite, trust and the pipeline explainer are demo framing; hidden, not deleted.
const BETA_STEPS: StepId[] = ['backup', 'kind', 'agent', 'ready'];

/**
 * Lane A — guided first-run journey, routed at `/welcome/*`.
 * Single screen, resumable. The step list depends on the build mode (appMode.ts).
 */
const OnboardingFlow: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const publicKey = useAppSelector((s) => s.user.publicKey) ?? '';
  const { agent, progress, isOnboarded, saveAgent, saveProgress, startOver } = useDigitalAgent();

  const stepIds = isBeta ? BETA_STEPS : DEMO_STEPS;
  const lastStep = stepIds.length - 1;
  const voucher = getVoucher(params.get('invite'));
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [step, setStep] = useState(progress.completed ? 0 : Math.min(progress.step, lastStep));

  // Seed the vouch as soon as the newcomer arrives, so it survives a later skip.
  // S42: not in the beta — nobody has vouched for a real newcomer yet, and the
  // verification hub says so honestly.
  useEffect(() => {
    if (!isBeta && !agent?.invitedBy) {
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
  const next = () => go(Math.min(step + 1, lastStep));
  const back = () => go(Math.max(step - 1, 0));
  const exploreTo = isBeta ? '/forum' : '/stage/problem';

  // Return state: already onboarded → compact "all set" with Start over.
  if (isOnboarded) {
    return (
      // Banner + main#main keep the entry route inside the page model — skip
      // link, landmark, and the step hero as the page's h1 (S18 W1, campaign M1).
      <div className={styles.flow}>
        <AppHeader />
        <main id="main" tabIndex={-1} className={styles.flowMain}>
          <Card className={styles.doneCard}>
            <h1 className={styles.doneTitle}>{t('onboarding.alreadyDone.title', "You're all set up")}</h1>
            <p className={styles.doneLead}>
              {isBeta
                ? t('beta.alreadyDone.lead', 'Your account is ready. Open the forum, or start the welcome guide over.')
                : t('onboarding.alreadyDone.lead', 'Your profile is ready. Jump back into the deliberation, or start the welcome guide over.')}
            </p>
            <div className={styles.doneActions}>
              <Button fullWidth onClick={() => navigate(exploreTo)}>
                {isBeta ? t('beta.forum.open', 'Open the forum') : t('onboarding.cta.explore', 'Explore Gloki')}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { startOver(); setStep(0); }}>
                {t('onboarding.cta.startOver', 'Start over')}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const labels: Record<StepId, string> = {
    invite: t('onboarding.step.invite', 'Invite'),
    vouch: t('onboarding.step.vouch', 'Trust'),
    how: t('onboarding.step.how', 'How'),
    agent: t('onboarding.step.agent', 'You'),
    rules: t('onboarding.step.rules', 'Rules'),
    ready: t('onboarding.step.ready', 'Ready'),
    backup: t('beta.step.backup', 'Key'),
    kind: t('beta.step.kind', 'Kind'),
  };
  const steps = stepIds.map((id) => ({ label: labels[id] }));
  const current = stepIds[step];
  const vouchCount = agent?.vouchedBy?.length ?? 1;
  // The beta never asks for the deliberation consent (no deliberation yet), so
  // the Ready step must not nudge for it.
  const consented = isBeta || !!agent?.consentedAt;

  return (
    // Same page-model wrapper as the done branch (S18 W1, campaign M1); the
    // active step's hero heading is the page's h1.
    <div className={styles.flow}>
      <AppHeader />
      <main id="main" tabIndex={-1} className={styles.flowMain}>
        <div className={styles.stepperWrap}>
          <Stepper steps={steps} current={step} onStepClick={(i) => go(i)} />
        </div>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {t('onboarding.announce', 'Step {n} of {total}: {label}', { n: step + 1, total: steps.length, label: steps[step].label })}
        </p>

        <div className={styles.stepBody}>
          {current === 'invite' && <InviteStep headingRef={headingRef} voucher={voucher} onContinue={next} />}
          {current === 'vouch' && (
            <VouchStep headingRef={headingRef} voucher={voucher} vouchCount={vouchCount} onBack={back} onContinue={next} />
          )}
          {current === 'how' && (
            <HowItWorksStep
              headingRef={headingRef}
              vouchCount={agent?.vouchedBy?.length ?? ONBOARDING_SEED}
              onBack={back}
              onContinue={next}
            />
          )}
          {current === 'backup' && <BackupStep headingRef={headingRef} publicKey={publicKey} onContinue={next} />}
          {current === 'kind' && (
            <KindStep
              headingRef={headingRef}
              value={agent?.accountKind ?? getBetaDoor()}
              onBack={back}
              onContinue={(accountKind) => { saveAgent({ accountKind }); next(); }}
            />
          )}
          {current === 'agent' && (
            <AgentStep
              headingRef={headingRef}
              agent={agent}
              voucher={voucher}
              onBack={back}
              onContinue={(fields) => { saveAgent(fields); next(); }}
              onSkip={next}
            />
          )}
          {current === 'rules' && (
            <RulesStep
              headingRef={headingRef}
              onBack={back}
              onAgree={() => { saveAgent({ consentedAt: Date.now() }); next(); }}
            />
          )}
          {current === 'ready' && (
            <ReadyStep
              headingRef={headingRef}
              agent={agent}
              consented={consented}
              onConsentNudge={() => go(Math.max(stepIds.indexOf('rules'), 0))}
              onExplore={() => { saveProgress({ completed: true }); navigate(exploreTo); }}
              onViewAgent={() => { saveProgress({ completed: true }); navigate('/identity/profile'); }}
              onVerify={isBeta ? () => { saveProgress({ completed: true }); navigate('/identity/verification'); } : undefined}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default OnboardingFlow;
