import React from 'react';
import { Pen, Users, Award } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './RoleChip.module.scss';

export type Role = 'author' | 'co-author' | 'expert';

interface RoleChipProps {
  role: Role;
  size?: 'sm' | 'md';
}

const ROLE_META: Record<Role, { labelKey: string; labelDefault: string; Icon: React.ComponentType<{ size?: number }> }> = {
  'author': { labelKey: 'roles.author', labelDefault: 'Author', Icon: Pen },
  'co-author': { labelKey: 'roles.coAuthor', labelDefault: 'Co-author', Icon: Users },
  'expert': { labelKey: 'roles.expert', labelDefault: 'Expert', Icon: Award },
};

const RoleChip: React.FC<RoleChipProps> = ({ role, size = 'sm' }) => {
  const t = useT();
  const { labelKey, labelDefault, Icon } = ROLE_META[role];
  const label = t(labelKey, labelDefault);
  const sizeClass = size === 'sm' ? styles.sm : styles.md;
  const roleClass = role === 'author' ? styles.author : role === 'co-author' ? styles.coAuthor : styles.expert;
  return (
    <span className={`${styles.chip} ${roleClass} ${sizeClass}`} aria-label={label}>
      <Icon size={size === 'sm' ? 10 : 12} />
      <span>{label}</span>
    </span>
  );
};

export default RoleChip;
