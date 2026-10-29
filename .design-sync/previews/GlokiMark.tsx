import { GlokiMark } from 'gloki-ds';

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
    <GlokiMark size={24} />
    <GlokiMark size={40} />
    <GlokiMark size={64} />
  </div>
);

export const WithWordmark = () => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <GlokiMark size={28} />
    <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>Gloki</span>
  </div>
);
