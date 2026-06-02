import React, { useEffect, useState } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { initApiConfig } from '@/config/env';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator } from '@/navigation/AppNavigator';
import { navigationRef } from '@/navigation/navigationRef';
import { usePhoneNotificationHandlers } from '@/hooks/usePhoneNotificationHandlers';
import { colors } from '@/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.backgroundAlt,
    card: colors.backgroundAlt,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [configReady, setConfigReady] = useState(false);

  usePhoneNotificationHandlers(isAuthenticated);

  useEffect(() => {
    initApiConfig().finally(() => setConfigReady(true));
  }, []);

  if (isLoading || !configReady) {
    return <LoadingOverlay fullscreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
