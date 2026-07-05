import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, QrCode, Plus, LogOut, EyeOff, Info, Mail, LayoutGrid, Sparkles } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useT } from '../../i18n';
import { MenuSettings, SlideOutMenu, type SlideOutMenuItem } from '../shared';

interface HomepageMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

/**
 * The global slide-out menu (Welcome guide, Profile, Communities, Join, Create,
 * Hidden, About, Contact, Logout). A thin item config over the shared
 * `SlideOutMenu` so it stays visually and behaviourally identical to the
 * per-community menu — see CommunityView.
 */
const HomepageMenu: React.FC<HomepageMenuProps> = ({ isOpen, onClose, onNavigate, onLogout }) => {
  const t = useT();
  const navigate = useNavigate();
  const hiddenCount = useAppSelector((s) => s.preferences.hidden.length);

  // Each entry runs its action then closes the menu.
  const close = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const items: SlideOutMenuItem[] = [
    { key: 'welcome', icon: Sparkles, label: t('onboarding.menuEntry', 'Welcome guide'), onClick: close(() => navigate('/welcome')) },
    { key: 'profile', icon: User, label: t('menu.profile', 'Profile'), onClick: close(() => onNavigate('profile')) },
    { key: 'communities', icon: LayoutGrid, label: t('menu.communities', 'Communities'), onClick: close(() => onNavigate('communities')) },
    { key: 'join', icon: QrCode, label: t('menu.join', 'Join Community'), onClick: close(() => onNavigate('join')) },
    { key: 'create', icon: Plus, label: t('menu.createCommunity', 'Create Community'), onClick: close(() => navigate('/create-community')) },
    { key: 'logout', icon: LogOut, label: t('menu.logout', 'Logout'), onClick: close(onLogout), variant: 'danger' },
    { key: 'hidden', icon: EyeOff, label: t('menu.hidden', 'Hidden Communities'), onClick: close(() => onNavigate('hidden')), badge: hiddenCount, dividerBefore: true },
    { key: 'about', icon: Info, label: t('menu.about', 'About'), onClick: close(() => onNavigate('about')) },
    { key: 'contact', icon: Mail, label: t('menu.contact', 'Contact'), onClick: close(() => onNavigate('contact')) },
  ];

  return (
    <SlideOutMenu
      isOpen={isOpen}
      onClose={onClose}
      title={t('menu.title', 'Menu')}
      items={items}
      side="right"
      closeLabel={t('menu.close', 'Close menu')}
      footer={<MenuSettings />}
    />
  );
};

export default HomepageMenu;
