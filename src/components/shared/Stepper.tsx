import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import styles from './Stepper.module.scss';

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-based index of the active step. Steps before it render as complete. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** If provided, completed/active markers become clickable (e.g. go back a step). */
  onStepClick?: (index: number) => void;
}

type StepState = 'complete' | 'active' | 'upcoming';

/** Progress indicator for multi-step flows (onboarding, create wizards). */
const Stepper: React.FC<StepperProps> = ({ steps, current, orientation = 'horizontal', onStepClick }) => {
  return (
    <ol className={clsx(styles.stepper, styles[orientation])}>
      {steps.map((step, i) => {
        const state: StepState = i < current ? 'complete' : i === current ? 'active' : 'upcoming';
        const clickable = !!onStepClick && i <= current;
        const marker =
          state === 'complete' ? <Check size={16} aria-hidden /> : <span>{i + 1}</span>;

        return (
          <li key={i} className={clsx(styles.step, styles[state])}>
            <div className={styles.markerRow}>
              {clickable ? (
                <button
                  type="button"
                  className={styles.marker}
                  onClick={() => onStepClick?.(i)}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  {marker}
                </button>
              ) : (
                <div className={styles.marker} aria-current={state === 'active' ? 'step' : undefined}>
                  {marker}
                </div>
              )}
              {i < steps.length - 1 && <span className={styles.connector} aria-hidden />}
            </div>
            <div className={styles.text}>
              <span className={styles.label}>{step.label}</span>
              {step.description && <span className={styles.description}>{step.description}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default Stepper;
