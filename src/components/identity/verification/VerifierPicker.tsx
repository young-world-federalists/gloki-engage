import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { RefreshCw, VideoOff } from 'lucide-react';
import { Button, EmptyState } from '../../shared';
import { useT } from '../../../i18n';
import { useVerification } from '../../../hooks/useVerification';
import {
  availableVerifiers,
  inviteToCall,
  type CallParticipant,
  type CallSession,
  type MemberSummary,
} from '../../../services/verification';
import MemberList from './MemberList';
import pages from './VerificationPages.module.scss';
import styles from './CallFlow.module.scss';

export interface VerifierPickerProps {
  /** Approver keys already in state.approvals — never re-offered (E5: a repeat vouch is a silent no-op). */
  excludeKeys: string[];
  /** Lifted to CallFlow (it "holds ... the selected keys", per the task brief) so a later step can see who was invited. */
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
  /** Fires once inviteToCall resolves; CallFlow banks the session and advances the machine to 'waiting'. */
  onStarted: (session: CallSession) => void;
}

// availableVerifiers only ever samples online members (spec §5: "8-10 online
// members the picker can invite"), so `online: true` is safe to hardcode here
// rather than plumbing it through CallParticipant, which doesn't carry it.
const toMemberSummary = (p: CallParticipant): MemberSummary => ({
  publicKey: p.publicKey,
  name: p.name,
  country: p.country,
  online: true,
});

/**
 * VerifierPicker — CallFlow's `select` step (state A, S37 Task 5). "Available
 * now" only: no scheduling grid, no timezone picker (E4 — a simulation can't
 * honour a future slot, and 84 toggles fights north star 1 at 360px).
 */
const VerifierPicker: React.FC<VerifierPickerProps> = ({ excludeKeys, selectedKeys, onToggleKey, onStarted }) => {
  const t = useT();
  const navigate = useNavigate();
  const { ctx } = useVerification();
  const [available, setAvailable] = useState<CallParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selected = new Set(selectedKeys);

  const load = useCallback(async () => {
    if (!ctx) return;
    setLoading(true);
    try {
      setAvailable(await availableVerifiers(ctx, excludeKeys));
    } finally {
      setLoading(false);
    }
  }, [ctx, excludeKeys]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStart = async () => {
    if (!ctx || busy || selectedKeys.length === 0) return;
    setBusy(true);
    try {
      onStarted(await inviteToCall(ctx, selectedKeys));
    } finally {
      setBusy(false);
    }
  };

  const actionFor = (member: MemberSummary): React.ReactNode => {
    const isSelected = selected.has(member.publicKey);
    return (
      <Button size="sm" variant={isSelected ? 'primary' : 'secondary'} onClick={() => onToggleKey(member.publicKey)}>
        {isSelected ? t('verification.call.deselect', 'Deselect') : t('verification.call.selected', 'Select')}
      </Button>
    );
  };

  return (
    <div className={pages.page}>
      {/* F10's line, verbatim — split so the link text is translatable
          without markup embedded in the string (E7). */}
      <p className={pages.intro}>
        {t('verification.call.bandwidth', 'Uses your camera and mobile data.')}{' '}
        <Link to="/identity/verification/request" className={styles.link}>
          {t('verification.call.bandwidthLink', 'No camera? Ask a member to vouch for you instead.')}
        </Link>
      </p>
      {/* The demo honesty line (E7) — does not contradict F10: F10 warns what
          the real feature would cost, this states what this build does. */}
      <p className={pages.intro}>
        {t(
          'verification.call.demoNote',
          'Demo: no real call is made — your camera and microphone stay off, and these members join and verify automatically.',
        )}
      </p>

      <div className={styles.pickerHead}>
        <h2 className={pages.sectionTitle}>{t('verification.call.availableNow', 'Available now')}</h2>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => void load()}
          disabled={loading}
          className={styles.refreshButton}
        >
          {t('verification.call.refresh', 'Refresh')}
        </Button>
      </div>
      <div className={styles.listGuard}>
        <MemberList
          members={available.map(toMemberSummary)}
          loading={loading}
          action={actionFor}
          rowClassName={(member) => (selected.has(member.publicKey) ? styles.selectedRow : undefined)}
          empty={
            <EmptyState
              icon={<VideoOff size={48} aria-hidden />}
              title={t('verification.call.pickerEmpty', 'No one is available right now.')}
              action={
                <Button size="md" onClick={() => navigate('/identity/verification/request')}>
                  {t('verification.call.pickerEmptyCta', 'Ask a member to vouch instead')}
                </Button>
              }
            />
          }
        />
      </div>

      <div className={clsx(pages.actions, styles.stickyActions)}>
        <Button fullWidth disabled={selectedKeys.length === 0 || busy} loading={busy} onClick={() => void handleStart()}>
          {t('verification.call.startWith', 'Start call with {count}', { count: selectedKeys.length })}
        </Button>
      </div>
    </div>
  );
};

export default VerifierPicker;
