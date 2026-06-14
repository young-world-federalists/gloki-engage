import React, { useCallback, useRef, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useT } from '../../i18n';

interface DialogConfig {
  message: React.ReactNode;
  title?: React.ReactNode;
  mode: 'alert' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Render the confirm action in the destructive (red) variant. */
  destructive?: boolean;
}

export interface AlertOptions {
  /** Heading text. Always pass one — the shared Modal header reads bare without it. */
  title?: React.ReactNode;
}

export interface ConfirmOptions extends AlertOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Drop-in, a11y-correct replacement for window.alert / window.confirm built on
 * the shared <Modal> (focus trap, Esc, focus restore — none of which the native
 * dialogs or the legacy hand-rolled overlays give us).
 *
 *   const { showAlert, showConfirm, alertElement } = useAlert();
 *   await showAlert(t('x.failed', '…'), { title: t('common.errorTitle', '…') });
 *   if (await showConfirm(t('x.body', '…'), { title: '…', destructive: true })) reset();
 *   return <>{…}{alertElement}</>;
 *
 * Both calls resolve a Promise: showConfirm → true/false, showAlert → always
 * false (the result is ignored). Closing via Esc / backdrop / X resolves false.
 */
export function useAlert() {
  const t = useT();
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    setConfig(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(ok);
  }, []);

  const present = useCallback((cfg: DialogConfig) => {
    setConfig(cfg);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const showAlert = useCallback(
    (message: React.ReactNode, opts?: AlertOptions) =>
      present({ mode: 'alert', message, title: opts?.title }),
    [present],
  );

  const showConfirm = useCallback(
    (message: React.ReactNode, opts?: ConfirmOptions) =>
      present({ mode: 'confirm', message, ...opts }),
    [present],
  );

  const alertElement = config ? (
    <Modal
      isOpen
      onClose={() => settle(false)}
      title={config.title}
      closeLabel={t('common.close', 'Close')}
      size="sm"
      footer={
        config.mode === 'confirm' ? (
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {config.cancelLabel ?? t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant={config.destructive ? 'destructive' : 'primary'}
              onClick={() => settle(true)}
            >
              {config.confirmLabel ?? t('common.confirm', 'Confirm')}
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => settle(false)}>
            {t('common.ok', 'OK')}
          </Button>
        )
      }
    >
      {config.message}
    </Modal>
  ) : null;

  return { showAlert, showConfirm, alertElement };
}

export default useAlert;
