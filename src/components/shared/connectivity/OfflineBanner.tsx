import React from 'react';
import Banner from '../Banner';
import { useT } from '../../../i18n';
import { useOnline } from './useOnline';

/**
 * Global, state-driven offline indicator. Renders the shared Banner
 * (tone="warning" → role="status", announced to screen readers) only while
 * the browser reports no connection. No dismiss — it reflects live state.
 */
const OfflineBanner: React.FC = () => {
  const t = useT();
  const online = useOnline();
  if (online) return null;
  return (
    <Banner tone="warning" title={t('connectivity.offlineBanner.title', "You're offline")}>
      {t('connectivity.offlineBanner.body', 'Some content may not load until you reconnect.')}
    </Banner>
  );
};

export default OfflineBanner;
