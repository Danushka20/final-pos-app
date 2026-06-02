import React from 'react';
import { AlertTriangle, ShoppingBag, Truck } from 'lucide-react-native';
import { PaperSegmentFilter } from '@/components/common/PaperSegmentFilter';
import { colors } from '@/theme';
import type { TodayActivityTab } from '@/navigation/types';

export interface TodayActivityTabCounts {
  sales: number;
  purchases: number;
  reorder: number;
}

interface TodayActivityTabsProps {
  active: TodayActivityTab;
  onChange: (tab: TodayActivityTab) => void;
  counts: TodayActivityTabCounts;
}

const TAB_OPTIONS = [
  {
    value: 'sales' as const,
    label: 'Sales',
    Icon: ShoppingBag,
    checkedColor: colors.primary,
  },
  {
    value: 'purchases' as const,
    label: 'Purchase',
    Icon: Truck,
    checkedColor: colors.primaryDeep,
  },
  {
    value: 'reorder' as const,
    label: 'Reorder',
    Icon: AlertTriangle,
    checkedColor: colors.warning,
  },
];

export const TodayActivityTabs: React.FC<TodayActivityTabsProps> = ({
  active,
  onChange,
  counts,
}) => (
  <PaperSegmentFilter
    title="Today's records"
    options={TAB_OPTIONS.map(opt => ({
      ...opt,
      badge:
        opt.value === 'sales'
          ? counts.sales
          : opt.value === 'purchases'
            ? counts.purchases
            : counts.reorder,
    }))}
    selected={active}
    onSelect={onChange}
  />
);
