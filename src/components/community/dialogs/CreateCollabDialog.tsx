import React, { useState, useEffect } from 'react';
import styles from './CreateCollabDialog.module.scss';
import { COLLAB_TEMPLATES, type CollabTemplate } from '../../collaboration/collabTemplates';
import { useT } from '../../../i18n';

interface CreateCollabDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (name: string, template: CollabTemplate) => void | Promise<void>;
}

const CreateCollabDialog: React.FC<CreateCollabDialogProps> = ({
  isVisible,
  onClose,
  onSubmit,
}) => {
  const t = useT();
  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(COLLAB_TEMPLATES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setName('');
      setSelectedTemplateId(COLLAB_TEMPLATES[0].id);
      setError(null);
    }
  }, [isVisible]);

  const handleClose = () => {
    setName('');
    setSelectedTemplateId(COLLAB_TEMPLATES[0].id);
    setError(null);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError(t('collab.create.nameRequired', 'Please enter a name for your collaboration'));
      return;
    }

    const template = COLLAB_TEMPLATES.find((tpl) => tpl.id === selectedTemplateId);
    if (!template) {
      setError(t('collab.create.templateRequired', 'Please select a template'));
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(name.trim(), template));
      handleClose();
    } catch {
      setError(t('collab.create.failed', 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3 className={styles.title}>{t('collab.create.title', 'Start a Collab')}</h3>
          <button className={styles.closeButton} onClick={handleClose} aria-label={t('common.close', 'Close')}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label htmlFor="collabName" className={styles.label}>
              {t('collab.create.nameLabel', 'Name *')}
            </label>
            <input
              id="collabName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('collab.create.namePlaceholder', 'What are you collaborating on?')}
              className={styles.inputField}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('collab.create.templateLabel', 'Template')}</label>
            <div className={styles.templateGrid}>
              {COLLAB_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`${styles.templateCard} ${selectedTemplateId === template.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                  disabled={isSubmitting}
                >
                  <span className={styles.templateLabel}>{t(`collab.template.${template.id}.label`, template.label)}</span>
                  <span className={styles.templateDescription}>{t(`collab.template.${template.id}.description`, template.description)}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleSubmit}
            className={styles.createButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('collab.create.creating', 'Creating...') : t('collab.create.submit', 'Start Collab')}
          </button>
          <button
            onClick={handleClose}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCollabDialog;
