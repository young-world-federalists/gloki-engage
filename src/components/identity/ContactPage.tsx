import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './InfoPage.module.scss';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const t = useT();
  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack} aria-label={t('common.back', 'Back')}>
        <ArrowLeft size={18} />
      </button>
      <div className={styles.content}>
        {/* The title renders in the AppHeader block (D3). */}
        <p className={styles.text}>
          {t('contact.lead', 'Have questions, feedback, or want to get involved?')}
        </p>
        <p className={styles.text}>
          {t('contact.body', "Reach out to us and we'll get back to you as soon as possible.")}
        </p>
        <div className={styles.contactInfo}>
          <p>hello@gloki.org</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
