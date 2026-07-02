import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { Package, Receipt } from 'lucide-react-native';
import { formatCurrency } from '@/utils/format';
import { colors, typography } from '@/theme';
import type { ApplicableOffer } from '@/types/offers';

interface CartOffersSummaryProps {
  productOffers: ApplicableOffer[];
  orderOffers: ApplicableOffer[];
  selectedOffer: ApplicableOffer | null;
  subTotal: number;
  currency?: string;
  compact?: boolean;
}

function orderOfferHint(
  offer: ApplicableOffer,
  subTotal: number,
  currency?: string,
): string {
  if (offer.uses_min_order_total) {
    const min = offer.min_order_amount ?? 0;
    if (subTotal >= min && offer.min_percent_off) {
      return `Min ${formatCurrency(min, currency)} met · ${offer.min_percent_off}% off`;
    }
    const gap = Math.max(0, min - subTotal);
    if (gap > 0.009) {
      return `Add ${formatCurrency(gap, currency)} more (min ${formatCurrency(min, currency)})`;
    }
    return `Min order ${formatCurrency(min, currency)}`;
  }
  if (offer.requires_promo_code) {
    return offer.discount_summary ?? 'Enter promo code';
  }
  return offer.discount_summary ?? 'Applies to whole order';
}

export const CartOffersSummary: React.FC<CartOffersSummaryProps> = ({
  productOffers,
  orderOffers,
  selectedOffer,
  subTotal,
  currency,
  compact = false,
}) => {
  if (productOffers.length === 0 && orderOffers.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {productOffers.length > 0 ? (
        <View style={[styles.block, styles.productBlock, compact && styles.blockCompact]}>
          <View style={styles.blockTitleRow}>
            <Package size={14} color={colors.success} />
            <Text style={styles.productTitle}>Product offers</Text>
          </View>
          {productOffers.map(offer => {
            const active = selectedOffer?.id === offer.id;
            return (
              <Text
                key={offer.id}
                style={[styles.offerLine, active && styles.offerLineActive]}
                numberOfLines={2}>
                {active ? '✓ ' : ''}
                {offer.name}
                {offer.product_percent_off ? ` · ${offer.product_percent_off}%` : ''}
                {offer.item_count > 0 ? ` · ${offer.item_count} item(s)` : ''}
              </Text>
            );
          })}
        </View>
      ) : null}

      {orderOffers.length > 0 ? (
        <View style={[styles.block, styles.orderBlock, compact && styles.blockCompact]}>
          <View style={styles.blockTitleRow}>
            <Receipt size={14} color={colors.primary} />
            <Text style={styles.orderTitle}>Order offers</Text>
          </View>
          {orderOffers.map(offer => {
            const active = selectedOffer?.id === offer.id;
            const qualifies =
              !offer.uses_min_order_total ||
              subTotal >= (offer.min_order_amount ?? 0);
            return (
              <Text
                key={offer.id}
                style={[
                  styles.offerLine,
                  active && styles.offerLineActive,
                  !qualifies && !active && styles.offerLineMuted,
                ]}
                numberOfLines={2}>
                {active ? '✓ ' : ''}
                {offer.name} · {orderOfferHint(offer, subTotal, currency)}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 10,
  },
  block: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  blockCompact: {
    padding: 8,
  },
  productBlock: {
    backgroundColor: colors.pastelGreenSoft,
    borderColor: colors.pastelGreen,
  },
  orderBlock: {
    backgroundColor: colors.pastelBlueSoft,
    borderColor: colors.pastelBlue,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  productTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.success,
    textTransform: 'uppercase',
  },
  orderTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  offerLine: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  offerLineActive: {
    color: colors.text,
    fontWeight: '700',
  },
  offerLineMuted: {
    color: colors.textMuted,
  },
});
