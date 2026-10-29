import { CountryFlag } from 'gloki-ds';

export const WithNames = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <CountryFlag code="KE" showName />
    <CountryFlag code="BR" showName />
    <CountryFlag code="DE" showName />
    <CountryFlag code="IN" showName />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <CountryFlag code="NG" size="sm" />
    <CountryFlag code="NG" size="md" />
    <CountryFlag code="NG" size="lg" />
  </div>
);

export const FlagsOnly = () => (
  <div style={{ display: 'flex', gap: 8 }}>
    {['JP', 'MX', 'ZA', 'FR', 'ID'].map((c) => <CountryFlag key={c} code={c} />)}
  </div>
);
