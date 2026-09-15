import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlarmClock,
  BadgeCheck,
  BellOff,
  GitMerge,
  HandHeart,
  PhoneIncoming,
  UserCheck,
} from 'lucide-react';
import { Button, EmptyState, NotificationItem } from '../../shared';
import { useT, type TFunction } from '../../../i18n';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  markAllRead,
  markRead,
  markUnread,
  type AppNotification,
} from '../../../store/slices/notificationsSlice';
import { formatTimeAgo } from '../../../utils/formatTimeAgo';
import styles from './NotificationCenter.module.scss';

interface NotificationAction {
  label: string;
  to: string;
}

interface NotificationPresentation {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: NotificationAction;
}

function payloadText(notification: AppNotification, key: string): string | null {
  const value = notification.payload[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function presentNotification(
  notification: AppNotification,
  t: TFunction,
): NotificationPresentation | null {
  const memberFallback = t('notifications.memberFallback', 'A member');

  switch (notification.type) {
    case 'merge_absorbed': {
      const communityId = payloadText(notification, 'communityId');
      const targetId = payloadText(notification, 'targetInitiativeId');
      const targetTitle = payloadText(notification, 'targetTitle')
        ?? t('notifications.anotherInitiative', 'another initiative');
      return {
        icon: <GitMerge size={22} />,
        title: t('notifications.mergeAccepted.title', 'Merge accepted'),
        body: t(
          'notifications.mergeAccepted.body',
          'An initiative you supported merged into {title}.',
          { title: targetTitle },
        ),
        action: communityId && targetId
          ? {
              label: t('notifications.mergeAccepted.action', 'View initiative'),
              to: `/initiative/_/_/${encodeURIComponent(communityId)}/${encodeURIComponent(targetId)}`,
            }
          : undefined,
      };
    }

    case 'verification_request': {
      const requestId = payloadText(notification, 'requestId');
      const requesterKey = payloadText(notification, 'requesterKey');
      const name = payloadText(notification, 'requesterName') ?? memberFallback;
      return {
        icon: <UserCheck size={22} />,
        title: t('notifications.verificationRequest.title', 'Vouch request'),
        body: notification.status === 'active'
          ? t('notifications.verificationRequest.body', '{name} asked you to vouch for them.', { name })
          : t('notifications.verificationRequest.bodyEnded', 'This vouch request from {name} is no longer pending.', { name }),
        action: notification.status === 'active' && requestId && requesterKey
          ? {
              label: t('notifications.verificationRequest.action', 'Review request'),
              to: '/identity/verification/approve',
            }
          : undefined,
      };
    }

    case 'approval_received': {
      const requestId = payloadText(notification, 'requestId');
      const approverKey = payloadText(notification, 'approverKey');
      const name = payloadText(notification, 'approverName') ?? memberFallback;
      return {
        icon: <BadgeCheck size={22} />,
        title: t('notifications.approvalReceived.title', 'Vouch received'),
        body: t('notifications.approvalReceived.body', '{name} vouched for you.', { name }),
        action: requestId && approverKey
          ? {
              label: t('notifications.approvalReceived.action', 'View verification'),
              to: '/identity/verification',
            }
          : undefined,
      };
    }

    case 'daily_reminder': {
      const dayKey = payloadText(notification, 'dayKey');
      return {
        icon: <AlarmClock size={22} />,
        title: t('notifications.dailyReminder.title', 'Daily verification is opening'),
        body: t('notifications.dailyReminder.body', 'Your daily verification session is ready to join.'),
        action: dayKey
          ? {
              label: t('notifications.dailyReminder.action', 'Join daily session'),
              to: '/identity/verification/daily',
            }
          : undefined,
      };
    }

    case 'call_invite': {
      const inviteId = payloadText(notification, 'inviteId');
      const candidateKey = payloadText(notification, 'candidateKey');
      const name = payloadText(notification, 'candidateName') ?? memberFallback;
      const ended = notification.status !== 'active';
      return {
        icon: <PhoneIncoming size={22} />,
        title: t('notifications.callInvite.title', 'Verification call invitation'),
        body: ended
          ? t('notifications.callInvite.bodyEnded', 'This demo call invitation from {name} has ended.', { name })
          : t('notifications.callInvite.body', '{name} is ready to join a verification call.', { name }),
        action: !ended && inviteId && candidateKey
          ? {
              label: t('notifications.callInvite.action', 'Join call'),
              to: `/identity/verification/call?invite=${encodeURIComponent(inviteId)}`,
            }
          : undefined,
      };
    }

    case 'verifier_selected': {
      const runId = payloadText(notification, 'runId');
      const candidateKey = payloadText(notification, 'candidateKey');
      const name = payloadText(notification, 'candidateName') ?? memberFallback;
      const ended = notification.status !== 'active';
      return {
        icon: <UserCheck size={22} />,
        title: t('notifications.verifierSelected.title', 'You were selected'),
        body: ended
          ? t('notifications.verifierSelected.bodyEnded', 'This demo verifier selection for {name} has ended.', { name })
          : t('notifications.verifierSelected.body', "{name}'s daily verification session is ready.", { name }),
        action: !ended && runId && candidateKey
          ? {
              label: t('notifications.verifierSelected.action', 'Open daily session'),
              to: '/identity/verification/daily',
            }
          : undefined,
      };
    }

    case 'session_thanks': {
      const role = payloadText(notification, 'role');
      const newlyVerified = notification.payload.newlyVerified === true;
      let body = t(
        'notifications.sessionThanks.body',
        'Thanks for taking part in today’s daily verification session.',
      );
      if (role === 'candidate') {
        body = newlyVerified
          ? t('notifications.sessionThanks.bodyCandidateVerified', 'Thanks for completing today’s session. You’re now verified.')
          : t('notifications.sessionThanks.bodyCandidate', 'Thanks for completing today’s daily verification session.');
      } else if (role === 'selectedVerifier') {
        body = t('notifications.sessionThanks.bodyVerifier', 'Thanks for helping verify a candidate in today’s daily session.');
      } else if (role === 'observer') {
        body = t('notifications.sessionThanks.bodyObserver', 'Thanks for staying with today’s daily verification session.');
      }
      return {
        icon: <HandHeart size={22} />,
        title: t('notifications.sessionThanks.title', 'Thanks for taking part'),
        body,
      };
    }

    default: {
      const exhaustive: never = notification.type;
      void exhaustive;
      return null;
    }
  }
}

const NotificationCenter: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.notifications.items);
  const [liveStatus, setLiveStatus] = useState('');
  const unreadCount = items.filter((notification) => !notification.read).length;
  const presented = items.flatMap((notification) => {
    const presentation = presentNotification(notification, t);
    return presentation ? [{ notification, presentation }] : [];
  });

  const setReadState = (notification: AppNotification) => {
    if (notification.read) {
      dispatch(markUnread(notification.id));
      setLiveStatus(t('notifications.status.unread', 'Notification marked as unread.'));
    } else {
      dispatch(markRead(notification.id));
      setLiveStatus(t('notifications.status.read', 'Notification marked as read.'));
    }
  };

  const openAction = (notification: AppNotification, to: string) => {
    if (!notification.read) dispatch(markRead(notification.id));
    navigate(to);
  };

  const readAll = () => {
    dispatch(markAllRead());
    setLiveStatus(t('notifications.status.allRead', 'All notifications marked as read.'));
  };

  return (
    <section className={styles.page} aria-label={t('notifications.title', 'Notifications')}>
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {liveStatus}
      </div>
      <div className={styles.introRow}>
        <p className={styles.subtitle}>
          {t('notifications.subtitle', 'Updates from your verification activity and communities.')}
        </p>
        {unreadCount > 0 && (
          <Button size="md" variant="ghost" onClick={readAll}>
            {t('notifications.markAllRead', 'Mark all read')}
          </Button>
        )}
      </div>

      {presented.length === 0 ? (
        <EmptyState
          icon={<BellOff size={48} aria-hidden />}
          title={t('notifications.empty', 'No notifications yet')}
          message={t(
            'notifications.emptyBody',
            'Vouch requests, calls and community updates will appear here.',
          )}
        />
      ) : (
        <div className={styles.list}>
          {presented.map(({ notification, presentation }) => (
            <NotificationItem
              key={notification.id}
              icon={presentation.icon}
              title={presentation.title}
              body={presentation.body}
              timestamp={formatTimeAgo(t, notification.createdAt)}
              unread={!notification.read}
              unreadText={t('notifications.unread', 'Unread')}
              action={presentation.action ? (
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => openAction(notification, presentation.action!.to)}
                >
                  {presentation.action.label}
                </Button>
              ) : undefined}
              readControl={(
                <Button size="md" variant="ghost" onClick={() => setReadState(notification)}>
                  {notification.read
                    ? t('notifications.markUnread', 'Mark as unread')
                    : t('notifications.markRead', 'Mark as read')}
                </Button>
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationCenter;
