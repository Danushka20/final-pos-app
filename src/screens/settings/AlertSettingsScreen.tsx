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
  expiry_alert_period_days: 'Expiry alert period (days)',
  cheque_alert_period_days: 'Cheque alert period (days)',
};

export const AlertSettingsScreen: React.FC = () => {
  const { settings, loading, refresh } = usePosSettings();
  const alert = settings?.alert ?? {};

  const entries = Object.entries(alert).filter(
    ([, v]) => typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number',
  );

  return (
    <ScreenContainer>
      <AppHeader
        title="Alert settings"
        subtitle="Expiry & cheque reminders"
        showBack
      />
      {loading && entries.length === 0 ? (
        <LoadingOverlay message="Loading…" />
      ) : null}
      <SmoothScrollView
        contentPaddingBottom={40}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }>
        <VStack bg="$white" mt="$2" mb="$6">
          {entries.length === 0 ? (
            <SettingField label="Alerts" value="No alert settings loaded" />
          ) : (
            entries.map(([key, value]) => (
              <SettingField
                key={key}
                label={LABELS[key] ?? key.replace(/_/g, ' ')}
                value={value as string | boolean | number}
              />
            ))
          )}
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
