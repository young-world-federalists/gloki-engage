import { Stepper } from 'gloki-ds';

export const Horizontal = () => (
  <div style={{ maxWidth: 520 }}>
    <Stepper current={2} steps={[
      { label: 'Problem' }, { label: 'Discussion' }, { label: 'Proposals' }, { label: 'Vote' }, { label: 'Mandate' },
    ]} />
  </div>
);

export const Vertical = () => (
  <div style={{ maxWidth: 300 }}>
    <Stepper orientation="vertical" current={1} steps={[
      { label: 'Create account', description: 'Your name and country' },
      { label: 'Get vouched', description: 'A friend confirms you’re real' },
      { label: 'Start participating', description: 'Join the deliberation' },
    ]} />
  </div>
);
