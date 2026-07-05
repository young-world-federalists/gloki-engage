import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './SlideOutMenu.module.scss';

/** A single entry in a {@link SlideOutMenu}. */
export interface SlideOutMenuItem {
  /** Stable React key. */
  key: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  /** Optional count chip (e.g. hidden-communities count). Falsy → no chip. */
  badge?: number;
  /** `danger` tints the item red (Leave / Logout). */
  variant?: 'default' | 'danger';
  /** Render a divider above this item to group sections. */
  dividerBefore?: boolean;
}

export interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** Panel title (e.g. "Menu" or the community name). */
  title: string;
  items: SlideOutMenuItem[];
  /** Edge the panel slides in from — match it to the trigger's side. Default `right`. */
  side?: 'left' | 'right';
  /** Accessible label for the close button. */
  closeLabel?: string;
  /**
   * Optional settings/footer block pinned below the scrolling item list,
   * separated by the panel's divider treatment (e.g. the global menu's
   * theme + language controls). Rendered inside the dialog's focus trap.
   */
  footer?: React.ReactNode;
}

/**
 * The app's single slide-out menu pattern. Both the global menu
 * (`HomepageMenu`) and the per-community menu (`CommunityView`) render through
 * this so the overlay, panel, item styling, dividers, dark mode, focus-visible
 * rings, 44px targets, Escape-to-close and dialog semantics are identical
 * everywhere — only the `title`, `items` and `side` differ by context.
 */
const SlideOutMenu: React.FC<SlideOutMenuProps> = ({
  isOpen,
  onClose,
  title,
  items,
  side = 'right',
  closeLabel = 'Close menu',
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open; restore it to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      triggerRef.current?.focus?.();
    };
  }, [isOpen]);

  // Escape closes; Tab is trapped within the panel while open (aria-modal alone
  // scopes screen readers, not the keyboard's tab order).
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // Exclude disabled controls (same trap-edge rule as the shared Modal).
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${styles.panel} ${side === 'left' ? styles.panelLeft : styles.panelRight}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{title}</span>
          <button className={styles.closeButton} onClick={onClose} aria-label={closeLabel}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.menuItems}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.key}>
                {item.dividerBefore && <div className={styles.divider} role="separator" />}
                <button
                  className={`${styles.menuItem} ${item.variant === 'danger' ? styles.menuItemDanger : ''}`}
                  onClick={item.onClick}
                >
                  <Icon size={20} />
                  <span className={styles.menuItemLabel}>{item.label}</span>
                  {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default SlideOutMenu;
