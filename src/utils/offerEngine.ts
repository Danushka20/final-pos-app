import { offerService } from '@/services/api/offerService';
import type { ApplicableOffer } from '@/types/offers';
import type { CartLine } from '@/types/sales';
import {
  cartMatchesProductOffer,
  findProductOffersForCart,
  findQualifyingMinOrderOffers,
  filterPromoOnlyOrderOffers,
  offerCanPreview,
} from '@/utils/offerHelpers';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function cartOfferSignature(cart: CartLine[]): string {
  return cart
    .map(
      line =>
        `${line.item_id}|${line.item_number ?? ''}|${line.item_batch_id ?? ''}|${line.qty}|${line.unit_price}`,
    )
    .join(';');
}

function previewLinesFromCart(cart: CartLine[]) {
  return cart.map(line => ({
    item_id: line.item_id,
    item_number: line.item_number,
    item_batch_id: line.item_batch_id ?? null,
    description: line.description,
    qty: line.qty,
    unit_price: line.unit_price,
  }));
}

async function previewOfferDiscountAmount(
  offerId: number,
  cart: CartLine[],
  promoCode?: string | null,
): Promise<number> {
  try {
    const preview = await offerService.preview({
      offerId,
      lines: cart,
      promoCode,
    });
    return preview.offer_discount;
  } catch {
    return 0;
  }
}

async function resolveBestOfferIdByPreview(
  offers: ApplicableOffer[],
  cart: CartLine[],
  promoCode?: string | null,
  requirePositiveDiscount = false,
): Promise<number | null> {
  if (offers.length === 0 || cart.length === 0) {
    return null;
  }

  if (offers.length === 1) {
    if (!requirePositiveDiscount) {
      return offers[0].id;
    }
    const discount = await previewOfferDiscountAmount(offers[0].id, cart, promoCode);
    return discount > 0 ? offers[0].id : null;
  }

  const results = await Promise.all(
    offers.map(async offer => {
      const discount = await previewOfferDiscountAmount(offer.id, cart, promoCode);
      return { id: offer.id, discount };
    }),
  );

  const best = results.reduce((top, row) => (row.discount > top.discount ? row : top));
  if (requirePositiveDiscount && best.discount <= 0) {
    return null;
  }
  return best.id;
}

async function resolveBestProductOfferId(
  offers: ApplicableOffer[],
  cart: CartLine[],
  requirePositiveDiscount = false,
): Promise<number | null> {
  if (offers.length === 0 || cart.length === 0) {
    return null;
  }

  const id = await resolveBestOfferIdByPreview(
    offers,
    cart,
    null,
    requirePositiveDiscount,
  );

  if (id != null) {
    return id;
  }

  if (offers.length === 1 && cartMatchesProductOffer(cart, offers[0])) {
    return offers[0].id;
  }

  return null;
}

async function resolvePromoOrderOfferId(
  offers: ApplicableOffer[],
  cart: CartLine[],
  promoCode: string,
): Promise<number | null> {
  const code = promoCode.trim();
  if (!code) {
    return null;
  }
  return resolveBestOfferIdByPreview(offers, cart, code, true);
}

/** Pick product vs min-order offer when both could apply; prefers the larger preview discount. */
export async function resolveBestAutoOfferId(
  applicableOffers: ApplicableOffer[],
  cart: CartLine[],
  promoCode?: string | null,
): Promise<number | null> {
  const matchingProductOffers = findProductOffersForCart(applicableOffers, cart);
  const qualifyingMinOrderOffers = findQualifyingMinOrderOffers(applicableOffers, cart);
  const promoOnlyOrderOffers = filterPromoOnlyOrderOffers(applicableOffers);

  const productId =
    matchingProductOffers.length > 0
      ? await resolveBestProductOfferId(matchingProductOffers, cart, true)
      : null;

  let orderId: number | null = null;
  if (qualifyingMinOrderOffers.length === 1) {
    orderId = await resolveBestOfferIdByPreview(
      qualifyingMinOrderOffers,
      cart,
      promoCode,
      true,
    );
  } else if (qualifyingMinOrderOffers.length > 1) {
    orderId = await resolveBestOfferIdByPreview(
      qualifyingMinOrderOffers,
      cart,
      promoCode,
      true,
    );
  }

  let promoOrderId: number | null = null;
  const normalizedPromo = promoCode?.trim();
  if (promoOnlyOrderOffers.length > 0 && normalizedPromo) {
    promoOrderId = await resolvePromoOrderOfferId(
      promoOnlyOrderOffers,
      cart,
      normalizedPromo,
    );
  }

  const candidateIds = [productId, orderId, promoOrderId].filter(
    (id): id is number => id != null,
  );
  if (candidateIds.length === 0) {
    return null;
  }
  if (candidateIds.length === 1) {
    return candidateIds[0];
  }

  const discounts = await Promise.all(
    candidateIds.map(async id => {
      const amount = await previewOfferDiscountAmount(id, cart, promoCode);
      return { id, amount };
    }),
  );

  const best = discounts.reduce((top, row) => (row.amount > top.amount ? row : top));
  return best.amount > 0 ? best.id : null;
}

export function cartSubTotal(cart: CartLine[]): number {
  return round2(cart.reduce((sum, line) => sum + line.line_total, 0));
}

export { offerCanPreview, previewLinesFromCart };
