import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../../i18n';
import styles from './SearchableSelect.module.scss';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  const t = useT();
  const triggerPlaceholder = placeholder ?? t('select.placeholder', 'Select...');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selected ? (
          <span>{selected.icon && `${selected.icon} `}{selected.label}</span>
        ) : (
          <span className={styles.placeholder}>{triggerPlaceholder}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder={t('select.search', 'Search...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.optionsList}>
            {filtered.length === 0 ? (
              <div className={styles.noResults}>{t('select.noMatches', 'No matches')}</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`${styles.option} ${o.value === value ? styles.selected : ''}`}
                  onClick={() => handleSelect(o.value)}
                >
                  {o.icon && <span className={styles.optionIcon}>{o.icon}</span>}
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
