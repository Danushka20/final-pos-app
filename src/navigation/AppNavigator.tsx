import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PosSettingsProvider } from '@/context/PosSettingsContext';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import { colors } from '@/theme';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => (
  <PosSettingsProvider>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.backgroundAlt },
      }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    </Stack.Navigator>
  </PosSettingsProvider>
);
