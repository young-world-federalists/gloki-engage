import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import ThreadedDiscussion from '../components/collaboration/flows/discussion/ThreadedDiscussion';
import { useT } from '../i18n';
import { getForumContractId } from '../services/forum';
import styles from './Container.module.scss';

/**
 * S42 — `/forum`, the beta's second screen: one shared threaded conversation
 * for everyone in the test, mounted once on the contract the forum seam
 * returns. No communities, no stages, no vote on posts — post, reply, like.
 * Anyone signed in can post; verification gates nothing here yet.
 */
const ForumPage: React.FC = () => {
  const t = useT();
  const [contractId, setContractId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getForumContractId().then((id) => {
      if (!cancelled) setContractId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <AppHeader
        title={t('beta.forum.title', 'Forum')}
        subtitle={t('beta.forum.subtitle', 'One conversation, shared by everyone in this test.')}
      />
      <main id="main" tabIndex={-1} className={styles.content}>
        <div className={styles.main}>
          {contractId ? (
            <ThreadedDiscussion
              contractId={contractId}
              canParticipate
              variant="forum"
              emptyHint={t('beta.forum.empty', 'Be the first to post.')}
            />
          ) : (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>{t('common.loading', 'Loading…')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForumPage;
