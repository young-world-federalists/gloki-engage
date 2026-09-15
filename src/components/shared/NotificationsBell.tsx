import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import styles from './NotificationsBell.module.scss';

const NotificationsBell: React.FC = () => {
  const t = useT();
  const unreadCount = useAppSelector((state) => (
    state.user.publicKey
      ? state.notifications.items.filter((notification) => !notification.read).length
      : 0
  ));
  const publicKey = useAppSelector((state) => state.user.publicKey);

  if (!publicKey) return null;

  const label = unreadCount > 0
    ? t('notifications.bellUnread', 'Notifications, {count} unread', { count: unreadCount })
    : t('notifications.title', 'Notifications');

  return (
    <Link className={styles.bellBtn} to="/identity/notifications" aria-label={label}>
      <Bell size={18} aria-hidden />
      {unreadCount > 0 && (
        <span className={styles.badge} aria-hidden>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationsBell;
