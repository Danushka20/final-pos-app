import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BarChart3, TrendingUp } from 'lucide-react-native';
import { Surface, Text } from 'react-native-paper';
import type { SalesChartDay } from '@/types/dashboard';
import { formatCurrency } from '@/utils/format';
import { colors, shadows, typography, radius } from '@/theme';

interface SalesChartCardProps {
  data: SalesChartDay[];
  currency?: string;
}

const CARD_H_PAD = 14;
const SCREEN_H_PAD = 16;

export const SalesChartCard: React.FC<SalesChartCardProps> = ({ data, currency }) => {
  const { width: screenWidth } = useWindowDimensions();

  const layout = useMemo(() => {
    const chartWidth = screenWidth - SCREEN_H_PAD * 2 - CARD_H_PAD * 2;
    const barCount = Math.max(data.length, 1);
    const gap = screenWidth < 360 ? 5 : 7;
    const barWidth = Math.min(
      22,
      Math.floor((chartWidth - gap * (barCount - 1)) / barCount),
    );
    const chartHeight = Math.round(
      Math.min(68, Math.max(52, screenWidth * 0.14)),
    );
    return { chartWidth, barWidth, gap, chartHeight };
  }, [data.length, screenWidth]);

  if (!data.length) {
    return null;
  }

  const maxAmount = Math.max(...data.map(d => d.sales_amount), 1);
  const totalWeek = data.reduce((s, d) => s + d.sales_amount, 0);
  const peakDay = data.find(d => d.sales_amount === maxAmount && maxAmount > 0);

  return (
    <Surface style={[styles.card, shadows.card]} elevation={0}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="titleMedium" style={styles.title}>
            Sales trend
          </Text>
          <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
            7 days · {formatCurrency(totalWeek, currency)}
          </Text>
        </View>
        <View style={styles.iconBadge}>
          <BarChart3 size={17} color={colors.text} strokeWidth={2.25} />
        </View>
      </View>

      <View style={[styles.chartWrap, { height: layout.chartHeight + 22 }]}>
        <View style={styles.baseline} />
        <View
          style={[
            styles.barsRow,
            {
              height: layout.chartHeight,
              gap: layout.gap,
              paddingHorizontal: 2,
            },
          ]}>
          {data.map((day, index) => {
            const ratio = day.sales_amount / maxAmount;
            const barH = Math.max(
              day.sales_amount > 0 ? 6 : 3,
              Math.round(ratio * layout.chartHeight),
            );
            const isPeak = day.sales_amount === maxAmount && maxAmount > 0;
            const striped = index % 2 === 1 && !isPeak;

            return (
              <View
                key={day.date}
                style={[styles.barCol, { width: layout.barWidth }]}>
                {isPeak ? (
                  <View style={styles.peakDot} />
                ) : (
                  <View style={styles.peakSpacer} />
                )}
                <View
                  style={[
                    styles.barTrack,
                    {
                      height: layout.chartHeight,
                      width: layout.barWidth,
                    },
                  ]}>
                  <View
                    style={[
                      styles.barFill,
                      striped && styles.barFillStriped,
                      isPeak && styles.barFillPeak,
                      {
                        height: barH,
                        width: layout.barWidth,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel} numberOfLines={1}>
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.chip}>
          <TrendingUp size={12} color={colors.text} />
          <Text style={styles.chipText}>Actual sales</Text>
        </View>
        {peakDay ? (
          <Text style={styles.peakText} numberOfLines={1}>
            Peak {peakDay.label} · {formatCurrency(maxAmount, currency)}
          </Text>
        ) : null}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: CARD_H_PAD,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chartWrap: {
    backgroundColor: colors.pastelYellowSoft,
    borderRadius: radius.lg,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  baseline: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 26,
    height: 1,
    backgroundColor: colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  peakDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text,
    marginBottom: 3,
  },
  peakSpacer: {
    height: 8,
  },
  barTrack: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    backgroundColor: colors.textSecondary,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 3,
  },
  barFillPeak: {
    backgroundColor: colors.text,
  },
  barFillStriped: {
    backgroundColor: colors.borderStrong,
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  peakText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
