import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Construction, FlaskConical } from 'lucide-react';
import Banner from './Banner';
import Button from './Button';
import DemoNotice from './DemoNotice';
import EmptyState from './EmptyState';
import { useT } from '../../i18n';
import { LEAVE_DEMO_STATE, useDemoMode, withDemo } from '../../hooks/useDemoMode';
import { setDemoDataMode } from '../../services/dataMode';

// Page wrappers for the two states of every URL (docs/DEMO_MODE.md). Each one
// sets the data layer for the page while it renders — before any of the page's
// effects run — so every contract call it makes goes to that layer. The flag
// decides, never the id: an id from the other layer is simply not found.

/**
 * A page with both states. Same component for both (`children`), or a separate
 * demo variant (`real` + `demo`). With `?demo=true` it uses the demo layer and
 * shows the demo notice.
 */
export function TwoStatePage({
  children,
  real,
  demo,
}: {
  children?: React.ReactNode;
  real?: React.ReactNode;
  demo?: React.ReactNode;
}) {
  const isDemo = useDemoMode();
  setDemoDataMode(isDemo);
  return (
    <>
      {isDemo && <DemoNotice />}
      {isDemo ? (demo ?? children) : (real ?? children)}
    </>
  );
}

/**
 * A page that exists only on the real network. It ignores `?demo=true` and
 * says so at the top.
 */
export function RealOnlyPage({ children }: { children: React.ReactNode }) {
  const t = useT();
  const isDemo = useDemoMode();
  const { pathname, search, hash } = useLocation();
  setDemoDataMode(false);
  const params = new URLSearchParams(search);
  params.delete('demo');
  const query = params.toString();
  return (
    <>
      {isDemo && (
        <Banner
          tone="warning"
          icon={<FlaskConical size={18} aria-hidden />}
          action={<Link to={`${pathname}${query ? `?${query}` : ''}${hash}`} state={LEAVE_DEMO_STATE}>{t('demoMode.removeFlag', 'Leave demo mode')}</Link>}
        >
          {t('demoMode.ignored', 'This page has no demo version yet. The demo flag is ignored: it shows real data.')}
        </Banner>
      )}
      {children}
    </>
  );
}

/**
 * A page that exists only as a demo so far. With `?demo=true` it shows the demo
 * page; without it, a "not yet implemented" message with a link to the demo.
 */
export function DemoOnlyPage({ children }: { children: React.ReactNode }) {
  const t = useT();
  const navigate = useNavigate();
  const isDemo = useDemoMode();
  const { pathname, search, hash } = useLocation();
  setDemoDataMode(isDemo);
  if (isDemo) {
    return (
      <>
        <DemoNotice />
        {children}
      </>
    );
  }
  return (
    <EmptyState
      icon={<Construction size={48} aria-hidden />}
      title={t('demoMode.notImplementedTitle', 'Not yet implemented')}
      message={t('demoMode.notImplementedBody', 'This page works only as a demo so far. Its real version on the network is still being built.')}
      action={
        <Button variant="secondary" onClick={() => navigate(withDemo(`${pathname}${search}${hash}`))}>
          {t('demoMode.openDemo', 'Open the demo version')}
        </Button>
      }
    />
  );
}
