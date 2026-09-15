// DEMO-ONLY sidecar (dev builds): applies a verification scenario from the
// mock layer and reloads. Reaches past the seam on purpose — the
// `.demo.tsx` suffix marks it, like ProblemStage.demo.ts. HomepageMenu loads
// this module lazily only in development builds.
import React from 'react';
import { Modal, Button } from '../../shared';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { applyDemoScenario, DEMO_SCENARIOS, type DemoScenario } from '../../../services/demo/verificationDemo';
import {
  applyDailyDemoScenario,
  DAILY_DEMO_SCENARIOS,
} from '../../../services/demo/dailyVerificationSim';
import type { DailyDemoScenario } from '../../../services/verificationModel';
import pages from './VerificationPages.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationDemoStateDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const labels: Record<DemoScenario, string> = {
    'unverified-0': t('demo.verification.unverified', 'Unverified (0 approvals)'),
    'partial-2': t('demo.verification.partial', 'Partly vouched (2 of 4)'),
    'verified-4': t('demo.verification.verified', 'Verified (4 of 4)'),
    'member-view': t('demo.verification.memberView', 'Verified member with requests waiting'),
  };
  const apply = (scenario: DemoScenario) => {
    if (!publicKey || !serverUrl) return;
    applyDemoScenario(scenario, { publicKey, serverUrl });
    window.location.reload();
  };
  const dailyLabels: Record<DailyDemoScenario, string> = {
    real: t('demo.verification.daily.real', 'Daily: real clock'),
    'pre-session': t('demo.verification.daily.pre', 'Daily: before join opens'),
    'join-window': t('demo.verification.daily.join', 'Daily: join window'),
    lobby: t('demo.verification.daily.lobby', 'Daily: lobby near selection'),
    'selected-verifier': t('demo.verification.daily.selected', 'Daily: selected verifier'),
    observer: t('demo.verification.daily.observer', 'Daily: observer'),
    'empty-pool': t('demo.verification.daily.empty', 'Daily: empty pool (use unverified state)'),
    'partial-pool': t('demo.verification.daily.partial', 'Daily: partial verifier pool'),
  };
  const applyDaily = (scenario: DailyDemoScenario) => {
    if (!publicKey || !import.meta.env.DEV) return;
    applyDailyDemoScenario(scenario, publicKey);
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('demo.verification.title', 'Verification demo state')} closeLabel={t('common.close', 'Close')} size="sm">
      <p className={pages.intro}>{t('demo.verification.body', 'Applies a scenario and reloads.')}</p>
      <div className={pages.actions}>
        {DEMO_SCENARIOS.map((scenario) => (
          <Button key={scenario} variant="secondary" fullWidth onClick={() => apply(scenario)}>
            {labels[scenario]}
          </Button>
        ))}
      </div>
      <h3 className={pages.sectionTitle}>{t('demo.verification.daily.title', 'Daily session walkthrough')}</h3>
      <p className={pages.intro}>
        {t('demo.verification.daily.help', 'Choose a trust state above first, let the page reload, then choose a daily clock and roster.')}
      </p>
      <div className={pages.actions}>
        {DAILY_DEMO_SCENARIOS.map((scenario) => (
          <Button key={scenario} variant="secondary" fullWidth onClick={() => applyDaily(scenario)}>
            {dailyLabels[scenario]}
          </Button>
        ))}
      </div>
    </Modal>
  );
};

export default VerificationDemoStateDialog;
