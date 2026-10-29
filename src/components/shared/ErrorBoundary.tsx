import React from 'react';
import styles from './ErrorBoundary.module.scss';
import { translate, getStoredLocale } from '../../i18n';
import type { Locale } from '../../i18n';

interface ErrorBoundaryProps {
  fallbackMessage?: string;
  /** Active locale for the boundary's own chrome; defaults to the persisted locale. */
  locale?: Locale;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component error:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const locale = this.props.locale ?? getStoredLocale();
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h3 className={styles.errorTitle}>{translate(locale, 'common.errorTitle', 'Something went wrong')}</h3>
            <p className={styles.errorMessage}>
              {this.props.fallbackMessage ||
                translate(locale, 'errorBoundary.message', 'This section encountered an error. Your other work is safe.')}
            </p>
            <button className={styles.retryButton} onClick={this.handleRetry}>
              {translate(locale, 'common.retry', 'Try again')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
