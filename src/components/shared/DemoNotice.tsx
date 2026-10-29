import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import Banner from './Banner';
import { useT } from '../../i18n';

/**
 * Shown at the top of every demo variant (docs/DEMO_MODE.md), so sample data
 * is never mistaken for real. Links to the same page without `?demo=true`.
 */
const DemoNotice: React.FC = () => {
  const t = useT();
  const { pathname, search, hash } = useLocation();
  const params = new URLSearchParams(search);
  params.delete('demo');
  const query = params.toString();
  const realPath = `${pathname}${query ? `?${query}` : ''}${hash}`;

  return (
    <Banner
      tone="info"
      icon={<FlaskConical size={18} aria-hidden />}
      action={<Link to={realPath}>{t('demoMode.showReal', 'Show real data')}</Link>}
    >
      {t('demoMode.notice', 'Demo: this page shows sample data. Nothing you do here reaches the network.')}
    </Banner>
  );
};

export default DemoNotice;
