import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button } from '../shared';
import { useT } from '../../i18n';
import { useCommunityTrust } from '../../hooks/useCommunityTrust';
import type { PipelineStage } from '../../services/trust';

interface Props {
  communityId: string;
  stage: PipelineStage;
  /** The participation flow to gate. Always-visible read-only content stays OUTSIDE this. */
  children: React.ReactNode;
}

/**
 * Renders the stage flow when the current user may act; otherwise a friendly,
 * non-dead-end blocked state explaining the rule and offering a path forward.
 * Read-only content (titles, tallies) lives outside this wrapper and stays visible.
 * The hook's canCurrentUserParticipate already encodes membership + trust, so the
 * gate only needs the rule + the user's vouch count to word the message.
 */
const StageGate: React.FC<Props> = ({ communityId, stage, children }) => {
  const t = useT();
  const navigate = useNavigate();
  const { canCurrentUserParticipate, ruleFor, currentUserVouchCount, isReady } = useCommunityTrust(communityId);

  // While loading, don't flash a block — show the flow (reads are harmless in the mock).
  if (!isReady || canCurrentUserParticipate(stage)) return <>{children}</>;

  if (ruleFor(stage) === 'verified') {
    return (
      <Banner
        tone="warning"
        title={t('gate.verified.title', 'Verified members only')}
        action={
          <Button size="sm" onClick={() => navigate(`/community/${communityId}/identity`)}>
            {t('gate.getVerified', 'Get verified')}
          </Button>
        }
      >
        {t(
          'gate.verified.body',
          'This community asks Verified members to take part here. You’re vouched by {count} — meet a few more members to verify.',
          { count: currentUserVouchCount },
        )}
      </Banner>
    );
  }

  // rule === 'members' and the user isn't a member ('anyone' never blocks)
  return (
    <Banner
      tone="info"
      title={t('gate.members.title', 'Members only')}
      action={
        <Button size="sm" onClick={() => navigate('/welcome')}>
          {t('gate.join', 'Join in')}
        </Button>
      }
    >
      {t('gate.members.body', 'Join this community to take part here. You can keep reading either way.')}
    </Banner>
  );
};

export default StageGate;
