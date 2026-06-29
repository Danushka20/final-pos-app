import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ChevronRight, LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { cardStyles, colors, radius, typography } from '@/theme';

export type StatCardVariant = 'default' | 'yellow' | 'pink' | 'green' | 'dark';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ComponentType<LucideProps>;
  accentColor?: string;
  variant?: StatCardVariant;
  fullWidth?: boolean;
  subtitleColor?: string;
  compact?: boolean;
  onPress?: () => void;
}

const variantStyles: Record<
  StatCardVariant,
  { card: object; title: string; value: string; subtitle: string; iconBg: string; iconColor: string }
> = {
  default: {
    card: cardStyles.surfaceFlat,
    title: colors.textMuted,
    value: colors.text,
    subtitle: colors.textMuted,
    iconBg: colors.backgroundAlt,
    iconColor: colors.text,
  },
  yellow: {
    card: cardStyles.pastelYellow,
    title: colors.textSecondary,
    value: colors.text,
    subtitle: colors.textSecondary,
    iconBg: colors.pastelYellow,
    iconColor: colors.text,
  },
  pink: {
    card: cardStyles.pastelPink,
    title: colors.textSecondary,
    value: colors.text,
    subtitle: colors.textSecondary,
    iconBg: colors.pastelPink,
    iconColor: colors.text,
  },
  green: {
    card: cardStyles.pastelGreen,
    title: colors.textSecondary,
    value: colors.text,
    subtitle: colors.textSecondary,
    iconBg: colors.pastelGreen,
    iconColor: colors.text,
  },
  dark: {
    card: cardStyles.dark,
    title: colors.textOnDark,
    value: colors.textOnDark,
    subtitle: 'rgba(255,255,255,0.72)',
    iconBg: 'rgba(255,255,255,0.12)',
    iconColor: colors.textOnDark,
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  fullWidth = false,
  subtitleColor,
  compact = false,
  onPress,
}) => {
  const tone = variantStyles[variant];

  return (
    <Card
      mode="outlined"
      style={[
        fullWidth ? styles.full : styles.half,
        compact && styles.compact,
        tone.card,
        styles.card,
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconBadge, { backgroundColor: tone.iconBg }]}>
          <Icon size={compact ? 18 : 20} color={tone.iconColor} strokeWidth={2.35} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.cardTitle, { color: tone.title }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.value, { color: tone.value }]} numberOfLines={1}>
            {value}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: subtitleColor ?? tone.subtitle }]}
              numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <ChevronRight
            size={18}
            color={variant === 'dark' ? colors.textOnDark : colors.textMuted}
          />
        ) : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: 'transparent',
  },
  full: {
    width: '100%',
    marginBottom: 0,
  },
  half: {
    width: '100%',
    marginBottom: 0,
  },
  compact: {
    minHeight: 84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  value: {
    ...typography.h2,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 4,
  },
  subtitle: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 4,
  },
});
