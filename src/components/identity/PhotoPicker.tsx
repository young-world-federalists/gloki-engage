import React, { useRef } from 'react';
import { Camera, User } from 'lucide-react';
import styles from './PhotoPicker.module.scss';

export interface PhotoPickerProps {
  /** Current photo data URL, or '' for none. */
  value: string;
  onChange: (dataUrl: string) => void;
  /** Initials shown when there's no photo. */
  initials?: string;
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

const PhotoPicker: React.FC<PhotoPickerProps> = ({ value, onChange, initials, label, size = 'lg' }) => {
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
      <button type="button" className={styles.avatar} onClick={() => inputRef.current?.click()} aria-label={label}>
        {value ? (
          <img src={value} alt="" />
        ) : initials ? (
          <span className={styles.initials} aria-hidden>
            {initials}
          </span>
        ) : (
          <User size={28} aria-hidden />
        )}
        <span className={styles.camera} aria-hidden>
          <Camera size={14} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className={styles.input} tabIndex={-1} />
    </div>
  );
};

export default PhotoPicker;
