import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PauseCircle } from 'lucide-react-native';
import { colors, radius, typography } from '@/theme';

interface PosSalesHeaderProps {
  title: string;
  badge?: string;
  subtitle?: string;
  holdOrdersLabel?: string;
  onHoldOrdersPress?: () => void;
}

export const PosSalesHeader: React.FC<PosSalesHeaderProps> = ({
  title,
  badge,
  subtitle,
  holdOrdersLabel,
  onHoldOrdersPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actions}>
          {onHoldOrdersPress ? (
            <Pressable
              onPress={onHoldOrdersPress}
              style={styles.holdBtn}
              accessibilityRole="button"
              accessibilityLabel="Hold orders">
              <PauseCircle size={16} color={colors.text} />
              <Text style={styles.holdBtnText}>{holdOrdersLabel ?? 'Hold'}</Text>
            </Pressable>
          ) : null}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  holdBtnText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    fontSize: 11,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 11,
  },
});
