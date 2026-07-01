import React, { useState, useEffect, useCallback } from 'react';
import { Edit, ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react';
import { useFlowContract } from '../shared/useFlowContract';
import * as api from './modificationApi';
import { useAppSelector } from '../../../../store/hooks';
const modificationCode = '';import styles from './ModificationSuggestions.module.scss';
import { addCoAuthor } from '../../../../services/initiativeRoles';
import { displayNameFor } from '../../../../utils/displayName';

interface Suggestion {
  id: string;
  field: string;
  suggested_text: string;
  author: string;
  timestamp: number;
  status: 'open' | 'accepted' | 'rejected';
  votes_for: number;
  votes_against: number;
}

interface ModificationSuggestionsProps {
  instanceId: string;
  parentContractId: string;
  stageKey: string;
  originalAuthor?: string;
  coAuthors?: string[];
  fieldLabel?: string;
  targetInitiativeId?: string; // used to call add_co_author on accept; defaults to parentContractId
  onAccept?: (suggestionAuthor: string) => void;
}

const ModificationSuggestions: React.FC<ModificationSuggestionsProps> = ({
  instanceId,
  parentContractId,
  stageKey,
  originalAuthor,
  coAuthors = [],
  fieldLabel = 'problem',
  targetInitiativeId,
  onAccept,
}) => {
  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId, 'modification', 'modification_contract.py', modificationCode,
    parentContractId, stageKey,
  );
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const profiles = useAppSelector((s) => s.communities.profiles);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [field, setField] = useState<'title' | 'description'>('description');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [authorSet, setAuthorSet] = useState(false);

  const canDecide = Boolean(publicKey && (publicKey === originalAuthor || coAuthors.includes(publicKey)));

  useEffect(() => {
    setAuthorSet(false);
  }, [contractId, originalAuthor]);

  const fetchData = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const [suggestionsRes, votesRes] = await Promise.all([
        api.getSuggestions(serverUrl, publicKey, contractId),
        api.getMyVotes(serverUrl, publicKey, contractId),
      ]);
      if (Array.isArray(suggestionsRes)) {
        setSuggestions(suggestionsRes as Suggestion[]);
      }
      if (votesRes && typeof votesRes === 'object') {
        setMyVotes(votesRes as Record<string, string>);
      }
    } catch { /* non-blocking */ }
  }, [serverUrl, publicKey, contractId]);

  // Set author on first ready
  useEffect(() => {
    if (!isReady || !serverUrl || !publicKey || !contractId || authorSet || !originalAuthor) return;
    api.setAuthor(serverUrl, publicKey, contractId, originalAuthor)
      .then(() => setAuthorSet(true))
      .catch(() => {});
  }, [isReady, serverUrl, publicKey, contractId, originalAuthor, authorSet]);

  useEffect(() => {
    if (isReady) fetchData();
  }, [isReady, fetchData]);

  const handleSubmit = async () => {
    if (!serverUrl || !publicKey || !contractId || !text.trim()) return;
    setSubmitting(true);
    try {
      await api.suggestModification(serverUrl, publicKey, contractId, field, text.trim());
      setText('');
      setShowForm(false);
      await fetchData();
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleVote = async (suggestionId: string, vote: 'approve' | 'reject') => {
    if (!serverUrl || !publicKey || !contractId) return;
    setVotingId(suggestionId);
    try {
      await api.voteOnSuggestion(serverUrl, publicKey, contractId, suggestionId, vote);
      await fetchData();
    } catch { /* silent */ }
    finally { setVotingId(null); }
  };

  const handleDecide = async (suggestionId: string, decision: 'accept' | 'reject') => {
    if (!serverUrl || !publicKey || !contractId) return;
    setDecidingId(suggestionId);
    try {
      if (originalAuthor && !authorSet) {
        await api.setAuthor(serverUrl, publicKey, contractId, originalAuthor);
        setAuthorSet(true);
      }
      await api.authorDecide(serverUrl, publicKey, contractId, suggestionId, decision);
      if (decision === 'accept') {
        const suggestion = suggestions.find((s) => s.id === suggestionId);
        const initiativeId = targetInitiativeId || parentContractId;
        if (suggestion && initiativeId && suggestion.author) {
          try {
            await addCoAuthor(serverUrl, publicKey, initiativeId, suggestion.author);
          } catch {
            // non-fatal: promotion can be retried later
          }
          if (onAccept) onAccept(suggestion.author);
        }
      }
      await fetchData();
    } catch { /* silent */ }
    finally { setDecidingId(null); }
  };

  const getAuthorName = (key: string): string => displayNameFor(profiles ? profiles[key] : undefined, key);

  if (hasError) {
    return (
      <div className={styles.error}>
        <p>{errorMessage || 'Failed to load modification suggestions.'}</p>
        <button onClick={retry} className={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (isDeploying || !isReady) {
    return (
      <div className={styles.loading}>
        <p>{statusMessage || 'Setting up modifications...'}</p>
      </div>
    );
  }

  const openSuggestions = suggestions.filter((s) => s.status === 'open');
  const closedSuggestions = suggestions.filter((s) => s.status !== 'open');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Edit size={16} />
          Suggest Modifications
        </h3>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Suggest Change'}
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.fieldSelect}>
            <label>
              <input
                type="radio"
                checked={field === 'title'}
                onChange={() => setField('title')}
              />
              Modify {fieldLabel} title
            </label>
            <label>
              <input
                type="radio"
                checked={field === 'description'}
                onChange={() => setField('description')}
              />
              Modify {fieldLabel} description
            </label>
          </div>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Suggest a new ${field}...`}
            rows={3}
          />
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </div>
      )}

      {openSuggestions.length === 0 && closedSuggestions.length === 0 && (
        <p className={styles.emptyText}>
          No modification suggestions yet. Be the first to suggest an improvement.
        </p>
      )}

      {openSuggestions.map((s) => {
        const myVote = myVotes[s.id];
        const isVoting = votingId === s.id;
        const isDeciding = decidingId === s.id;

        return (
          <div key={s.id} className={styles.suggestion}>
            <div className={styles.suggestionMeta}>
              <span className={styles.fieldBadge}>{s.field}</span>
              <span className={styles.authorName}>{getAuthorName(s.author)}</span>
            </div>
            <p className={styles.suggestionText}>{s.suggested_text}</p>

            <div className={styles.actions}>
              <div className={styles.voteButtons}>
                <button
                  className={`${styles.voteBtn} ${styles.approveBtn} ${myVote === 'approve' ? styles.voted : ''}`}
                  onClick={() => handleVote(s.id, 'approve')}
                  disabled={isVoting}
                >
                  <ThumbsUp size={14} />
                  {s.votes_for}
                </button>
                <button
                  className={`${styles.voteBtn} ${styles.rejectBtn} ${myVote === 'reject' ? styles.voted : ''}`}
                  onClick={() => handleVote(s.id, 'reject')}
                  disabled={isVoting}
                >
                  <ThumbsDown size={14} />
                  {s.votes_against}
                </button>
              </div>

              {canDecide && (
                <div className={styles.authorActions}>
                  <button
                    className={styles.acceptBtn}
                    onClick={() => handleDecide(s.id, 'accept')}
                    disabled={isDeciding}
                  >
                    <CheckCircle size={14} />
                    Accept
                  </button>
                  <button
                    className={styles.rejectDecideBtn}
                    onClick={() => handleDecide(s.id, 'reject')}
                    disabled={isDeciding}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {closedSuggestions.length > 0 && (
        <div className={styles.closedSection}>
          <h4 className={styles.closedTitle}>Resolved</h4>
          {closedSuggestions.map((s) => (
            <div key={s.id} className={`${styles.suggestion} ${styles.closed}`}>
              <div className={styles.suggestionMeta}>
                <span className={styles.fieldBadge}>{s.field}</span>
                <span className={`${styles.statusBadge} ${s.status === 'accepted' ? styles.acceptedBadge : styles.rejectedBadge}`}>
                  {s.status === 'accepted' ? 'Accepted' : 'Rejected'}
                </span>
              </div>
              <p className={styles.suggestionText}>{s.suggested_text}</p>
              <div className={styles.voteTotals}>
                <ThumbsUp size={12} /> {s.votes_for}
                <ThumbsDown size={12} /> {s.votes_against}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModificationSuggestions;
