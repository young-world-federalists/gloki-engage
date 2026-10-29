import React, { useState } from 'react';
import { Award, Check } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { endorseExpert, unendorseExpert } from '../../services/initiativeRoles';
import styles from './ExpertEndorseButton.module.scss';

interface ExpertEndorseButtonProps {
  initiativeId: string;
  target: string;
  endorsementCount: number;
  isExpert: boolean;
  iEndorse: boolean;
  onChange?: () => void;
}

const ExpertEndorseButton: React.FC<ExpertEndorseButtonProps> = ({
  initiativeId, target, endorsementCount, isExpert, iEndorse, onChange,
}) => {
  const serverUrl = useAppSelector((s) => s.user.serverUrl);
  const publicKey = useAppSelector((s) => s.user.publicKey);
  const [busy, setBusy] = useState(false);

  if (!publicKey || publicKey === target) return null;

  const handleClick = async () => {
    if (!serverUrl || !publicKey || busy) return;
    setBusy(true);
    try {
      if (iEndorse) {
        await unendorseExpert(serverUrl, publicKey, initiativeId, target);
      } else {
        await endorseExpert(serverUrl, publicKey, initiativeId, target);
      }
      if (onChange) onChange();
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  };

  const label = isExpert
    ? `Expert · ${endorsementCount} endorsements`
    : iEndorse
      ? `Endorsed · ${endorsementCount}`
      : endorsementCount > 0
        ? `Endorse · ${endorsementCount}`
        : 'Endorse as expert';

  return (
    <button
      className={`${styles.btn} ${iEndorse ? styles.endorsed : ''} ${isExpert ? styles.expert : ''}`}
      onClick={handleClick}
      disabled={busy}
      title={label}
      type="button"
    >
      {iEndorse ? <Check size={16} /> : <Award size={16} />}
      <span>{endorsementCount}</span>
    </button>
  );
};

export default ExpertEndorseButton;
