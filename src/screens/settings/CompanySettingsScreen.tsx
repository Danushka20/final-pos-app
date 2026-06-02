import React, { useEffect } from 'react';
import { RefreshControl } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingField } from '@/components/settings/SettingField';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { usePosSettings } from '@/context/PosSettingsContext';

export const CompanySettingsScreen: React.FC = () => {
  const { settings, loading, refresh } = usePosSettings();
  const c = settings?.company;
  const h = settings?.printHeader;

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScreenContainer>
      <AppHeader title="Company" subtitle="From server" showBack />
      {loading && !c ? <LoadingOverlay message="Loading…" /> : null}
      <SmoothScrollView
        contentPaddingBottom={40}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }>
        <VStack bg="$white" mt="$2" mb="$6">
          <SettingField label="Business name" value={c?.name} />
          <SettingField label="Industry" value={c?.industry} />
          <SettingField label="Email" value={c?.email} />
          <SettingField label="Phone" value={c?.phone} />
          <SettingField label="Address" value={c?.address} />
          <SettingField label="City" value={c?.city} />
          <SettingField label="State" value={c?.state} />
          <SettingField label="ZIP" value={c?.zip} />
          <SettingField label="Country" value={c?.country} />
          <SettingField label="Tax ID" value={c?.tax_id} />
          <SettingField label="Registration no." value={c?.registration_number} />
          <SettingField label="Currency" value={c?.currency} />
          <SettingField label="Language" value={c?.language} />
          <SettingField label="Print header line" value={h?.address_line} />
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
