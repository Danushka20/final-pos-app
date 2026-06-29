import {
  InteractionManager,
  PermissionsAndroid,
  Platform,
  Share,
} from 'react-native';
import type { RefObject } from 'react';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import {
  getSaleReceiptTitle,
  RECEIPT_SOFTWARE_PROVIDER,
} from '@/constants/receiptBranding';
import { formatPrintAmount, resolveCurrencyCode } from '@/utils/format';
import { formatReceiptQtyDetail, resolveLineUom } from '@/utils/uom';
import type { SaleReceiptPayload } from '@/types/sales';
import type { PurchaseReceiptPayload } from '@/types/inventory';

export type ReceiptCaptureRef = RefObject<ViewShotRef | null>;

async function requestSaveToGalleryPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const api = Platform.Version;

  if (api >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      {
        title: 'Save receipt image',
        message: 'Allow access to save receipt images to your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    return;
  }

  if (api >= 29) {
    return;
  }

  if (api >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Save receipt image',
        message: 'Allow storage access to save receipt images.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Permission denied — cannot save image to gallery.');
    }
  }
}

function normalizeFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) {
    return trimmed;
  }
  return `file://${trimmed}`;
}

async function waitForReceiptLayout(): Promise<void> {
  await new Promise<void>(resolve => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve());
  });
  await new Promise<void>(resolve => setTimeout(resolve, 350));
}

async function captureFromViewShotRef(
  viewShotRef: ReceiptCaptureRef,
): Promise<string> {
  await waitForReceiptLayout();

  const node = viewShotRef.current;
  if (!node) {
    throw new Error('Receipt is not ready. Wait a moment and try again.');
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      if (typeof node.capture === 'function') {
        const captured = await node.capture();
        if (captured) {
          return normalizeFileUri(captured);
        }
      }

      const uri = await captureRef(node, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (uri) {
        return normalizeFileUri(uri);
      }
    } catch (error) {
      lastError = error;
      await new Promise<void>(resolve => setTimeout(resolve, 400));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Could not capture receipt image. Scroll to the top and try again.');
}

async function captureBase64FromViewShotRef(
  viewShotRef: ReceiptCaptureRef,
): Promise<string> {
  await waitForReceiptLayout();

  const node = viewShotRef.current;
  if (!node) {
    throw new Error('Receipt is not ready. Wait a moment and try again.');
  }

  return captureRef(node, {
    format: 'png',
    quality: 1,
    result: 'base64',
  });
}

async function getCameraRoll() {
  try {
    const mod = await import('@react-native-camera-roll/camera-roll');
    return mod.CameraRoll;
  } catch {
    throw new Error(
      'Gallery save is not available. Rebuild the app after installing camera-roll.',
    );
  }
}

function formatSaveError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Could not save receipt image to gallery.';
}

async function saveUriToGallery(uri: string, salesId: string): Promise<string> {
  await requestSaveToGalleryPermission();

  const CameraRoll = await getCameraRoll();
  const fileUri = normalizeFileUri(uri);

  try {
    await CameraRoll.saveAsset(fileUri, { type: 'photo' });
    return `Receipt ${salesId} saved to Photos`;
  } catch (firstError) {
    try {
      await CameraRoll.save(fileUri, { type: 'photo' });
      return `Receipt ${salesId} saved to Photos`;
    } catch {
      throw new Error(formatSaveError(firstError));
    }
  }
}

type ShareableReceipt = SaleReceiptPayload | PurchaseReceiptPayload;

function getReceiptReference(receipt: ShareableReceipt): string {
  if ('purchase' in receipt) {
    return receipt.purchase.invoice_id;
  }
  return receipt.sale.sales_id;
}

/** Save receipt PNG to device gallery (Photos). */
export async function downloadReceiptAsImage(
  viewShotRef: ReceiptCaptureRef,
  receipt: ShareableReceipt,
): Promise<string> {
  const uri = await captureFromViewShotRef(viewShotRef);
  const salesId = getReceiptReference(receipt);
  const fileUri = normalizeFileUri(uri);

  try {
    return await saveUriToGallery(uri, salesId);
  } catch (galleryError) {
    try {
      await Share.share({
        title: `Receipt ${salesId}`,
        message: Platform.OS === 'android' ? `Receipt ${salesId}` : undefined,
        url: fileUri,
      });
      return `Receipt ${salesId} ready — pick Save or Photos in the share menu if gallery save failed.`;
    } catch {
      throw new Error(formatSaveError(galleryError));
    }
  }
}

/** Open share sheet with receipt image file. */
export async function shareReceiptImageFile(
  viewShotRef: ReceiptCaptureRef,
  receipt: ShareableReceipt,
): Promise<void> {
  const fileUri = normalizeFileUri(await captureFromViewShotRef(viewShotRef));
  const receiptRef = getReceiptReference(receipt);

  if (Platform.OS === 'ios') {
    await Share.share({
      url: fileUri,
      title: `Receipt ${receiptRef}`,
    });
    return;
  }

  try {
    await requestSaveToGalleryPermission();
    const CameraRoll = await getCameraRoll();
    const saved = await CameraRoll.saveAsset(fileUri, { type: 'photo' });
    const shareUri =
      saved?.node?.image?.uri != null
        ? normalizeFileUri(String(saved.node.image.uri))
        : fileUri;
    await Share.share({
      title: `Receipt ${receiptRef}`,
      url: shareUri,
    });
  } catch {
    try {
      const base64 = await captureBase64FromViewShotRef(viewShotRef);
      const dataUri = `data:image/png;base64,${base64}`;
      await Share.share({
        title: `Receipt ${receiptRef}`,
        url: dataUri,
      });
    } catch {
      await Share.share({ title: `Receipt ${receiptRef}`, url: fileUri });
    }
  }
}

export function buildReceiptShareText(
  receipt: SaleReceiptPayload,
  currency?: string | null,
): string {
  const s = receipt.sale;
  const header = receipt.header as Record<string, string | undefined>;
  const company = header.company_name ?? 'Receipt';
  const code = resolveCurrencyCode(currency);
  const isHold = Boolean(s.is_hold || s.order_status === 'hold');
  const discountLine =
    s.discount > 0
      ? `Discount${s.discount_percent != null && s.discount_percent > 0 ? ` (${s.discount_percent}%)` : ''}: -${formatPrintAmount(s.discount, code)}`
      : '';
  const lines = s.lines
    .map(l => {
      const uom = resolveLineUom(l.uom);
      return `  ${l.item_number ? `[${l.item_number}] ` : ''}${l.description} ${formatReceiptQtyDetail(l.qty, formatPrintAmount(l.unit_price, code), uom)} = ${formatPrintAmount(l.line_total, code)}`;
    })
    .join('\n');

  return [
    company,
    getSaleReceiptTitle({ isHold, isReturn: Boolean(s.is_return) }),
    isHold ? 'NOT PAID — Complete to finalize' : '',
    `${isHold ? 'Hold' : s.is_return ? 'Return' : 'Bill'}: ${s.sales_id}`,
    `Date: ${s.sale_date}`,
    s.location ? `Branch: ${s.location}` : '',
    s.customer_name ? `Customer: ${s.customer_name}` : '',
    `Payment: ${s.payment_method ?? 'Cash'}`,
    '---',
    lines,
    '---',
    `Subtotal: ${formatPrintAmount(s.sub_total, code)}`,
    discountLine,
    `${isHold ? 'Amount due' : s.discount > 0 ? 'Balance' : 'TOTAL'}: ${formatPrintAmount(s.net_amount, code)}`,
    !isHold && s.amount_received != null
      ? `Paid: ${formatPrintAmount(s.amount_received, code)}`
      : '',
    isHold ? 'THIS BILL IS ON HOLD' : '',
    '',
    'Thank you!',
    RECEIPT_SOFTWARE_PROVIDER,
  ]
    .filter(Boolean)
    .join('\n');
}
