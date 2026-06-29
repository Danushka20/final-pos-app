import React from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { GluestackProvider } from '@/components/ui/GluestackProvider';
import { AppPaperProvider } from '@/components/ui/PaperProvider';
import { AuthProvider } from '@/context/AuthContext';
import { DataRefreshProvider } from '@/context/DataRefreshContext';
import { GlobalDataSync } from '@/components/common/GlobalDataSync';
import { AppStartupSetup } from '@/components/common/AppStartupSetup';
import { ErrorDialogProvider } from '@/context/ErrorDialogContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppAlertProvider } from '@/context/AppAlertContext';
import { useImmersiveFullScreen } from '@/hooks/useImmersiveFullScreen';
import { RootNavigator } from '@/navigation/RootNavigator';

function AppRoot(): React.JSX.Element {
  useImmersiveFullScreen();

  return (
    <>
      <StatusBar hidden translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.backgroundAlt }}
        edges={['left', 'right']}>
        <GluestackProvider>
          <AppPaperProvider>
            <ToastProvider>
              <ErrorDialogProvider>
                <AuthProvider>
                  <AppAlertProvider>
                    <DataRefreshProvider>
                      <GlobalDataSync />
                      <AppStartupSetup />
                      <RootNavigator />
                    </DataRefreshProvider>
                  </AppAlertProvider>
                </AuthProvider>
              </ErrorDialogProvider>
            </ToastProvider>
          </AppPaperProvider>
        </GluestackProvider>
      </SafeAreaView>
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.backgroundAlt }}>
      <SafeAreaProvider>
        <AppRoot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
