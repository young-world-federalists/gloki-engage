// S42 — the three account kinds, in door order, with their localized labels.
// One list so the doors page, the Kind step and the Ready recap never drift.
import type { TFunction } from '../../i18n';
import type { AccountKind } from '../../services/interfaces';

export const ACCOUNT_KINDS: AccountKind[] = ['person', 'organisation', 'contributor'];

export function accountKindLabel(t: TFunction, kind: AccountKind): string {
  switch (kind) {
    case 'organisation':
      return t('beta.kind.organisation', 'Organisation');
    case 'contributor':
      return t('beta.kind.contributor', 'Node contributor');
    default:
      return t('beta.kind.person', 'Person');
  }
}
