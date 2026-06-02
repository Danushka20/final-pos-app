import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Surface } from 'react-native-paper';
import { colors, shadows } from '@/theme';
import { getPaymentMethodMeta } from '@/utils/paymentMethodMeta';

interface PaymentMethodPickerProps {
  methods: string[];
  selected: string;
  onSelect: (method: string) => void;
  title?: string;
}

export const PaymentMethodPicker: React.FC<PaymentMethodPickerProps> = ({
  methods,
  selected,
  onSelect,
  title = 'Payment method',
}) => (
  <Surface style={styles.card} elevation={1}>
    {title ? <Text style={styles.title}>{title}</Text> : null}
    <View style={styles.grid}>
      {methods.map(method => {
        const active = selected === method;
        const meta = getPaymentMethodMeta(method);

        return (
          <Pressable
            key={method}
            onPress={() => onSelect(method)}
            style={[
              styles.tile,
              shadows.sm,
              active
                ? {
                    backgroundColor: meta.activeColor,
                    borderColor: meta.activeColor,
                  }
                : styles.tileIdle,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <meta.Icon
              size={22}
              color={active ? colors.textOnPrimary : meta.activeColor}
              strokeWidth={2.2}
            />
            <Text
              style={[styles.tileLabel, active && styles.tileLabelActive]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </Surface>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    maxWidth: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 72,
    gap: 6,
  },
  tileIdle: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tileLabelActive: {
    color: colors.textOnPrimary,
  },
});
