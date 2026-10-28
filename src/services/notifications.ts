// Public notification seam. UI code imports this module, never the demo runtime.
import { startDemoNotificationRuntime } from './demo/notificationRuntime';
import { publishNotification, type NotificationOwner } from './notificationEvents';

export type { NotificationOwner } from './notificationEvents';

export function startNotificationRuntime(owner: NotificationOwner): () => void {
  return startDemoNotificationRuntime(owner);
}

export function recordMergeAbsorbed(
  owner: NotificationOwner,
  input: {
    mergeProposalId: string;
    sourceInitiativeId: string;
    sourceTitle?: string;
    targetInitiativeId: string;
    targetTitle?: string;
    communityId: string;
  },
): void {
  publishNotification(owner, {
    id: `merge-absorbed:${input.mergeProposalId}:${input.sourceInitiativeId}:${input.targetInitiativeId}`,
    type: 'merge_absorbed',
    createdAt: Date.now(),
    payload: {
      mergeProposalId: input.mergeProposalId,
      sourceInitiativeId: input.sourceInitiativeId,
      sourceTitle: input.sourceTitle ?? null,
      targetInitiativeId: input.targetInitiativeId,
      targetTitle: input.targetTitle ?? null,
      communityId: input.communityId,
    },
  });
}
