import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Server } from 'lucide-react-native';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ScreenTopBar, FLOATING_BACK_SCROLL_TOP } from '@/components/common/ScreenTopBar';
import { AuthInput } from '@/components/inputs/AuthInput';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import {
  getApiBaseUrl,
  getWebsiteUrl,
  saveApiConfig,
} from '@/config/env';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { testBackendConnection } from '@/services/api/backendConfigService';
import { buildApiBaseUrl, isValidWebsiteInput } from '@/utils/apiUrl';
import { colors, shadows, typography } from '@/theme';
import type { AuthStackParamList, SettingsStackParamList } from '@/navigation/types';

type ConfigNav = NativeStackNavigationProp<
  AuthStackParamList & SettingsStackParamList,
  'BackendConfig'
>;

type Route = RouteProp<AuthStackParamList, 'BackendConfig'>;

export const BackendConfigScreen: React.FC = () => {
  const navigation = useNavigation<ConfigNav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { showError, showErrorFromUnknown } = useErrorDialog();
  const fromSettings = route.params?.fromSettings ?? false;

  const [website, setWebsite] = useState(getWebsiteUrl());
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  useEffect(() => {
    if (!website && getWebsiteUrl()) {
      setWebsite(getWebsiteUrl());
    }
  }, [website]);

  const apiPreview = website.trim() && isValidWebsiteInput(website)
    ? buildApiBaseUrl(website)
    : '';

  const validate = (): boolean => {
    if (!website.trim()) {
      setFieldError('Website or server address is required');
      return false;
    }
    if (!isValidWebsiteInput(website)) {
      setFieldError('Enter a valid website or IP address');
      return false;
    }
    setFieldError(undefined);
    return true;
  };

  const handleTestAndSave = async () => {
    if (!validate()) {
      return;
    }

    setTesting(true);
    try {
      const apiUrl = buildApiBaseUrl(website);
      await testBackendConnection(apiUrl);
      setSaving(true);
      await saveApiConfig(website);
      showError({
        title: 'Server connected',
        message: `API saved at:\n${apiUrl}`,
        variant: 'info',
        confirmLabel: 'OK',
      });
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    } catch (err) {
      showErrorFromUnknown(err, 'Connection failed');
    } finally {
      setTesting(false);
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (fromSettings) {
      navigation.goBack();
      return;
    }
    if (getApiBaseUrl()) {
      navigation.navigate('Login');
      return;
    }
    showError({
      title: 'Configure server first',
      message: 'Enter your website URL and tap Test & Save before signing in.',
      variant: 'warning',
    });
  };

  return (
    <ScreenContainer>
      <ScreenTopBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SmoothScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + FLOATING_BACK_SCROLL_TOP },
            ]}
            contentPaddingBottom={Math.max(insets.bottom, 24) + 24}>
            <Box style={[styles.card, shadows.lg]} bg={colors.white}>
              <VStack mb="$5" space="md" alignItems="center">
                <Box
                  w={52}
                  h={52}
                  borderRadius="$2xl"
                  bg={colors.primarySoft}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor={colors.primaryMuted}>
                  <Server size={26} color={colors.primary} />
                </Box>
                <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
                  Connect your store
                </Text>
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, textAlign: 'center' },
                  ]}>
                  Enter your Laravel website address. The app will use{' '}
                  <Text style={[typography.bodyMedium, { color: colors.primary }]}>
                    /api
                  </Text>{' '}
                  for all POS requests.
                </Text>
              </VStack>

              <AuthInput
                label="Website / server URL"
                icon={Globe}
                value={website}
                onChangeText={text => {
                  setWebsite(text);
                  if (fieldError) {
                    setFieldError(undefined);
                  }
                }}
                placeholder="https://yourstore.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                error={fieldError}
              />

              <Box
                bg={colors.primarySoft}
                borderRadius="$xl"
                px="$3"
                py="$3"
                mb="$4"
                borderWidth={1}
                borderColor={colors.primaryMuted}>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, fontWeight: '700', marginBottom: 4 },
                  ]}>
                  API endpoint (auto)
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.text }]}>
                  {apiPreview || `${getApiBaseUrl() || 'https://yourstore.com/api'}`}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textMuted, marginTop: 8, lineHeight: 18 },
                  ]}>
                  Examples: https://myshop.com · http://192.168.1.10:8000 ·
                  https://myshop.com/public
                </Text>
              </Box>

              <PrimaryButton
                label="Test & Save"
                onPress={handleTestAndSave}
                loading={testing || saving}
              />

              {!fromSettings ? (
                <PrimaryButton
                  label="Continue to Sign In"
                  variant="outline"
                  onPress={handleContinue}
                  disabled={testing || saving}
                />
              ) : null}

              {getApiBaseUrl() ? (
                <Text
                  style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: 12 }]}>
                  Current: {getApiBaseUrl()}
                </Text>
              ) : null}
            </Box>
          </SmoothScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
