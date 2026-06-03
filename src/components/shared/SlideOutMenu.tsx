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
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Move focus into the dialog so keyboard / screen-reader users land here.
    panelRef.current?.focus();
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
      </div>
    </div>
  );
};

export default SlideOutMenu;
