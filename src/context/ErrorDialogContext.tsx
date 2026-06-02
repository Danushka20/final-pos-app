import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import {
  ErrorDialog,
  ErrorDialogVariant,
} from '@/components/modals/ErrorDialog';
import { getErrorMessage } from '@/utils/errors';

interface ShowErrorOptions {
  title?: string;
  message: string;
  variant?: ErrorDialogVariant;
  confirmLabel?: string;
}

interface ShowConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface ErrorDialogContextValue {
  showError: (options: ShowErrorOptions) => void;
  showErrorFromUnknown: (error: unknown, title?: string) => void;
  showConfirm: (options: ShowConfirmOptions) => void;
  hideError: () => void;
}

const ErrorDialogContext = createContext<ErrorDialogContextValue | undefined>(
  undefined,
);

export const ErrorDialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('Error');
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<ErrorDialogVariant>('error');
  const [confirmLabel, setConfirmLabel] = useState('OK');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmBtnLabel, setConfirmBtnLabel] = useState('Confirm');
  const [cancelBtnLabel, setCancelBtnLabel] = useState('Cancel');
  const confirmActionRef = React.useRef<() => void>(() => {});

  const hideError = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const showConfirm = useCallback((options: ShowConfirmOptions) => {
    setConfirmTitle(options.title);
    setConfirmMessage(options.message);
    setConfirmBtnLabel(options.confirmLabel ?? 'Confirm');
    setCancelBtnLabel(options.cancelLabel ?? 'Cancel');
    confirmActionRef.current = options.onConfirm;
    setConfirmOpen(true);
  }, []);

  const showError = useCallback((options: ShowErrorOptions) => {
    setTitle(options.title ?? 'Error');
    setMessage(options.message);
    setVariant(options.variant ?? 'error');
    setConfirmLabel(options.confirmLabel ?? 'OK');
    setIsOpen(true);
  }, []);

  const showErrorFromUnknown = useCallback(
    (error: unknown, dialogTitle = 'Something went wrong') => {
      showError({
        title: dialogTitle,
        message: getErrorMessage(error),
        variant: 'error',
      });
    },
    [showError],
  );

  const value = useMemo(
    () => ({ showError, showErrorFromUnknown, showConfirm, hideError }),
    [showError, showErrorFromUnknown, showConfirm, hideError],
  );

  return (
    <ErrorDialogContext.Provider value={value}>
      {children}
      <ErrorDialog
        isOpen={isOpen}
        title={title}
        message={message}
        variant={variant}
        confirmLabel={confirmLabel}
        onClose={hideError}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmBtnLabel}
        cancelLabel={cancelBtnLabel}
        onCancel={hideConfirm}
        onConfirm={() => {
          hideConfirm();
          confirmActionRef.current();
        }}
      />
    </ErrorDialogContext.Provider>
  );
};

export const useErrorDialog = (): ErrorDialogContextValue => {
  const context = useContext(ErrorDialogContext);
  if (!context) {
    throw new Error('useErrorDialog must be used within ErrorDialogProvider');
  }
  return context;
};
