import type { ApplicableOffer } from '@/types/offers';
import type { CartLine, InventoryItem } from '@/types/sales';

const round2 = (n: number) => Math.round(n * 100) / 100;

function offerBatchIds(offer: ApplicableOffer): Set<number> {
  return new Set(offer.item_batch_ids ?? []);
}

function offerRestrictsBatches(offer: ApplicableOffer): boolean {
  return offerBatchIds(offer).size > 0 || Boolean(offer.restricts_batches);
}

function lineMatchesOfferItem(
  line: CartLine,
  offer: ApplicableOffer,
): boolean {
  const ids = new Set(offer.item_ids ?? []);
  const numbers = new Set(
    (offer.item_numbers ?? []).map(n => n.trim().toLowerCase()).filter(Boolean),
  );

  if (ids.has(line.item_id)) {
    return true;
  }

  const number = line.item_number?.trim().toLowerCase();
  return Boolean(number && numbers.has(number));
}

/** True when the cart contains at least one line linked to this product offer. */
export function cartMatchesProductOffer(
  cart: CartLine[],
  offer: ApplicableOffer,
): boolean {
  if (offer.discount_type !== 'product') {
    return false;
  }

  const batchIds = offerBatchIds(offer);
  const restrictsBatches = offerRestrictsBatches(offer);

  return cart.some(line => {
    if (!lineMatchesOfferItem(line, offer)) {
      return false;
    }
    if (restrictsBatches) {
      return line.item_batch_id != null && batchIds.has(line.item_batch_id);
    }
    return true;
  });
}

export function findProductOffersForCart(
  offers: ApplicableOffer[],
  cart: CartLine[],
): ApplicableOffer[] {
  return offers.filter(
    offer => offer.discount_type === 'product' && cartMatchesProductOffer(cart, offer),
  );
}

export function filterOrderOffers(offers: ApplicableOffer[]): ApplicableOffer[] {
  return offers.filter(offer => offer.discount_type === 'order');
}

export function filterPromoOnlyOrderOffers(offers: ApplicableOffer[]): ApplicableOffer[] {
  return filterOrderOffers(offers).filter(offer => offer.requires_promo_code);
}

export function cartSubTotal(cart: CartLine[]): number {
  return round2(cart.reduce((sum, line) => sum + line.line_total, 0));
}

/** Order offer that applies when cart subtotal meets the minimum. */
export function qualifiesMinOrderOffer(
  offer: ApplicableOffer,
  subTotal: number,
): boolean {
  return (
    offer.discount_type === 'order' &&
    Boolean(offer.uses_min_order_total) &&
    subTotal >= (offer.min_order_amount ?? 0)
  );
}

export function findQualifyingMinOrderOffers(
  offers: ApplicableOffer[],
  cart: CartLine[],
): ApplicableOffer[] {
  const subTotal = cartSubTotal(cart);
  return filterOrderOffers(offers).filter(offer =>
    qualifiesMinOrderOffer(offer, subTotal),
  );
}

export function orderOfferQualifies(offer: ApplicableOffer, subTotal: number): boolean {
  return qualifiesMinOrderOffer(offer, subTotal);
}

export function offerStillApplies(
  offer: ApplicableOffer,
  cart: CartLine[],
  subTotal: number,
): boolean {
  if (offer.discount_type === 'product') {
    return cartMatchesProductOffer(cart, offer);
  }
  if (offer.discount_type === 'order') {
    if (offer.requires_promo_code) {
      return true;
    }
    return orderOfferQualifies(offer, subTotal);
  }
  return false;
}

export function estimateOfferDiscount(
  offer: ApplicableOffer,
  cart: CartLine[],
  subTotal: number,
): number {
  if (offer.discount_type === 'product') {
    const pct = offer.product_percent_off ?? 0;
    if (pct <= 0) {
      return 0;
    }
    const matchingTotal = cart
      .filter(line => cartMatchesProductOffer([line], offer))
      .reduce((sum, line) => sum + line.line_total, 0);
    return round2(matchingTotal * (pct / 100));
  }

  if (orderOfferQualifies(offer, subTotal)) {
    const pct = offer.min_percent_off ?? 0;
    return round2(subTotal * (pct / 100));
  }

  return 0;
}

export function findBestProductOffer(
  cart: CartLine[],
  offers: ApplicableOffer[],
): ApplicableOffer | null {
  const matching = findProductOffersForCart(offers, cart);
  if (matching.length === 0) {
    return null;
  }
  return matching.reduce((best, current) =>
    estimateOfferDiscount(current, cart, 0) > estimateOfferDiscount(best, cart, 0)
      ? current
      : best,
  );
}

export function findBestOrderOffer(
  offers: ApplicableOffer[],
  subTotal: number,
): ApplicableOffer | null {
  const matching = offers.filter(o => orderOfferQualifies(o, subTotal));
  if (matching.length === 0) {
    return null;
  }
  return matching.reduce((best, current) =>
    estimateOfferDiscount(current, [], subTotal) > estimateOfferDiscount(best, [], subTotal)
      ? current
      : best,
  );
}

/** Quick local estimate — preview API picks the final offer in auto-resolve. */
export function findBestAutoOffer(
  cart: CartLine[],
  offers: ApplicableOffer[],
  subTotal: number,
): ApplicableOffer | null {
  const candidates = offers.filter(offer => {
    if (offer.discount_type === 'product') {
      return cartMatchesProductOffer(cart, offer);
    }
    return orderOfferQualifies(offer, subTotal);
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, current) =>
    estimateOfferDiscount(current, cart, subTotal) >
    estimateOfferDiscount(best, cart, subTotal)
      ? current
      : best,
  );
}

export function offerCanPreview(
  offer: ApplicableOffer,
  cart: CartLine[],
  promoCode?: string | null,
): boolean {
  if (cart.length === 0) {
    return false;
  }

  if (offer.discount_type === 'order') {
    if (offer.requires_promo_code && !String(promoCode ?? '').trim()) {
      return false;
    }
    return true;
  }

  return cartMatchesProductOffer(cart, offer);
}

export function isItemInOffer(
  item: Pick<InventoryItem, 'id' | 'item_number'>,
  offer: ApplicableOffer,
): boolean {
  if (offer.discount_type !== 'product') {
    return false;
  }
  if (offerRestrictsBatches(offer)) {
    return false;
  }
  if (offer.item_ids.includes(item.id)) {
    return true;
  }
  const number = item.item_number?.trim();
  return Boolean(number && offer.item_numbers.includes(number));
}

export function getProductOffersForItem(
  item: Pick<InventoryItem, 'id' | 'item_number'>,
  offers: ApplicableOffer[],
): ApplicableOffer[] {
  return offers.filter(o => isItemInOffer(item, o));
}
