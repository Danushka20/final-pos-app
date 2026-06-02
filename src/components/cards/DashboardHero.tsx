import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { Card, Text } from 'react-native-paper';
import { cardStyles, colors, radius, typography } from '@/theme';

interface KpiPill {
  label: string;
  value: string;
}

interface DashboardHeroProps {
  firstName: string;
  revenue: string;
  revenueHint?: string;
  loading?: boolean;
  generatedAt?: string;
  pills: KpiPill[];
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  firstName,
  revenue,
  revenueHint,
  loading,
  generatedAt,
  pills,
}) => (
  <Card mode="outlined" style={[cardStyles.surface, styles.card]}>
    <Card.Content style={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.greetingText}>Good day, {firstName}</Text>
          <Text style={styles.heroTitle}>Store dashboard</Text>
          {generatedAt ? <Text style={styles.synced}>Synced {generatedAt}</Text> : null}
        </View>
        <View style={styles.heroIcon}>
          <TrendingUp size={22} color={colors.text} strokeWidth={2.25} />
        </View>
      </View>

      <View style={styles.revenuePanel}>
        <Text style={styles.revenueLabel}>Today&apos;s actual sales</Text>
        <Text style={styles.revenueValue}>{loading ? '—' : revenue}</Text>
        {revenueHint ? (
          <View style={styles.hintRow}>
            <TrendingUp size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.hintText}>{revenueHint}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.pillRow}>
        {pills.map(pill => (
          <View key={pill.label} style={styles.pill}>
            <Text style={styles.pillLabel} numberOfLines={1}>
              {pill.label}
            </Text>
            <Text style={styles.pillValue} numberOfLines={1}>
              {loading ? '—' : pill.value}
            </Text>
          </View>
        ))}
      </View>
    </Card.Content>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderColor: colors.border,
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  greetingText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: 4,
  },
  synced: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  revenuePanel: {
    backgroundColor: colors.cardDark,
    borderRadius: radius.lg,
    padding: 18,
  },
  revenueLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
  },
  revenueValue: {
    ...typography.screenTitle,
    color: colors.textOnDark,
    marginTop: 6,
    fontSize: 34,
    lineHeight: 40,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  hintText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pillLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillValue: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    marginTop: 4,
    fontSize: 15,
  },
});
