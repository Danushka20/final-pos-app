import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PosSaleProvider } from '@/context/PosSaleContext';
import { SalesScreen } from '@/screens/sales/SalesScreen';
import { SaleOrderScreen } from '@/screens/sales/SaleOrderScreen';
import { SaleReceiptScreen } from '@/screens/sales/SaleReceiptScreen';
import type { SalesStackParamList } from './types';

const Stack = createNativeStackNavigator<SalesStackParamList>();

export const SalesStackNavigator: React.FC = () => (
  <PosSaleProvider>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}>
      <Stack.Screen name="SalesPOS" component={SalesScreen} />
      <Stack.Screen name="SaleOrder" component={SaleOrderScreen} />
      <Stack.Screen name="SaleReceipt" component={SaleReceiptScreen} />
    </Stack.Navigator>
  </PosSaleProvider>
);
