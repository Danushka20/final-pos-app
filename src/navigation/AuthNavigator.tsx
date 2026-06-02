import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OpeningScreen } from '@/screens/auth/OpeningScreen';
import { BackendConfigScreen } from '@/screens/auth/BackendConfigScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { colors } from '@/theme';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
      contentStyle: { backgroundColor: colors.backgroundAlt },
    }}>
    <Stack.Screen name="Opening" component={OpeningScreen} />
    <Stack.Screen
      name="BackendConfig"
      component={BackendConfigScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);
