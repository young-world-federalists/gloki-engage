import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useT } from '../../i18n';
import styles from './PhotoPicker.module.scss';

export interface PhotoPickerProps {
  /** Current photo data URL, or '' for none. */
  value: string;
  onChange: (dataUrl: string) => void;
  /** Accessible label for the upload control (translated). */
  label: string;
  size?: 'md' | 'lg';
}

const MAX_DIMENSION = 200;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width;
          width = MAX_DIMENSION;
        }
      } else if (height > MAX_DIMENSION) {
        width = (width * MAX_DIMENSION) / height;
        height = MAX_DIMENSION;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no-2d-context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = URL.createObjectURL(file);
  });
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ value, onChange, label, size = 'lg' }) => {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      onChange(await resizeImage(file));
    } catch {
      /* ignore — keep the prior value */
    }
  };

  return (
    <div className={`${styles.picker} ${styles[size]}`}>
      <button
        type="button"
        className={`${styles.avatar} ${value ? '' : styles.empty}`}
        onClick={() => inputRef.current?.click()}
        aria-label={label}
      >
        {value ? (
          <img src={value} alt="" />
        ) : (
          <span className={styles.prompt} aria-hidden>
            <Camera size={size === 'md' ? 22 : 28} />
            <span className={styles.promptText}>{t('photo.add', 'Add photo')}</span>
          </span>
        )}
      </button>
      {/* Corner "change photo" badge — sibling of the button so the avatar's
          overflow:hidden never clips it. Decorative; clicks fall through to the button. */}
      {value && (
        <span className={styles.badge} aria-hidden>
          <Camera size={16} />
        </span>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className={styles.input} tabIndex={-1} />
    </div>
  );
};

export default PhotoPicker;
