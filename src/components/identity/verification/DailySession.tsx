import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock3, RefreshCw } from 'lucide-react';
import { Badge, Banner, Button, CountdownTimer } from '../../shared';
import { useI18n } from '../../../i18n';
import { useDailyVerification } from '../../../hooks/useDailyVerification';
import DailySessionLobby from './DailySessionLobby';
import DailySessionResult from './DailySessionResult';
import InCallView from './InCallView';
import styles from './DailySession.module.scss';

const ignoreCallUpdate = () => {};
const DailySession: React.FC = () => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { snapshot, loading, error, busy, join, enterCall, finishCall, setReminder, retry } = useDailyVerification();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formatRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours > 0
      ? t('verification.daily.timeHours', '{hours}h {minutes}m {seconds}s', { hours, minutes, seconds: remainder })
      : t('verification.daily.timeMinutes', '{minutes}m {seconds}s', { minutes, seconds: remainder });
  };

  useEffect(() => {
    if (snapshot?.phase) headingRef.current?.focus();
  }, [snapshot?.phase]);

  if (loading) {
    return <p className={styles.status}>{t('common.loading', 'Loading…')}</p>;
  }

  if (!snapshot) {
    const errorText = error === 'signIn'
      ? t('verification.daily.signIn', 'Sign in to join the daily verification session.')
      : t('verification.daily.error', 'Could not load the daily session.');
    return (
      <div className={styles.page}>
        <Banner tone="error" title={t('verification.daily.errorTitle', 'Daily session unavailable')}>
          {errorText}
        </Banner>
        <Button fullWidth leftIcon={<RefreshCw size={18} aria-hidden />} onClick={retry}>
          {t('common.retry', 'Retry')}
        </Button>
        <Button fullWidth variant="ghost" onClick={() => navigate('/identity/verification')}>
          {t('verification.daily.back', 'Back to verification')}
        </Button>
      </div>
    );
  }

  const errorText = error === 'update'
    ? t('verification.daily.updateError', 'The daily session could not be updated. Try again.')
    : error
      ? t('verification.daily.error', 'Could not load the daily session.')
      : null;
  const announcement = snapshot.phase === 'finished'
    ? t('verification.daily.resultTitle', 'Daily session result')
    : snapshot.assignment === 'observer' && snapshot.call?.state === 'complete'
      ? t('verification.daily.observerDoneTitle', 'Thanks for joining today')
    : snapshot.assignment === 'candidate'
      ? t('verification.daily.candidateTitle', 'Your verification group is ready')
      : snapshot.assignment === 'selectedVerifier'
        ? t('verification.daily.selectedTitle', "You've been selected to help verify {name}", { name: snapshot.candidate.name })
        : snapshot.assignment === 'observer'
          ? t('verification.daily.observerTitle', 'Other volunteers were selected')
          : snapshot.assignment === 'unavailable'
            ? t('verification.daily.unavailableTitle', 'No verification group is available')
            : '';

  if (snapshot.phase === 'lobby') {
    return (
      <div className={styles.page}>
        <span key="daily-status" className={styles.srOnly} role="status">{announcement}</span>
        {snapshot.demoClock && <Badge tone="warning">{t('verification.daily.demoClock', 'Demo clock')}</Badge>}
        {errorText && (
          <Banner tone="error" action={<Button size="md" onClick={retry}>{t('common.retry', 'Retry')}</Button>}>
            {errorText}
          </Banner>
        )}
        <DailySessionLobby snapshot={snapshot} busy={busy} onLeave={() => navigate('/identity/verification')} />
      </div>
    );
  }

  if (snapshot.phase === 'selection' || snapshot.phase === 'finished') {
    return (
      <div className={styles.page}>
        <span key="daily-status" className={styles.srOnly} role="status">{announcement}</span>
        {snapshot.demoClock && <Badge tone="warning">{t('verification.daily.demoClock', 'Demo clock')}</Badge>}
        <p className={styles.demoNote}>{t('verification.daily.demoNote', 'Demo: this session uses sample profiles and simulated selection and calls.')}</p>
        {errorText && (
          <Banner tone="error" action={<Button size="md" onClick={retry}>{t('common.retry', 'Retry')}</Button>}>
            {errorText}
          </Banner>
        )}
        <DailySessionResult
          snapshot={snapshot}
          busy={busy}
          onEnterCall={() => void enterCall()}
          onFinish={() => navigate('/identity/verification')}
        />
      </div>
    );
  }

  if (snapshot.phase === 'inCall' && snapshot.call) {
    return (
      <div className={styles.page}>
        <span key="daily-status" className={styles.srOnly} role="status">{announcement}</span>
        {snapshot.demoClock && <Badge tone="warning">{t('verification.daily.demoClock', 'Demo clock')}</Badge>}
        <p className={styles.demoNote}>{t('verification.daily.demoNote', 'Demo: this session uses sample profiles and simulated selection and calls.')}</p>
        {errorText && (
          <Banner tone="error" action={<Button size="md" onClick={retry}>{t('common.retry', 'Retry')}</Button>}>
            {errorText}
          </Banner>
        )}
        <InCallView
          session={snapshot.call}
          role={snapshot.role}
          onUpdate={ignoreCallUpdate}
          onLeave={() => void finishCall()}
          onComplete={() => void finishCall()}
        />
      </div>
    );
  }

  const beforeStart = snapshot.now < snapshot.startsAt;
  const target = beforeStart ? snapshot.startsAt : snapshot.selectionAt;
  const deadlineMs = Date.now() + Math.max(0, target - snapshot.now);
  const localTime = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(snapshot.startsAt);

  return (
    <div className={styles.page}>
      <span key="daily-status" className={styles.srOnly} role="status">{announcement}</span>
      {snapshot.demoClock && <Badge tone="warning">{t('verification.daily.demoClock', 'Demo clock')}</Badge>}
      <section className={styles.stack} aria-labelledby="daily-session-title">
        <h2 id="daily-session-title" ref={headingRef} className={styles.title} tabIndex={-1}>
          {t('verification.daily.preTitle', 'Daily verification session')}
        </h2>
        <div className={styles.schedule}>
          <Clock3 size={20} aria-hidden />
          <p>
            {t('verification.daily.schedule', 'Every day at 21:00 UTC ({localTime} your time)', { localTime })}
          </p>
        </div>
        <CountdownTimer
          key={`${snapshot.id}:${target}:${snapshot.clockGeneration}`}
          seconds={0}
          deadlineMs={deadlineMs}
          formatValue={formatRemaining}
          label={(value) =>
            beforeStart
              ? t('verification.daily.startsIn', 'Session starts in {time}', { time: formatRemaining(value) })
              : t('verification.daily.selectingIn', 'Selecting verifiers in {time}', { time: formatRemaining(value) })
          }
        />
        <p className={styles.copy}>{t('verification.call.bandwidth', 'Uses your camera and mobile data.')}</p>
        <Link to="/identity/verification/request" className={styles.textLink}>
          {t('verification.call.bandwidthLink', 'No camera? Ask a member to vouch for you instead.')}
        </Link>
        <p className={styles.demoNote}>{t('verification.daily.demoNote', 'Demo: this session uses sample profiles and simulated selection and calls.')}</p>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={snapshot.reminderEnabled}
            disabled={busy}
            onChange={(event) => void setReminder(event.target.checked)}
          />
          <span>{t('verification.daily.reminder', 'Set reminder (demo)')}</span>
        </label>
        <p className={styles.hint}>
          {t(
            'verification.daily.reminderHelp',
            'This demo can remind you elsewhere in Gloki while this tab stays open. Reloading or closing the tab clears it.',
          )}
        </p>
        {!snapshot.joinAllowed && (
          <p className={styles.hint}>{t('verification.daily.joinClosed', 'Join opens five minutes before the session.')}</p>
        )}
        {errorText && (
          <Banner tone="error" action={<Button size="md" onClick={retry}>{t('common.retry', 'Retry')}</Button>}>
            {errorText}
          </Banner>
        )}
        <div className={styles.actions}>
          <Button fullWidth disabled={!snapshot.joinAllowed || busy} onClick={() => void join()}>
            {t('verification.daily.join', 'Join daily session')}
          </Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/identity/verification')}>
            {t('verification.daily.back', 'Back to verification')}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default DailySession;
