// Lane F — connectivity kit. Low-bandwidth & offline UX primitives other lanes
// drop into their surfaces. Import: `import { SyncBadge, useDataSaver } from '../shared/connectivity'`.

export { default as DataSaverToggle } from './DataSaverToggle';
export type { DataSaverToggleProps } from './DataSaverToggle';

export { default as SmartImage } from './SmartImage';
export type { SmartImageProps } from './SmartImage';

export { default as SyncBadge } from './SyncBadge';
export type { SyncBadgeProps } from './SyncBadge';

export { default as ChannelBadge } from './ChannelBadge';
export type { ChannelBadgeProps } from './ChannelBadge';

export { useDataSaver, setDataSaver } from './useDataSaver';

export { default as OfflineBanner } from './OfflineBanner';
export { useOnline } from './useOnline';
