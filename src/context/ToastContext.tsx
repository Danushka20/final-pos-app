import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ToastBanner } from '@/components/common/ToastBanner';
import type { ToastMessage, ToastVariant } from '@/types/notifications';

interface ShowToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
  showSuccess: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    setToast({
      id: String(Date.now()),
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
    });
  }, []);

  const showSuccess = useCallback(
    (message: string, title = 'Success') => {
      showToast({ title, message, variant: 'success' });
    },
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, showSuccess }),
    [showToast, showSuccess],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastBanner toast={toast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
