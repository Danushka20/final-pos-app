import { PermissionsAndroid, Platform, Share } from 'react-native';
import type { RefObject } from 'react';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import type { SaleReceiptPayload } from '@/types/sales';
import type { PurchaseReceiptPayload } from '@/types/inventory';

export type ReceiptCaptureRef = RefObject<ViewShotRef | null>;

async function requestSaveToGalleryPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const api = Platform.Version;

  // Android 10+ saves via MediaStore — no runtime permission required for photos.
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
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  return `file://${uri}`;
}

async function captureFromViewShotRef(
  viewShotRef: ReceiptCaptureRef,
): Promise<string> {
  await new Promise<void>(resolve => setTimeout(resolve, 500));

  const node = viewShotRef.current;
  if (!node) {
    throw new Error('Receipt is not ready. Wait a moment and try again.');
  }

  if (typeof node.capture === 'function') {
    const uri = await node.capture();
    if (uri) {
      return uri;
    }
  }

  return captureRef(node, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

async function captureBase64FromViewShotRef(
  viewShotRef: ReceiptCaptureRef,
): Promise<string> {
  await new Promise<void>(resolve => setTimeout(resolve, 500));

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
      'Gallery save is not installed. Rebuild the app:\n' +
        'cd POSMobile && npm install && npm run android',
    );
  }
}

async function saveUriToGallery(uri: string, salesId: string): Promise<string> {
  await requestSaveToGalleryPermission();

  const CameraRoll = await getCameraRoll();
  const fileUri = normalizeFileUri(uri);
  const album = 'POS Receipts';

  try {
    await CameraRoll.saveAsset(fileUri, { type: 'photo', album });
    return `Receipt ${salesId} saved to Photos (${album})`;
  } catch {
    await CameraRoll.saveAsset(fileUri, { type: 'photo' });
    return `Receipt ${salesId} saved to Photos`;
  }
}

type ShareableReceipt = SaleReceiptPayload | PurchaseReceiptPayload;

function getReceiptReference(receipt: ShareableReceipt): string {
  if ('purchase' in receipt) {
    return receipt.purchase.invoice_id;
  }
  return receipt.sale.sales_id;
}

/** Save receipt PNG directly to device gallery (Downloads / Photos). */
export async function downloadReceiptAsImage(
  viewShotRef: ReceiptCaptureRef,
  receipt: ShareableReceipt,
): Promise<string> {
  const uri = await captureFromViewShotRef(viewShotRef);
  return saveUriToGallery(uri, getReceiptReference(receipt));
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
    // Android: share a gallery/content URI for better app compatibility.
    await requestSaveToGalleryPermission();
    const CameraRoll = await getCameraRoll();
    const shareableUri = await CameraRoll.saveAsset(fileUri, {
      type: 'photo',
      album: 'POS Receipts',
    });
    await Share.share({
      title: `Receipt ${receiptRef}`,
      url: normalizeFileUri(String(shareableUri)),
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

export function buildReceiptShareText(receipt: SaleReceiptPayload): string {
  const s = receipt.sale;
  const header = receipt.header as Record<string, string | undefined>;
  const company = header.company_name ?? 'Receipt';
  const lines = s.lines
    .map(
      l =>
        `  ${l.item_number ? `[${l.item_number}] ` : ''}${l.description} x${l.qty} = ${l.line_total.toFixed(2)}`,
    )
    .join('\n');

  return [
    company,
    s.is_return ? 'SALES RETURN' : 'TAX INVOICE',
    `Bill: ${s.sales_id}`,
    `Date: ${s.sale_date}`,
    s.location ? `Branch: ${s.location}` : '',
    s.customer_name ? `Customer: ${s.customer_name}` : '',
    `Payment: ${s.payment_method ?? 'Cash'}`,
    '---',
    lines,
    '---',
    `Subtotal: ${s.sub_total.toFixed(2)}`,
    s.discount > 0 ? `Discount: -${s.discount.toFixed(2)}` : '',
    `TOTAL: ${s.net_amount.toFixed(2)}`,
    s.amount_received != null ? `Paid: ${s.amount_received.toFixed(2)}` : '',
    '',
    'Thank you!',
  ]
    .filter(Boolean)
    .join('\n');
}
