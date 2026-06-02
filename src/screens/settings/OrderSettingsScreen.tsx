import React from 'react';
import { RefreshControl } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingField } from '@/components/settings/SettingField';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { usePosSettings } from '@/context/PosSettingsContext';

const LABELS: Record<string, string> = {
  allow_sales_negative_inventory: 'Sell when out of stock',
  allow_edit_selling_price: 'Edit price on sale',
  default_payment_method: 'Default payment',
  allow_order_discount: 'Order discount',
  search_box_short_key_style: 'Search style',
  hide_quantity_from_plu_on_sales_screen: 'Hide qty on PLU',
};

export const OrderSettingsScreen: React.FC = () => {
  const { settings, loading, refresh } = usePosSettings();
  const order = settings?.order ?? {};

  const entries = Object.entries(order).filter(
    ([, v]) => typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number',
  );

  return (
    <ScreenContainer>
      <AppHeader title="Orders / POS" subtitle="Server settings" showBack />
      {loading && entries.length === 0 ? (
        <LoadingOverlay message="Loading…" />
      ) : null}
      <SmoothScrollView
        contentPaddingBottom={40}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }>
        <VStack bg="$white" mt="$2" mb="$6">
          {entries.map(([key, value]) => (
            <SettingField
              key={key}
              label={LABELS[key] ?? key.replace(/_/g, ' ')}
              value={value as string | boolean | number}
            />
          ))}
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
