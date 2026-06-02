export type AppAlertSeverity = 'info' | 'warning' | 'error';

export type AppAlertAction =
  | { type: 'today_reorder' }
  | { type: 'today_sales' }
  | { type: 'products' }
  | { type: 'sales' };

export interface AppAlert {
  id: string;
  title: string;
  message: string;
  severity: AppAlertSeverity;
  createdAt: string;
  action?: AppAlertAction;
}

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
}
