// Shared component kit — the canonical primitives every lane builds on.
// Prefer importing from here: `import { Card, Button, EmptyState } from '../shared'`.
// House rule: tokens only (see DESIGN_SYSTEM.md), and pass translated strings in
// via props — primitives never hardcode user-facing copy.

export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card } from './Card';
export type { CardProps } from './Card';
export { default as ContextCard } from './ContextCard';
export type { ContextCardProps } from './ContextCard';

export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as InfoDisclosure } from './InfoDisclosure';
export type { InfoDisclosureProps } from './InfoDisclosure';

export { default as Stepper } from './Stepper';
export type { StepperProps, StepperStep } from './Stepper';

export { default as StageStrip } from './StageStrip';
export type { StageStripProps } from './StageStrip';

export { default as SegmentedControl } from './SegmentedControl';
export type { SegmentedControlProps, SegmentOption } from './SegmentedControl';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { default as SlideOutMenu } from './SlideOutMenu';
export type { SlideOutMenuProps, SlideOutMenuItem } from './SlideOutMenu';

export { default as MenuSettings } from './MenuSettings';

export { default as Banner } from './Banner';
export type { BannerProps, BannerTone } from './Banner';

export { default as Badge } from './Badge';
export type { BadgeProps, BadgeTone } from './Badge';

export { default as ProgressBar } from './ProgressBar';
export type { ProgressBarProps, ProgressBarVariant } from './ProgressBar';

export { default as TrustBadge } from './TrustBadge';
export type { TrustBadgeProps } from './TrustBadge';

export { default as UserIdentity } from './UserIdentity';
export type { UserIdentityProps } from './UserIdentity';

export { default as SourceLinks } from './SourceLinks';
export type { SourceLinksProps } from './SourceLinks';

export { default as SourcesInput } from './SourcesInput';
export type { SourcesInputProps } from './SourcesInput';

export { default as CountryFlag } from './CountryFlag';
export type { CountryFlagProps } from './CountryFlag';

export { default as CountryPresence } from './CountryPresence';
export type { CountryPresenceProps } from './CountryPresence';

export { default as CountryMultiSelect } from './CountryMultiSelect';
export type { CountryMultiSelectProps } from './CountryMultiSelect';

// Existing stable primitives (re-exported for discoverability).
export { default as CountryParticipation } from './CountryParticipation';
export { default as GlokiMark } from './GlokiMark';
export { default as SearchableSelect } from './SearchableSelect';
export { default as StageFooter } from './StageFooter';
export { default as LanguageSwitcher } from './LanguageSwitcher';
export type { LanguageSwitcherProps } from './LanguageSwitcher';
