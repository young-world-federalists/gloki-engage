import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../PageHeader';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { getInitiative } from '../../services/contracts/initiative';
import { getPublishedMandate } from './MandatePage.demo';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import cs from '../../pages/Container.module.scss';
import styles from './MandatePage.module.scss';

interface InitiativeDetails {
  title?: string;
}

/**
 * Lane E — Mandate & Impact. Routed at `/mandate/:communityId/:mandateId/*`.
 *
 * The published Mandate artifact (E1) plus the adoption framework (E2): the
 * collective output participants can point to, and its bridge to real-world
 * adoption. Resolves the mandate from the initiative's title, falling back to
 * the flagship water mandate so the page always renders a credible artifact.
 */
const MandatePage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const { mandateId } = useParams<{ communityId: string; mandateId: string }>();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [title, setTitle] = useState<string | undefined>(undefined);

  // Read the initiative title (read-only) to resolve which mandate to show.
  useEffect(() => {
    if (!serverUrl || !publicKey || !mandateId) return;
    let cancelled = false;
    (async () => {
      try {
        const det = await getInitiative(serverUrl, publicKey, mandateId);
        const detTitle = (det as InitiativeDetails | null)?.title;
        if (!cancelled && typeof detTitle === 'string') setTitle(detTitle);
      } catch {
        /* fall back to the flagship mandate */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, mandateId]);

  const mandate = getPublishedMandate(title);

  return (
    <div className={cs.container}>
      <PageHeader
        showBackButton
        backButtonText={t('common.back', 'Back')}
        onBackClick={() => navigate(-1)}
        title={t('mandate.pageTitle', 'Published mandate')}
        subtitle={mandate.title}
        layout="two-row"
      />

      <div className={cs.content}>
        <div className={cs.main}>
          <div className={styles.page}>
            <MandateDocument mandate={mandate} />
            <AdoptionFramework mandateId={mandate.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandatePage;
