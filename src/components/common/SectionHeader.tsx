import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { colors, typography } from '@/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}) => (
  <View style={styles.wrap}>
    <View style={styles.textCol}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {actionLabel && onActionPress ? (
      <Button
        mode="text"
        compact
        onPress={onActionPress}
        labelStyle={styles.actionLabel}
        contentStyle={styles.actionContent}>
        {actionLabel}
      </Button>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  actionLabel: {
    ...typography.label,
    fontSize: 13,
    color: colors.text,
  },
  actionContent: {
    marginVertical: 0,
  },
});
