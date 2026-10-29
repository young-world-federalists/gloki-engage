import { Badge } from 'gloki-ds';

export const Tones = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="neutral">Neutral</Badge>
    <Badge tone="primary">Primary</Badge>
    <Badge tone="success">Verified</Badge>
    <Badge tone="warning">Pending</Badge>
    <Badge tone="error">Rejected</Badge>
    <Badge tone="info">Info</Badge>
  </div>
);

export const WithDot = () => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="success" dot>Live</Badge>
    <Badge tone="warning" dot>Draft</Badge>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <Badge size="sm">Small</Badge>
    <Badge size="md">Medium</Badge>
  </div>
);
