import React from 'react';
import { RefreshControl } from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SettingField } from '@/components/settings/SettingField';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { usePosSettings } from '@/context/PosSettingsContext';

function flattenNotifications(
  value: unknown,
  prefix = '',
): Array<{ key: string; label: string; value: string | boolean | number }> {
  if (value == null) {
    return [];
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return [{ key: prefix, label: prefix.replace(/_/g, ' '), value }];
  }
  if (typeof value === 'string') {
    return [{ key: prefix, label: prefix.replace(/_/g, ' '), value }];
  }
  if (Array.isArray(value)) {
    return [{ key: prefix, label: prefix.replace(/_/g, ' '), value: value.join(', ') }];
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      flattenNotifications(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [];
}

const LABELS: Record<string, string> = {
  enabled: 'Notifications enabled',
  send_email: 'Send email',
  send_sms: 'Send SMS',
  email_subject: 'Email subject',
  email_body: 'Email body',
  sms_template: 'SMS template',
};

export const NotificationsSettingsScreen: React.FC = () => {
  const { settings, loading, refresh } = usePosSettings();
  const entries = flattenNotifications(settings?.notifications ?? {});

  return (
    <ScreenContainer>
      <AppHeader
        title="Notifications"
        subtitle="Customer SMS & email"
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
            <SettingField label="Notifications" value="No notification settings loaded" />
          ) : (
            entries.map(entry => {
              const shortKey = entry.key.split('.').pop() ?? entry.key;
              return (
                <SettingField
                  key={entry.key}
                  label={LABELS[shortKey] ?? entry.label}
                  value={entry.value}
                />
              );
            })
          )}
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
