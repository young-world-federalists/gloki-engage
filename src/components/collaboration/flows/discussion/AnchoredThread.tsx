import React, { useMemo, useState } from 'react';
import { Reply, Send } from 'lucide-react';
import { CountryFlag } from '../../../shared';
import { useAppSelector } from '../../../../store/hooks';
import { useT, type TFunction } from '../../../../i18n';
import { relativeTimeKey } from '../../../../utils/formatTimeAgo';
import { useAuthorResolver } from './useDiscussionData';
import * as api from './discussionApi';
import type { AnchoredComment } from './discussionApi';
import styles from './AnchoredThread.module.scss';

type Node = AnchoredComment & { children: Node[] };

function buildTree(flat: AnchoredComment[]): Node[] {
  const map = new Map<string, Node>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Node[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  // Oldest-first within a thread (conversation order).
  const sort = (nodes: Node[]) => {
    nodes.sort((a, b) => b.createdAgo - a.createdAgo);
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

const ReplyCompose: React.FC<{
  t: TFunction;
  placeholder: string;
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}> = ({ t, placeholder, onSubmit, onCancel, autoFocus }) => {
  const [text, setText] = useState('');
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };
  return (
    <div className={styles.compose}>
      <textarea
        className={styles.textarea}
        rows={2}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      />
      <div className={styles.composeActions}>
        <button type="button" className={styles.btnSubmit} onClick={submit} disabled={!text.trim()}>
          <Send size={14} aria-hidden /> {t('deliberation.action.reply', 'Reply')}
        </button>
        {onCancel && (
          <button type="button" className={styles.btnGhost} onClick={onCancel}>
            {t('deliberation.action.cancel', 'Cancel')}
          </button>
        )}
      </div>
    </div>
  );
};

const AnchoredItem: React.FC<{
  node: Node;
  depth: number;
  t: TFunction;
  canParticipate: boolean;
  resolve: ReturnType<typeof useAuthorResolver>;
  onReply: (text: string, parentId: string) => void;
}> = ({ node, depth, t, canParticipate, resolve, onReply }) => {
  const [replying, setReplying] = useState(false);
  const person = resolve(node.author);
  const name = person.isMine ? t('deliberation.you', 'You') : person.name;
  const rt = relativeTimeKey(node.createdAgo);

  return (
    <div className={`${styles.comment} ${depth > 0 ? styles.nested : ''}`}>
      {depth > 0 && <span className={styles.threadLine} aria-hidden />}
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={`${styles.avatar} ${person.isMine ? styles.avatarMe : ''}`} aria-hidden>
            {person.initials}
          </span>
          <span className={styles.authorName}>
            {name}
            {person.country && <CountryFlag code={person.country} size="sm" />}
          </span>
          <span className={styles.timestamp}>{t(rt.key, rt.def, rt.vars)}</span>
        </div>
        <p className={styles.commentText}>{node.text}</p>
        {canParticipate && (
          <div className={styles.commentActions}>
            <button type="button" className={styles.actionBtn} onClick={() => setReplying((v) => !v)}>
              <Reply size={13} aria-hidden /> {t('deliberation.action.reply', 'Reply')}
            </button>
          </div>
        )}
        {replying && (
          <ReplyCompose
            t={t}
            placeholder={t('deliberation.reply.placeholder', 'Reply to {name}…', { name: name.split(' ')[0] })}
            autoFocus
            onSubmit={(text) => {
              onReply(text, node.id);
              setReplying(false);
            }}
            onCancel={() => setReplying(false)}
          />
        )}
      </div>
      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <AnchoredItem
              key={child.id}
              node={child}
              depth={depth + 1}
              t={t}
              canParticipate={canParticipate}
              resolve={resolve}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export interface AnchoredThreadProps {
  /** 'statement' or a position id. */
  anchor: string;
  /** The full anchored list (filtered here by anchor). */
  anchored: AnchoredComment[];
  contractId: string | null;
  canParticipate: boolean;
  onChanged: () => void | Promise<void>;
  placeholder?: string;
}

/**
 * Anchored discussion under one object (the statement or a position): threaded
 * replies + a compose. Seam-backed; one person, one vote does not apply to
 * replies (they're discussion, not support).
 */
const AnchoredThread: React.FC<AnchoredThreadProps> = ({
  anchor,
  anchored,
  contractId,
  canParticipate,
  onChanged,
  placeholder,
}) => {
  const t = useT();
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const resolve = useAuthorResolver();

  const tree = useMemo(() => buildTree(anchored.filter((a) => a.anchor === anchor)), [anchored, anchor]);

  const add = async (text: string, parentId: string | null) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addAnchoredComment(serverUrl, publicKey, contractId, anchor, text, parentId);
    await onChanged();
  };

  return (
    <div className={styles.thread}>
      {canParticipate && (
        <ReplyCompose
          t={t}
          placeholder={placeholder || t('deliberation.anchored.placeholder', 'Add to the discussion…')}
          onSubmit={(text) => add(text, null)}
        />
      )}
      {tree.length > 0 && (
        <div className={styles.list}>
          {tree.map((node) => (
            <AnchoredItem
              key={node.id}
              node={node}
              depth={0}
              t={t}
              canParticipate={canParticipate}
              resolve={resolve}
              onReply={(text, parentId) => add(text, parentId)}
            />
          ))}
        </div>
      )}
      {tree.length === 0 && !canParticipate && (
        <p className={styles.empty}>{t('deliberation.anchored.empty', 'No replies yet.')}</p>
      )}
    </div>
  );
};

export default AnchoredThread;
