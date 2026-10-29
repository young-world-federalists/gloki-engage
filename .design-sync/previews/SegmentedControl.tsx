import { SegmentedControl } from 'gloki-ds';

export const TwoOptions = () => (
  <div style={{ maxWidth: 320 }}>
    <SegmentedControl ariaLabel="View" value="active" onChange={() => {}}
      options={[{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }]} />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 440 }}>
    <SegmentedControl fullWidth ariaLabel="Stage" value="proposals" onChange={() => {}}
      options={[{ value: 'problem', label: 'Problem' }, { value: 'proposals', label: 'Proposals' }, { value: 'vote', label: 'Vote' }]} />
  </div>
);
