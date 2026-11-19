import React, { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { setApprovalPrompter } from '../../services/ibc';
import Button from './Button';
import Modal from './Modal';

interface Ask {
  again: boolean;
  proceed: () => void;
  dismiss: () => void;
}

/**
 * Asks for one more click when the app needs the user's approval on their
 * node and has no fresh click to open the node's page with (services/ibc.ts,
 * Approvals). Says only that an approval is needed: the node's page shows
 * what it is, and is where the user can decline. Mount once.
 */
const ApprovalPrompt: React.FC = () => {
  const t = useT();
  const [asks, setAsks] = useState<Ask[]>([]);

  useEffect(() => {
    setApprovalPrompter((again, proceed, dismiss) => setAsks((prev) => [...prev, { again, proceed, dismiss }]));
    return () => setApprovalPrompter(null);
  }, []);

  const ask = asks[0];
  if (!ask) return null;
  const done = (fn: () => void) => {
    setAsks((prev) => prev.slice(1));
    fn();
  };

  return (
    <Modal
      isOpen
      size="sm"
      closeOnBackdrop={false}
      onClose={() => done(ask.dismiss)}
      closeLabel={t('common.close', 'Close')}
      title={ask.again ? t('approval.prompt.againTitle', 'One more approval') : t('approval.prompt.title', 'Your approval is needed')}
      footer={
        <div data-approval-prompt>
          {/* Opens the node's page from this click: browsers allow it only here. */}
          <Button onClick={() => done(ask.proceed)}>{t('approval.prompt.go', 'Go ahead')}</Button>
        </div>
      }
    >
      <p>
        {ask.again
          ? t('approval.prompt.againBody', 'Thanks for your patience. We need you to approve one more time.')
          : t('approval.prompt.body', 'This needs your approval before we can continue.')}
      </p>
    </Modal>
  );
};

export default ApprovalPrompt;
