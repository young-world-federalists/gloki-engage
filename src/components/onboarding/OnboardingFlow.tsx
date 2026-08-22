import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stepper, Button, Card } from '../shared';
import AppHeader from '../AppHeader';
import { useT } from '../../i18n';
import { useDigitalAgent } from '../identity/agent/useDigitalAgent';
import { saveDigitalAgentProfile, type DigitalAgentProfileFields } from '../identity/agent/digitalAgentContract';
import { setDigitalAgentProfile } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getVoucher, defaultVouchers } from '../../services/demo/fixtures/identity';
import { ONBOARDING_SEED } from '../../services/trustModel';
import InviteStep from './steps/InviteStep';
import VouchStep from './steps/VouchStep';
import HowItWorksStep from './steps/HowItWorksStep';
import AgentStep from './steps/AgentStep';
import RulesStep from './steps/RulesStep';
import ReadyStep from './steps/ReadyStep';
import styles from './OnboardingFlow.module.scss';

// Invitation entry (?invite=CODE) walks all 6 steps; direct entry (no invite
// param — e.g. the root URL's first-run redirect) skips straight to building
// the profile, since there's no inviter or vouch relationship to explain.
type OnboardingStepKey = 'invite' | 'vouch' | 'how' | 'agent' | 'rules' | 'ready';
const INVITATION_STEPS: OnboardingStepKey[] = ['invite', 'vouch', 'how', 'agent', 'rules', 'ready'];
const DIRECT_STEPS: OnboardingStepKey[] = ['agent', 'rules', 'ready'];

const STEP_LABELS: Record<OnboardingStepKey, [string, string]> = {
  invite: ['onboarding.step.invite', 'Invite'],
  vouch: ['onboarding.step.vouch', 'Trust'],
  how: ['onboarding.step.how', 'How'],
  agent: ['onboarding.step.agent', 'You'],
  rules: ['onboarding.step.rules', 'Rules'],
  ready: ['onboarding.step.ready', 'Ready'],
};

/**
 * Lane A — guided first-run journey, routed at `/welcome/*`.
 * `?invite=CODE` selects the full invitation sequence; its absence (the
 * common case — a self-serve agent, or the root URL's first-run redirect)
 * selects the shorter direct-entry sequence starting at the profile form.
 *
 * Nothing about step position or profile fields persists locally — step
 * position is plain in-memory state (lost on refresh, which is fine for a
 * short one-time flow), and the profile itself is only ever real once it's
 * written to the contract; state.user.digitalAgentProfile (Redux, sourced
 * from the real server) is what "already onboarded" means.
 */
const OnboardingFlow: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const { agent, saveAgent } = useDigitalAgent();
  const { serverUrl, publicKey, digitalAgentProfile, digitalAgentContractId } = useAppSelector((s) => s.user);

  const inviteCode = params.get('invite');
  const stepKeys = inviteCode ? INVITATION_STEPS : DIRECT_STEPS;
  const voucher = getVoucher(inviteCode);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [index, setIndex] = useState(0);
  const [consented, setConsented] = useState(false);

  // Seed the vouch as soon as an invited newcomer arrives, so it survives a later skip.
  useEffect(() => {
    if (inviteCode && !agent?.invitedBy) {
      saveAgent({ invitedBy: voucher.publicKey, vouchedBy: defaultVouchers(voucher.publicKey) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move focus to the step heading on each step change (announced via the live region).
  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const go = (nextIndex: number) => setIndex(nextIndex);

  const submitProfile = (fields: DigitalAgentProfileFields) => {
    if (!serverUrl || !publicKey) return;
    saveDigitalAgentProfile({ serverUrl, publicKey, existingContractId: digitalAgentContractId, fields })
      .then((contractId) => {
        dispatch(setDigitalAgentProfile({ profile: fields, contractId }));
      })
      .catch((err) => {
        console.error('[OnboardingFlow] Failed to save digital agent profile contract:', err);
      });
  };

  // Return state: already onboarded (a real profile contract exists) →
  // compact "all set" with Start over.
  if (digitalAgentProfile) {
    return (
      // Banner + main#main keep the entry route inside the page model — skip
      // link, landmark, and the step hero as the page's h1 (S18 W1, campaign M1).
      <div className={styles.flow}>
        <AppHeader />
        <main id="main" tabIndex={-1} className={styles.flowMain}>
          <Card className={styles.doneCard}>
            <h1 className={styles.doneTitle}>{t('onboarding.alreadyDone.title', "You're all set up")}</h1>
            <p className={styles.doneLead}>
              {t('onboarding.alreadyDone.lead', 'Your profile is ready. Jump back into the deliberation, or start the welcome guide over.')}
            </p>
            <div className={styles.doneActions}>
              <Button fullWidth onClick={() => navigate('/stage/problem')}>
                {t('onboarding.cta.explore', 'Explore Gloki')}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setIndex(0)}>
                {t('onboarding.cta.startOver', 'Start over')}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const steps = stepKeys.map((key) => {
    const [i18nKey, fallback] = STEP_LABELS[key];
    return { label: t(i18nKey, fallback) };
  });
  const vouchCount = agent?.vouchedBy?.length ?? 1;
  const currentKey = stepKeys[index];

  return (
    // Same page-model wrapper as the done branch (S18 W1, campaign M1); the
    // active step's hero heading is the page's h1.
    <div className={styles.flow}>
      <AppHeader />
      <main id="main" tabIndex={-1} className={styles.flowMain}>
        <div className={styles.stepperWrap}>
          <Stepper steps={steps} current={index} onStepClick={(i) => go(i)} />
        </div>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {t('onboarding.announce', 'Step {n} of {total}: {label}', { n: index + 1, total: steps.length, label: steps[index].label })}
        </p>

        <div className={styles.stepBody}>
          {currentKey === 'invite' && <InviteStep headingRef={headingRef} voucher={voucher} onContinue={() => go(index + 1)} />}
          {currentKey === 'vouch' && (
            <VouchStep headingRef={headingRef} voucher={voucher} vouchCount={vouchCount} onBack={() => go(index - 1)} onContinue={() => go(index + 1)} />
          )}
          {currentKey === 'how' && (
            <HowItWorksStep
              headingRef={headingRef}
              vouchCount={agent?.vouchedBy?.length ?? ONBOARDING_SEED}
              onBack={() => go(index - 1)}
              onContinue={() => go(index + 1)}
            />
          )}
          {currentKey === 'agent' && (
            <AgentStep
              headingRef={headingRef}
              agent={agent}
              voucher={voucher}
              onBack={index > 0 ? () => go(index - 1) : undefined}
              onContinue={(fields) => {
                submitProfile(fields);
                go(index + 1);
              }}
              onSkip={() => go(index + 1)}
            />
          )}
          {currentKey === 'rules' && (
            <RulesStep headingRef={headingRef} onBack={() => go(index - 1)} onAgree={() => { setConsented(true); go(index + 1); }} />
          )}
          {currentKey === 'ready' && (
            <ReadyStep
              headingRef={headingRef}
              agent={agent}
              consented={consented}
              onConsentNudge={() => go(index - 1)}
              onExplore={() => navigate('/stage/problem')}
              onViewAgent={() => navigate('/identity/profile')}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default OnboardingFlow;
