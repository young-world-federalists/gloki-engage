import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { markRead, markAllRead, type Notification } from '../../store/slices/notificationsSlice';
import { useT } from '../../i18n';
import styles from './NotificationsBell.module.scss';

const NotificationsBell: React.FC = () => {
  const navigate = useNavigate();
  const t = useT();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.notifications.items);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [open, setOpen] = useState(false);

  if (!publicKey) return null;

  const unreadCount = items.filter((n) => !n.read).length;

  const handleClick = (n: Notification) => {
    dispatch(markRead(n.id));
    if (n.type === 'merge_absorbed' && n.payload.targetInitiativeId && n.payload.communityId) {
      navigate(`/initiative/_/_/${n.payload.communityId}/${n.payload.targetInitiativeId}`);
    }
    setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.bellBtn} onClick={() => setOpen((v) => !v)} aria-label={t('notifications.title', 'Notifications')}>
        <Bell size={18} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>{t('notifications.title', 'Notifications')}</span>
            {items.length > 0 && (
              <button className={styles.markAll} onClick={() => dispatch(markAllRead())}>{t('notifications.markAllRead', 'Mark all read')}</button>
            )}
          </div>
          {items.length === 0 ? (
            <div className={styles.empty}>{t('notifications.empty', 'No notifications')}</div>
          ) : (
            items.slice(0, 20).map((n) => (
              <button
                key={n.id}
                className={`${styles.item} ${n.read ? '' : styles.unread}`}
                onClick={() => handleClick(n)}
              >
                {n.type === 'merge_absorbed' ? (
                  <>
                    <div className={styles.title}>{t('notifications.mergeAccepted.title', 'Merge accepted')}</div>
                    <div className={styles.body}>
                      {t('notifications.mergeAccepted.bodyPre', 'An initiative you supported merged into ')}
                      <strong>{n.payload.targetTitle ?? t('notifications.anotherInitiative', 'another initiative')}</strong>
                      {t('notifications.mergeAccepted.bodyPost', '.')}
                    </div>
                  </>
                ) : (
                  <div className={styles.title}>{n.type}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
