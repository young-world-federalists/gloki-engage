export type PipelineStage = 'problem' | 'discussion' | 'proposals' | 'vote' | 'mandate';

/**
 * Where a stage component is being rendered:
 * - 'feed'      — compact card in StageFeedView (one initiative, current stage)
 * - 'dashboard' — expanded section in InitiativeDashboard (one initiative, all stages)
 */
export type StageVariant = 'feed' | 'dashboard';

export interface InitiativeData {
  id: string;
  title: string;
  description?: string;
  evidence?: string[];
  countries?: string[];
  stage?: PipelineStage;
  currencyGathered?: number;
  currencyGoal?: number;
  createdAt: number;
  activityCount?: number;
  hostServer?: string;
  hostAgent?: string;
}
