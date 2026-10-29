export interface CollabTemplate {
  id: string;
  label: string;
  description: string;
  flowIds: string[];
}

// After the legacy-flow cleanup the only collab-context flows are Discussion and
// Role Assignment, so templates compose those (or start empty).
export const COLLAB_TEMPLATES: CollabTemplate[] = [
  {
    id: 'discuss',
    label: 'Open Discussion',
    description: 'A space for community dialogue and shared decisions',
    flowIds: ['discussion'],
  },
  {
    id: 'project',
    label: 'Community Project',
    description: 'Assign roles and keep the conversation in one place',
    flowIds: ['roles', 'discussion'],
  },
  {
    id: 'custom',
    label: 'Custom Workspace',
    description: 'Start empty and add the tools your community needs',
    flowIds: [],
  },
];
