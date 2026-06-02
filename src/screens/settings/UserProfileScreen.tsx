import React, { useEffect, useState } from 'react';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { AuthInput } from '@/components/inputs/AuthInput';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SettingField } from '@/components/settings/SettingField';
import { useAuth } from '@/context/AuthContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { settingsService } from '@/services/api/settingsService';
import { colors } from '@/theme';

export const UserProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const { showError, showErrorFromUnknown } = useErrorDialog();
  const [userSettings, setUserSettings] = useState<Record<string, unknown>>({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService
      .getUserSettings()
      .then(data => {
        setUserSettings(data);
        setFirstName(String(data.first_name ?? ''));
        setLastName(String(data.last_name ?? ''));
        setPhone(String(data.phone ?? ''));
      })
      .catch(() => {});
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const data = await settingsService.updateUserSettings({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setUserSettings(data);
      showError({
        title: 'Saved',
        message: 'Profile updated on server.',
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showErrorFromUnknown(e, 'Profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="User profile" showBack />

      <SmoothScrollView contentContainerStyle={{ padding: 20 }} contentPaddingBottom={40}>
        <VStack
          bg="$white"
          borderRadius="$xl"
          borderWidth={1}
          borderColor={colors.border}
          overflow="hidden"
          mb="$4">
          <SettingField label="Account email" value={user?.email} />
          <SettingField label="Display name" value={user?.name} />
          <SettingField label="Role" value={userSettings.role as string} />
        </VStack>

        <Text fontWeight="$semibold" mb="$2" color={colors.text}>
          Edit profile
        </Text>
        <AuthInput label="First name" value={firstName} onChangeText={setFirstName} />
        <AuthInput label="Last name" value={lastName} onChangeText={setLastName} />
        <AuthInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Box mt="$2">
          <PrimaryButton
            label="Save to server"
            onPress={onSave}
            loading={saving}
          />
        </Box>
      </SmoothScrollView>
    </ScreenContainer>
  );
};
