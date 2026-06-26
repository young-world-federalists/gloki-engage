import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MessageSquare, Reply, Trash2, ChevronDown, ChevronRight, Search, Globe, Lightbulb, AlertTriangle } from 'lucide-react';

import type { FlowProps } from '../types';
import * as api from './discussionApi';
import type { Comment, CommentCategory } from './discussionApi';
import CountryBadge from '../shared/CountryBadge';
import { useAppSelector } from '../../../../store/hooks';
import { useFlowContract } from '../shared/useFlowContract';
import { useT, useI18n } from '../../../../i18n';
const discussionContractCode = '';import styles from './DiscussionFlow.module.scss';

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------
// Component-semantic colour literals — keep in sync with variables.scss ($primary, $warning, $success, $error).
const CATEGORIES: { key: CommentCategory; labelKey: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'evidence',  labelKey: 'discussionFlow.category.evidence',  label: 'Evidence',  icon: Search,        color: '#3b82f6' },
  { key: 'impact',    labelKey: 'discussionFlow.category.impact',    label: 'Impact',    icon: Globe,         color: '#f59e0b' },
  { key: 'solutions', labelKey: 'discussionFlow.category.solutions', label: 'Ideas', icon: Lightbulb,     color: '#10b981' },
  { key: 'concerns',  labelKey: 'discussionFlow.category.concerns',  label: 'Concerns',  icon: AlertTriangle, color: '#dc2626' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c])) as Record<CommentCategory, typeof CATEGORIES[number]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type CommentNode = Comment & { children: CommentNode[] };

function buildTree(flat: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: CommentNode[] = [];
  flat.forEach(c => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  });
  const sort = (nodes: CommentNode[]) => { nodes.sort((a, b) => a.timestamp - b.timestamp); nodes.forEach(n => sort(n.children)); };
  sort(roots);
  return roots;
}

const formatTime = (ts: number, locale: string) =>
  new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

const authorLabel = (id: string, currentUserKey: string, youLabel: string) => id === currentUserKey ? youLabel : id;

// ---------------------------------------------------------------------------
// Category badge (small inline label on comments)
// ---------------------------------------------------------------------------
const CategoryBadge: React.FC<{ category?: CommentCategory }> = ({ category }) => {
  const t = useT();
  if (!category) return null;
  const cfg = CATEGORY_MAP[category];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={styles.categoryBadge} style={{ color: cfg.color, borderColor: cfg.color }}>
      <Icon size={11} /> {t(cfg.labelKey, cfg.label)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Compose box with category selector
// ---------------------------------------------------------------------------
const ComposeBox: React.FC<{
  placeholder: string;
  onSubmit: (text: string, category?: CommentCategory) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  showCategories?: boolean;
}> = ({ placeholder, onSubmit, onCancel, autoFocus, showCategories }) => {
  const t = useT();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<CommentCategory>('evidence');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, showCategories ? category : undefined);
    setText('');
  };

  return (
    <div className={styles.composeBox}>
      {showCategories && (
        <div className={styles.categorySelector}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                className={`${styles.categoryChip} ${category === cat.key ? styles.categoryChipActive : ''}`}
                style={category === cat.key ? { borderColor: cat.color, color: cat.color } : undefined}
                onClick={() => setCategory(cat.key)}
                type="button"
              >
                <Icon size={13} /> {t(cat.labelKey, cat.label)}
              </button>
            );
          })}
        </div>
      )}
      <textarea
        className={styles.composeTextarea}
        rows={3}
        placeholder={placeholder}
        value={text}
        autoFocus={autoFocus}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === 'Escape' && onCancel) onCancel();
        }}
      />
      <div className={styles.composeActions}>
        <button className={styles.btnSubmit} onClick={submit} disabled={!text.trim()}>
          <MessageSquare size={14} />
          {onCancel ? t('discussionFlow.reply', 'Reply') : t('discussionFlow.comment', 'Comment')}
        </button>
        {onCancel && (
          <button className={styles.btnCancel} onClick={onCancel}>{t('common.cancel', 'Cancel')}</button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Single comment node — recursive
// ---------------------------------------------------------------------------

const CommentItem: React.FC<{
  node: CommentNode;
  depth: number;
  profiles: Record<string, { firstName?: string; lastName?: string; country?: string }>;
  currentUserKey: string;
  onReply: (parentId: string, text: string, category?: CommentCategory) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}> = ({ node, depth, profiles, currentUserKey, onReply, onDelete }) => {
  const { t, locale } = useI18n();
  const [replying,   setReplying]   = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  const isOwn      = node.author === currentUserKey && !node.deleted;
  const hasChildren = node.children.length > 0;
  const name = authorLabel(node.author, currentUserKey, t('discussionFlow.you', 'You'));

  const handleReplySubmit = useCallback(async (text: string) => {
    await onReply(node.id, text, node.category);
    setReplying(false);
  }, [node.id, node.category, onReply]);

  const handleDeleteClick = useCallback(() => {
    onDelete(node.id);
  }, [node.id, onDelete]);

  return (
    <div className={`${styles.commentItem} ${depth > 0 ? styles.nested : ''}`}>
      {/* Thread line for nested comments */}
      {depth > 0 && <div className={styles.threadLine} />}

      <div className={styles.commentBody}>
        {/* Header */}
        <div className={styles.commentHeader}>
          <span className={`${styles.avatar} ${isOwn ? styles.avatarMe : ''}`}>
            {name[0]?.toUpperCase() ?? '?'}
          </span>
          <span className={styles.authorName}>
            {name}
            <CountryBadge countryCode={profiles[node.author]?.country} />
          </span>
          <CategoryBadge category={node.category} />
          <span className={styles.timestamp}>{formatTime(node.timestamp, locale)}</span>
          {hasChildren && (
            <button
              className={styles.collapseBtn}
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? t('discussionFlow.expand', 'Expand') : t('discussionFlow.collapse', 'Collapse')}
            >
              {collapsed
                ? <><ChevronRight size={14} /> {node.children.length}</>
                : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Text */}
        <p className={styles.commentText}>{node.text}</p>

        {/* Actions */}
        <div className={styles.commentActions}>
          {!node.deleted && (
            <button
              className={styles.actionBtn}
              onClick={() => setReplying(v => !v)}
            >
              <Reply size={13} /> {t('discussionFlow.reply', 'Reply')}
            </button>
          )}
          {isOwn && (
            <button
              className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
              onClick={handleDeleteClick}
            >
              <Trash2 size={13} /> {t('discussionFlow.delete', 'Delete')}
            </button>
          )}
        </div>

        {/* Reply compose */}
        {replying && (
          <ComposeBox
            placeholder={t('discussionFlow.replyPlaceholder', 'Replying to {name}…', { name })}
            onSubmit={(text) => handleReplySubmit(text)}
            onCancel={() => setReplying(false)}
            autoFocus
          />
        )}
      </div>

      {/* Children */}
      {!collapsed && node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map(child => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              profiles={profiles}
              currentUserKey={currentUserKey}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root flow component
// ---------------------------------------------------------------------------
const DiscussionFlow: React.FC<FlowProps> = ({ instanceId, parentContractId, stageKey }) => {
  const t = useT();
  const profiles = useAppSelector((s) => s.communities.profiles) || {};
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const currentUserKey = publicKey || '';

  const { contractId, isReady, isDeploying, hasError, errorMessage, statusMessage, retry } = useFlowContract(
    instanceId,
    'discussion',
    'discussion_contract.py',
    discussionContractCode,
    parentContractId,
    stageKey,
  );

  const [flat, setFlat] = useState<Comment[]>([]);
  const [activeFilter, setActiveFilter] = useState<CommentCategory | 'all'>('all');

  const refresh = useCallback(async () => {
    if (!serverUrl || !publicKey || !contractId) return;
    try {
      const list = await api.getComments(serverUrl, publicKey, contractId);
      setFlat(list);
    } catch (err) {
      console.error('[DiscussionFlow] Failed to fetch comments:', err);
    }
  }, [serverUrl, publicKey, contractId]);

  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const handleTopLevel = useCallback(async (text: string, category?: CommentCategory) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addComment(serverUrl, publicKey, contractId, text, null, category);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleReply = useCallback(async (parentId: string, text: string, category?: CommentCategory) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.addComment(serverUrl, publicKey, contractId, text, parentId, category);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!serverUrl || !publicKey || !contractId) return;
    await api.deleteComment(serverUrl, publicKey, contractId, id);
    await refresh();
  }, [serverUrl, publicKey, contractId, refresh]);

  // Count comments per category (top-level only for progress)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of flat) {
      if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [flat]);

  // Filter flat list then build tree
  const filteredFlat = useMemo(() => {
    if (activeFilter === 'all') return flat;
    // When filtering, include matching top-level comments and all their descendants
    const matchingRoots = new Set(flat.filter(c => c.category === activeFilter && !c.parentId).map(c => c.id));
    return flat.filter(c => {
      if (matchingRoots.has(c.id)) return true;
      // Walk up to check if any ancestor is a matching root
      let current = c;
      while (current.parentId) {
        if (matchingRoots.has(current.parentId)) return true;
        const parent = flat.find(p => p.id === current.parentId);
        if (!parent) break;
        current = parent;
      }
      return false;
    });
  }, [flat, activeFilter]);

  const tree = useMemo(() => buildTree(filteredFlat), [filteredFlat]);

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <AlertTriangle size={36} />
          <p>{errorMessage}</p>
          <button className={styles.btnSubmit} onClick={retry}>{t('common.retry', 'Try again')}</button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{statusMessage || (isDeploying ? t('discussionFlow.settingUp', 'Setting up discussion…') : t('common.loading', 'Loading…'))}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Deliberation progress */}
      <div className={styles.progressBar}>
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat.key] || 0;
          const Icon = cat.icon;
          return (
            <span key={cat.key} className={styles.progressItem} style={{ color: cat.color }}>
              <Icon size={13} /> {count}
            </span>
          );
        })}
      </div>

      <div className={styles.header}>
        <MessageSquare size={18} />
        <span>{t(
          flat.length === 1 ? 'discussionFlow.commentCount.one' : 'discussionFlow.commentCount.many',
          flat.length === 1 ? '1 comment' : '{n} comments',
          { n: flat.length },
        )}</span>
      </div>

      <ComposeBox
        placeholder={t('discussionFlow.composePlaceholder', 'Share your thoughts on this topic…')}
        onSubmit={handleTopLevel}
        showCategories
      />

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <button
          className={`${styles.filterChip} ${activeFilter === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {t('discussionFlow.filterAll', 'All')}
        </button>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = categoryCounts[cat.key] || 0;
          return (
            <button
              key={cat.key}
              className={`${styles.filterChip} ${activeFilter === cat.key ? styles.filterChipActive : ''}`}
              style={activeFilter === cat.key ? { borderColor: cat.color, color: cat.color } : undefined}
              onClick={() => setActiveFilter(cat.key)}
            >
              <Icon size={13} /> {t(cat.labelKey, cat.label)} {count > 0 && <span className={styles.filterCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {tree.length === 0 ? (
        <div className={styles.empty}>
          <MessageSquare size={36} />
          <p>{activeFilter === 'all'
            ? t('discussionFlow.empty', 'No comments yet. Start the discussion!')
            : t('discussionFlow.emptyFiltered', 'No {category} comments yet.', { category: t(`discussionFlow.category.${activeFilter}`, activeFilter) })}</p>
        </div>
      ) : (
        <div className={styles.commentList}>
          {tree.map(node => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              profiles={profiles}
              currentUserKey={currentUserKey}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionFlow;
