/** Shared payment-method helpers (aligned with desktop POS). */

export const needsBank = (method: string): boolean =>
  /cheque|bank transfer/i.test(method);

export const isOnlinePayment = (method: string): boolean => /^online$/i.test(method);

export const isCardPayment = (method: string): boolean => /^card$/i.test(method);

export const isCashPayment = (method: string): boolean => /^cash$/i.test(method);

export const isCreditPayment = (method: string): boolean => /^credit$/i.test(method);

/** Amount received field is auto-filled and read-only */
export const locksAmountReceived = (method: string): boolean =>
  isCashPayment(method) || isCreditPayment(method) || isOnlinePayment(method);

export const needsPaymentReference = (method: string): boolean =>
  isOnlinePayment(method) || /bank transfer/i.test(method);

export const acceptsCardLast4 = (method: string): boolean =>
  isOnlinePayment(method) || isCardPayment(method);

export type PaymentNoteInput = {
  reference?: string;
  cardLast4?: string;
};

export function buildPaymentNotes(
  method: string,
  input: PaymentNoteInput,
): string | undefined {
  const ref = input.reference?.trim();
  const card = input.cardLast4?.replace(/\D/g, '').slice(-4);

  if (isOnlinePayment(method)) {
    const parts: string[] = [];
    if (ref) {
      parts.push(`Online payment ref: ${ref}`);
    }
    if (card) {
      parts.push(`Card: ****${card}`);
    }
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }

  if (/bank transfer/i.test(method) && ref) {
    return `Bank transfer ref: ${ref}`;
  }

  if (isCardPayment(method) && card) {
    return `Card payment · ****${card}`;
  }

  return undefined;
}
