import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useT } from '../../../i18n';
import { Badge, Button } from '../../shared';
import { useAlert } from '../../shared/useAlert';
import SharedStatement from '../../collaboration/flows/discussion/SharedStatement';
import ThreadedDiscussion from '../../collaboration/flows/discussion/ThreadedDiscussion';
import {
  getStatement,
  getEdits,
  getComments,
  type Statement,
  type EditSuggestion,
} from '../../collaboration/flows/discussion/discussionApi';
import { submitDraft, type DraftEntry } from './writeTogetherApi';
import styles from './DraftEditor.module.scss';

export interface DraftEditorProps {
  communityId: string;
  draft: DraftEntry;
  canParticipate: boolean;
  onBack: () => void;
  onChanged: (draft: DraftEntry) => void;
}

const DraftEditor: React.FC<DraftEditorProps> = ({
  communityId,
  draft,
  canParticipate,
  onBack,
  onChanged,
}) => {
  const t = useT();
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { showAlert, alertElement } = useAlert();

  const [statement, setStatement] = useState<Statement>({
    title: draft.title,
    body: '',
    coAuthors: [],
  });
  const [edits, setEdits] = useState<EditSuggestion[]>([]);
  const [participants, setParticipants] = useState(1);
  const [showDiscuss, setShowDiscuss] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey) return;
    const [s, e, comments] = await Promise.all([
      getStatement(serverUrl, publicKey, draft.contractId),
      getEdits(serverUrl, publicKey, draft.contractId),
      getComments(serverUrl, publicKey, draft.contractId),
    ]);
    setStatement(s);
    setEdits(e);
    // participantCount = distinct pks across co-authors, edit authors, edit
    // supporters, and comment authors — floored at 1.
    const ppl = new Set<string>([
      ...s.coAuthors,
      ...e.flatMap((x) => [x.author, ...x.supporters]),
      ...comments.map((c) => c.author),
    ]);
    setParticipants(Math.max(1, ppl.size));
  }, [serverUrl, publicKey, draft.contractId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitted = draft.status === 'submitted';

  const handleSubmit = async () => {
    if (!serverUrl || !publicKey) return;
    setSubmitting(true);
    try {
      const updated = await submitDraft(serverUrl, publicKey, communityId, draft);
      onChanged(updated);
      showAlert(
        t(
          'writeTogether.submittedNote',
          'Submitted to {name}. It now appears in the feed.',
          { name: draft.targetName },
        ),
      );
    } catch (err) {
      showAlert(
        err instanceof Error
          ? err.message
          : t('writeTogether.submitFailed', 'Could not submit. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.editor}>
      {/* Back button */}
      <button
        type="button"
        className={styles.back}
        onClick={onBack}
        aria-label={t('common.back', 'Back')}
      >
        <ArrowLeft size={20} aria-hidden />
      </button>

      {/* Compact setup header: mode pill · "for {community}" · tag chip */}
      <div className={styles.setup}>
        <Badge tone={draft.mode === 'problem' ? 'warning' : 'info'} size="sm">
          {draft.mode === 'problem'
            ? t('writeTogether.modeProblem', 'Problem')
            : t('writeTogether.modeSolution', 'Solution')}
        </Badge>
        <span className={styles.setupText}>
          {t('writeTogether.forCommunity', 'for {name}', { name: draft.targetName })}
        </span>
        {draft.tag && (
          <span className={styles.setupText}>· {draft.tag.title}</span>
        )}
      </div>

      {/* Co-owned statement + open edits */}
      <SharedStatement
        contractId={draft.contractId}
        communityId={communityId}
        statement={statement}
        edits={edits}
        participantCount={participants}
        canParticipate={canParticipate && !submitted}
        onChanged={refresh}
      />

      {/* Collapsible discuss section */}
      <div className={styles.discussSection}>
        <button
          type="button"
          className={styles.discussToggle}
          onClick={() => setShowDiscuss((v) => !v)}
          aria-expanded={showDiscuss}
        >
          <MessageCircle size={16} aria-hidden />
          {t('writeTogether.discuss', 'Discuss this draft')}
          {showDiscuss ? (
            <ChevronDown size={16} aria-hidden />
          ) : (
            <ChevronRight size={16} aria-hidden />
          )}
        </button>
        {showDiscuss && (
          <ThreadedDiscussion
            contractId={draft.contractId}
            communityId={communityId}
            canParticipate={canParticipate && !submitted}
            emptyHint={t('writeTogether.discussEmpty', 'Talk through this draft together.')}
          />
        )}
      </div>

      {/* Submit / submitted */}
      {submitted ? (
        <p className={styles.submittedBanner} role="status">
          {t('writeTogether.alreadySubmitted', 'Submitted to {name}.', {
            name: draft.targetName,
          })}
        </p>
      ) : (
        <Button
          fullWidth
          size="lg"
          loading={submitting}
          onClick={() => void handleSubmit()}
          disabled={!canParticipate}
        >
          {t('writeTogether.submitTo', 'Submit to {name}', { name: draft.targetName })}
        </Button>
      )}

      {alertElement}
    </div>
  );
};

export default DraftEditor;
