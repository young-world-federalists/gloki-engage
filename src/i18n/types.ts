export type Locale = 'en' | 'fr' | 'sw';

/** Flat, dot-namespaced key → string map, e.g. { 'common.close': 'Close' }. */
export type Dictionary = Record<string, string>;

/** Interpolation values for `{placeholder}` tokens in a string. */
export type Vars = Record<string, string | number>;
