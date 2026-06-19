import { Card, Button, Badge } from 'gloki-ds';

export const Basic = () => (
  <Card style={{ maxWidth: 360 }}>
    <h3 style={{ margin: '0 0 6px' }}>Clean Water Initiative</h3>
    <p style={{ margin: 0, color: '#64748b' }}>Two billion people still lack safely managed drinking water.</p>
  </Card>
);

export const Interactive = () => (
  <Card interactive role="button" tabIndex={0} style={{ maxWidth: 360 }}>
    <h3 style={{ margin: '0 0 6px' }}>Open the deliberation</h3>
    <p style={{ margin: 0, color: '#64748b' }}>Interactive cards lift on hover and are keyboard-focusable.</p>
  </Card>
);

export const Composed = () => (
  <Card style={{ maxWidth: 360 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h3 style={{ margin: 0 }}>Ocean Plastic Pollution</h3>
      <Badge tone="warning">Problem</Badge>
    </div>
    <p style={{ margin: '0 0 16px', color: '#64748b' }}>Over eight million tonnes of plastic enter the ocean every year.</p>
    <Button size="sm">View initiative</Button>
  </Card>
);
