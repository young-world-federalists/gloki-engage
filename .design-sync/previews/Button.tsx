import { Button } from 'gloki-ds';
import { Check, ArrowRight } from 'lucide-react';

export const Variants = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary">Save changes</Button>
    <Button variant="secondary">Cancel</Button>
    <Button variant="ghost">Learn more</Button>
    <Button variant="destructive">Delete</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const WithIcons = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button leftIcon={<Check size={16} />}>Confirm</Button>
    <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>Continue</Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button loading>Saving…</Button>
    <Button disabled>Unavailable</Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ width: 320 }}>
    <Button fullWidth variant="primary">Start an initiative</Button>
  </div>
);
