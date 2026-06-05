import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { CompanySettingsScreen } from '@/screens/settings/CompanySettingsScreen';
import { InventorySettingsScreen } from '@/screens/settings/InventorySettingsScreen';
import { OrderSettingsScreen } from '@/screens/settings/OrderSettingsScreen';
import { AlertSettingsScreen } from '@/screens/settings/AlertSettingsScreen';
import { NotificationsSettingsScreen } from '@/screens/settings/NotificationsSettingsScreen';
import { UserProfileScreen } from '@/screens/settings/UserProfileScreen';
import { PrinterSetupScreen } from '@/screens/settings/PrinterSetupScreen';
import { ReceiptCustomizeScreen } from '@/screens/settings/ReceiptCustomizeScreen';
import { BackendConfigScreen } from '@/screens/auth/BackendConfigScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }}>
    <Stack.Screen name="SettingsHome" component={SettingsScreen} />
    <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
    <Stack.Screen name="InventorySettings" component={InventorySettingsScreen} />
    <Stack.Screen name="OrderSettings" component={OrderSettingsScreen} />
    <Stack.Screen name="AlertSettings" component={AlertSettingsScreen} />
    <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="PrinterSetup" component={PrinterSetupScreen} />
    <Stack.Screen name="ReceiptCustomize" component={ReceiptCustomizeScreen} />
    <Stack.Screen name="BackendConfig" component={BackendConfigScreen} />
  </Stack.Navigator>
);
