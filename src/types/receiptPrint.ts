export type ReceiptTextAlign = 'left' | 'center' | 'right';

export type ReceiptTitleFont = 'normal' | 'large' | 'bold';

export type ReceiptPaperWidth = '58mm' | '80mm';

export interface ReceiptPrintCustomization {
  headerAlign: ReceiptTextAlign;
  bodyAlign: ReceiptTextAlign;
  titleFont: ReceiptTitleFont;
  showLogo: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showTaxId: boolean;
  showRegistration: boolean;
  footerMessage: string;
  paperWidth: ReceiptPaperWidth;
}

export const DEFAULT_RECEIPT_PRINT_CUSTOMIZATION: ReceiptPrintCustomization = {
  headerAlign: 'center',
  bodyAlign: 'left',
  titleFont: 'bold',
  showLogo: true,
  showPhone: true,
  showEmail: true,
  showTaxId: true,
  showRegistration: true,
  footerMessage: 'Thank you for your business!',
  paperWidth: '58mm',
};
