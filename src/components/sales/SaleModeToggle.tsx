import React from 'react';
import { RotateCcw, ShoppingCart } from 'lucide-react-native';
import { PaperSegmentFilter } from '@/components/common/PaperSegmentFilter';
import { colors } from '@/theme';
import type { SaleTransactionMode } from '@/types/sales';

interface SaleModeToggleProps {
  mode: SaleTransactionMode;
  onChange: (mode: SaleTransactionMode) => void;
  compact?: boolean;
}

const SALE_MODE_OPTIONS = [
  {
    value: 'sale' as const,
    label: 'New Sale',
    Icon: ShoppingCart,
    checkedColor: colors.primary,
  },
  {
    value: 'return' as const,
    label: 'Return',
    Icon: RotateCcw,
    checkedColor: colors.text,
  },
];

export const SaleModeToggle: React.FC<SaleModeToggleProps> = ({
  mode,
  onChange,
  compact = false,
}) => (
  <PaperSegmentFilter
    options={SALE_MODE_OPTIONS}
    selected={mode}
    onSelect={onChange}
    title={compact ? '' : 'Transaction type'}
  />
);
