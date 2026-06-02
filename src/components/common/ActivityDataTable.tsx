import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, shadows, typography } from '@/theme';

export interface ActivityTableColumn {
  key: string;
  label: string;
  flex: number;
  align?: 'left' | 'right' | 'center';
}

interface ActivityDataTableProps {
  columns: ActivityTableColumn[];
  emptyMessage: string;
  children: React.ReactNode;
}

export const ActivityDataTable: React.FC<ActivityDataTableProps> = ({
  columns,
  emptyMessage,
  children,
}) => {
  const hasRows = React.Children.count(children) > 0;

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.headerRow}>
        {columns.map(col => (
          <Text
            key={col.key}
            style={[
              styles.headerCell,
              { flex: col.flex },
              col.align === 'right' && styles.alignRight,
              col.align === 'center' && styles.alignCenter,
            ]}
            numberOfLines={1}>
            {col.label}
          </Text>
        ))}
      </View>

      {hasRows ? (
        children
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
};

export const ActivityTableRow: React.FC<{
  columns: ActivityTableColumn[];
  cells: React.ReactNode[];
  isLast?: boolean;
  accent?: 'default' | 'warning' | 'return';
}> = ({ columns, cells, isLast, accent = 'default' }) => (
  <View
    style={[
      styles.row,
      !isLast && styles.rowBorder,
      accent === 'warning' && styles.rowWarning,
      accent === 'return' && styles.rowReturn,
    ]}>
    {columns.map((col, index) => (
      <View
        key={col.key}
        style={[
          styles.cell,
          { flex: col.flex },
          col.align === 'right' && styles.alignRight,
          col.align === 'center' && styles.alignCenter,
        ]}>
        {cells[index]}
      </View>
    ))}
  </View>
);

export const tableCellText = StyleSheet.create({
  primary: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  secondary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  amountExpense: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'right',
  },
  badge: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerCell: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowWarning: {
    backgroundColor: colors.warningSoft,
  },
  rowReturn: {
    backgroundColor: colors.errorSoft,
  },
  cell: {
    justifyContent: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignCenter: {
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
