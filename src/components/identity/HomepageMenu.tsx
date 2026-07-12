import React from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import {
  User, QrCode, Plus, LogOut, EyeOff, Info, Mail, LayoutGrid, Sparkles,
  PlusCircle, PenLine, Users2, MessageSquare, Coins, Users, Shield, Settings,
} from 'lucide-react';
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
 *
 * Context-aware (W6 6.4): this is the one menu trigger present on every page (the
 * AppHeader hamburger). When the user is inside a community, it prepends that
 * community's section-nav (mirroring CommunityView's menu, reusing the same
 * `community.menu.*` keys) so every mini-app is reachable from every section page
 * — the reachability guarantee that avoids a second header or a left drawer
 * (both deleted + locked). The community menu's stateful actions (Share / Invite /
 * Leave / demo reset) stay exclusive to the community menu opened from its home.
 */
const HomepageMenu: React.FC<HomepageMenuProps> = ({ isOpen, onClose, onNavigate, onLogout }) => {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenCount = useAppSelector((s) => s.preferences.hidden.length);

  // Each entry runs its action then closes the menu.
  const close = (fn: () => void) => () => {
    fn();
    onClose();
  };

  // Inside a community, surface its sections at the top of the global menu.
  const communityId = matchPath({ path: '/community/:communityId', end: false }, location.pathname)
    ?.params.communityId;

  const communityNav: SlideOutMenuItem[] = communityId
    ? [
        { key: 'c-create-initiative', icon: PlusCircle, label: t('initiative.start', 'Start an initiative'), onClick: close(() => navigate(`/community/${communityId}/create-initiative`)) },
        { key: 'c-write-together', icon: PenLine, label: t('community.menu.writeTogether', 'Write together'), onClick: close(() => navigate(`/community/${communityId}/write-together`)) },
        { key: 'c-collab', icon: Users2, label: t('community.menu.collab', 'Collab'), onClick: close(() => navigate(`/community/${communityId}/collab`)) },
        { key: 'c-chat', icon: MessageSquare, label: t('community.menu.chat', 'Chat'), onClick: close(() => navigate(`/community/${communityId}/chat`)) },
        { key: 'c-currency', icon: Coins, label: t('community.menu.funds', 'Community Funds'), onClick: close(() => navigate(`/community/${communityId}/currency`)) },
        { key: 'c-members', icon: Users, label: t('community.menu.members', 'Members'), onClick: close(() => navigate(`/community/${communityId}/members`)) },
        { key: 'c-identity', icon: Shield, label: t('community.menu.identity', 'Identity & Trust'), onClick: close(() => navigate(`/community/${communityId}/identity`)) },
        { key: 'c-settings', icon: Settings, label: t('community.menu.settings', 'Settings'), onClick: close(() => navigate(`/community/${communityId}/settings`)) },
      ]
    : [];

  const globalItems: SlideOutMenuItem[] = [
    // Divide the community group from the global group (only when both are shown).
    { key: 'welcome', icon: Sparkles, label: t('onboarding.menuEntry', 'Welcome guide'), onClick: close(() => navigate('/welcome')), dividerBefore: communityNav.length > 0 },
    { key: 'profile', icon: User, label: t('menu.profile', 'Profile'), onClick: close(() => onNavigate('profile')) },
    { key: 'communities', icon: LayoutGrid, label: t('menu.communities', 'Communities'), onClick: close(() => onNavigate('communities')) },
    { key: 'join', icon: QrCode, label: t('menu.join', 'Join Community'), onClick: close(() => onNavigate('join')) },
    { key: 'create', icon: Plus, label: t('menu.createCommunity', 'Create Community'), onClick: close(() => navigate('/create-community')) },
    { key: 'logout', icon: LogOut, label: t('menu.logout', 'Logout'), onClick: close(onLogout), variant: 'danger' },
    { key: 'hidden', icon: EyeOff, label: t('menu.hidden', 'Hidden Communities'), onClick: close(() => onNavigate('hidden')), badge: hiddenCount, dividerBefore: true },
    { key: 'about', icon: Info, label: t('menu.about', 'About'), onClick: close(() => onNavigate('about')) },
    { key: 'contact', icon: Mail, label: t('menu.contact', 'Contact'), onClick: close(() => onNavigate('contact')) },
  ];

  const items: SlideOutMenuItem[] = [...communityNav, ...globalItems];

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
