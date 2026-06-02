import React from 'react';
import { StyleSheet } from 'react-native';
import { SegmentedButtons, Surface, Text, useTheme } from 'react-native-paper';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme';

export type PaperSegmentOption<T extends string> = {
  value: T;
  label: string;
  Icon: LucideIcon;
  /** Paper checked color for this segment */
  checkedColor?: string;
  /** Shown in label as "Label (n)" */
  badge?: number;
};

interface PaperSegmentFilterProps<T extends string> {
  options: PaperSegmentOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  /** Omit or pass empty string to hide the heading */
  title?: string;
}

function formatLabel(label: string, badge?: number): string {
  if (badge == null) {
    return label;
  }
  const n = badge > 99 ? '99+' : String(badge);
  return `${label} (${n})`;
}

export function PaperSegmentFilter<T extends string>({
  options,
  selected,
  onSelect,
  title,
}: PaperSegmentFilterProps<T>) {
  const theme = useTheme();
  const heading = title ?? 'Transaction type';

  return (
    <Surface style={styles.card} elevation={1}>
      {heading ? (
        <Text variant="labelSmall" style={styles.title}>
          {heading}
        </Text>
      ) : null}

      <SegmentedButtons
        value={selected}
        onValueChange={value => {
          if (typeof value === 'string') {
            onSelect(value as T);
          }
        }}
        density="small"
        style={styles.segmented}
        buttons={options.map(opt => ({
          value: opt.value,
          label: formatLabel(opt.label, opt.badge),
          checkedColor: opt.checkedColor ?? theme.colors.primary,
          uncheckedColor: colors.textMuted,
          icon: ({ size, color }: { size: number; color: string }) => (
            <opt.Icon
              size={Math.min(size, 18)}
              color={color}
              strokeWidth={2}
            />
          ),
          style: styles.button,
          labelStyle: styles.buttonLabel,
        }))}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    borderRadius: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  segmented: {
    marginHorizontal: 0,
    minHeight: 40,
  },
  button: {
    minHeight: 40,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
});
