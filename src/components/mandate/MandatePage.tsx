import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../PageHeader';
import { useT } from '../../i18n';
import { useAppSelector } from '../../store/hooks';
import { getPublishedMandate } from './MandatePage.demo';
import MandateDocument from './MandateDocument';
import AdoptionFramework from './AdoptionFramework';
import cs from '../../pages/Container.module.scss';
import styles from './MandatePage.module.scss';

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

  // UI-only mockup: resolve the initiative title from the demo store (populated
  // when the user reached this mandate via its dashboard) — never a backend read.
  // When absent, getPublishedMandate falls back to the flagship water mandate so
  // the page always renders a credible artifact.
  const title = useAppSelector((s) =>
    mandateId ? s.initiative.initiativeDetails[mandateId]?.title : undefined,
  );

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
