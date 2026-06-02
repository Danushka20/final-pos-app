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
  manage_multiple_locations: 'Multiple locations',
  costing_method: 'Costing method',
  allow_negative_stock: 'Allow negative stock',
  show_low_stock_alert: 'Low stock alerts',
};

export const InventorySettingsScreen: React.FC = () => {
  const { settings, loading, refresh } = usePosSettings();
  const inv = settings?.inventory ?? {};

  const entries = Object.entries(inv).filter(
    ([, v]) => typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number',
  );

  return (
    <ScreenContainer>
      <AppHeader title="Inventory" subtitle="Server settings" showBack />
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
