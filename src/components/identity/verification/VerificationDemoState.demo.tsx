// DEMO-ONLY sidecar (dev builds): applies a verification scenario from the
// mock layer and reloads. Reaches past the seam on purpose — the
// `.demo.tsx` suffix marks it, like ProblemStage.demo.ts. HomepageMenu imports
// it statically in every build; only the menu entry that opens it is gated on
// import.meta.env.DEV, so it ships inert in production (a React.lazy DEV-only
// import is the later hardening).
import React from 'react';
import { Modal, Button } from '../../shared';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { applyDemoScenario, DEMO_SCENARIOS, type DemoScenario } from '../../../services/demo/verificationDemo';
import pages from './VerificationPages.module.scss';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VerificationDemoStateDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const t = useT();
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const labels: Record<DemoScenario, string> = {
    'unverified-0': t('demo.verification.unverified', 'Unverified (0 approvals)'),
    'partial-2': t('demo.verification.partial', 'Partly vouched (2 of 4)'),
    'verified-4': t('demo.verification.verified', 'Verified (4 of 4)'),
    'member-view': t('demo.verification.memberView', 'Verified member with requests waiting'),
  };
  const apply = (scenario: DemoScenario) => {
    if (!publicKey) return;
    applyDemoScenario(scenario, publicKey);
    window.location.reload();
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
    </Modal>
  );
};

export default VerificationDemoStateDialog;
