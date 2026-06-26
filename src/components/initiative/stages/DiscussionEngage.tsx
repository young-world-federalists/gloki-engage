import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useAppSelector } from '../../../store/hooks';
import { useFlowContract } from '../../collaboration/flows/shared/useFlowContract';
import { getComments } from '../../collaboration/flows/discussion/discussionApi';
import styles from './DiscussionEngage.module.scss';

export interface DiscussionEngageProps {
  /** The initiative contract id — the shared parent contract. */
  initiativeId: string;
}

/**
 * The Discussion stage's Engage preview inside the shared InitiativeStageCard:
 * a light "N comments · M people" teaser (from the live discussion sub-contract)
 * over a friendly empty state. Read-only — the full thread + composer live in the
 * Discussion stage page (the shell's "Open the discussion"). No participation
 * gate (discussion is conversation, not a threshold).
 */
const DiscussionEngage: React.FC<DiscussionEngageProps> = ({ initiativeId }) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);

  const { contractId, isReady } = useFlowContract(
    `discussion-${initiativeId}`,
    'discussion',
    'discussion_contract.py',
    '',
    initiativeId,
    'discussionContractId',
  );

  const [teaser, setTeaser] = useState({ count: 0, people: 0 });

  useEffect(() => {
    if (!isReady || !serverUrl || !publicKey || !contractId) return;
    let cancelled = false;
    getComments(serverUrl, publicKey, contractId)
      .then((list) => {
        if (cancelled) return;
        const live = list.filter((c) => !c.deleted);
        setTeaser({ count: live.length, people: new Set(live.map((c) => c.author)).size });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isReady, serverUrl, publicKey, contractId]);

  return (
    <div className={styles.engage}>
      {teaser.count > 0 ? (
        <p className={styles.preview}>
          {t('deliberation.discussion.teaser', '{c} comments · {p} people', { c: teaser.count, p: teaser.people })}
        </p>
      ) : (
        <EmptyState
          compact
          icon={<MessageSquare size={28} aria-hidden />}
          title={t('deliberation.empty.title', 'No discussion yet')}
          message={t('deliberation.empty.body', 'Be the first to weigh in on this problem.')}
        />
      )}
    </div>
  );
};

export default DiscussionEngage;
