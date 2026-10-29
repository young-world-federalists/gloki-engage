// Shared component kit — the canonical primitives every lane builds on.
// Prefer importing from here: `import { Card, Button, EmptyState } from '../shared'`.
// House rule: tokens only (see DESIGN_SYSTEM.md), and pass translated strings in
// via props — primitives never hardcode user-facing copy.

export { default as Button } from './Button';
;

export { default as Card } from './Card';
;
export { default as ContextCard } from './ContextCard';
;

export { default as Modal } from './Modal';
;

export { default as InfoDisclosure } from './InfoDisclosure';
;

export { default as Stepper } from './Stepper';
;

export { default as StageStrip } from './StageStrip';
;

export { default as SegmentedControl } from './SegmentedControl';
export type { SegmentOption } from './SegmentedControl';

export { default as EmptyState } from './EmptyState';
;

export { default as NotificationItem } from './NotificationItem';
;

export { default as SlideOutMenu } from './SlideOutMenu';
export type { SlideOutMenuItem } from './SlideOutMenu';

export { default as MenuSettings } from './MenuSettings';

export { default as Banner } from './Banner';
;
export { TwoStatePage, RealOnlyPage, DemoOnlyPage } from './PageModes';

export { default as Badge } from './Badge';
export type { BadgeTone } from './Badge';

export { default as ProgressBar } from './ProgressBar';
;

export { default as MemberCard } from './MemberCard';
;

export { ToastProvider } from './Toast';
export { useToast } from './useToast';
;

export { default as TrustBadge } from './TrustBadge';
;

export { default as UserIdentity } from './UserIdentity';
export type { UserIdentityProps } from './UserIdentity';

export { default as SourceLinks } from './SourceLinks';
;

export { default as SourcesInput } from './SourcesInput';
;

export { default as CountryFlag } from './CountryFlag';
;

export { default as CountryPresence } from './CountryPresence';
;

export { default as CountryMultiSelect } from './CountryMultiSelect';
;

export { default as VerifyButton } from './VerifyButton';
export type { VerifyButtonState } from './VerifyButton';

export { default as VideoTile } from './VideoTile';
;

export { default as CountdownTimer } from './CountdownTimer';
;

// Existing stable primitives (re-exported for discoverability).
export { default as GlokiMark } from './GlokiMark';
export { default as SearchableSelect } from './SearchableSelect';
export { default as StageFooter } from './StageFooter';
export { default as LanguageSwitcher } from './LanguageSwitcher';
;
