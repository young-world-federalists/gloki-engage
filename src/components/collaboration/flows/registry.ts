import { MessageSquare, AlertTriangle, Award, ThumbsUp, Scale } from 'lucide-react';
import ApprovalFlow from './voting/ApprovalFlow';
import QVFlow from './voting/QVFlow';
import DiscussionFlow from './discussion/DiscussionFlow';
import ConcernsFlow from './concerns/ConcernsFlow';
import RolesFlow from './roles/RolesFlow';
import type { FlowDefinition } from './types';

/** Ordered list of group names as they appear in the Add Tab menu. */
export const FLOW_GROUPS = [
  'Decision Making',
  'Teamwork',
  'Planning',
] as const;

export const FLOW_REGISTRY: FlowDefinition[] = [
  // ── Decision Making (initiative pipeline only) ────────────────────────────
  {
    id: 'approval',
    label: 'Approval Voting',
    icon: ThumbsUp,
    component: ApprovalFlow,
    group: 'Decision Making',
    context: 'initiative',
  },
  {
    id: 'quadratic',
    label: 'Quadratic Voting',
    icon: Scale,
    component: QVFlow,
    group: 'Decision Making',
    context: 'initiative',
  },
  {
    id: 'concerns',
    label: 'Concern Resolution',
    icon: AlertTriangle,
    component: ConcernsFlow,
    group: 'Decision Making',
    context: 'initiative',
  },

  // ── Teamwork ──────────────────────────────────────────────────────────────
  {
    id: 'discussion',
    label: 'Discussion',
    icon: MessageSquare,
    component: DiscussionFlow,
    group: 'Teamwork',
    context: 'collab',
  },

  // ── Planning & Execution ──────────────────────────────────────────────────
  {
    id: 'roles',
    label: 'Role Assignment',
    icon: Award,
    component: RolesFlow,
    group: 'Planning',
    context: 'collab',
  },
];

export function getFlow(id: string): FlowDefinition | undefined {
  return FLOW_REGISTRY.find((f) => f.id === id);
}
