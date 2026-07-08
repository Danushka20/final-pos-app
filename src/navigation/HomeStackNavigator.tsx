import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { TodayActivityScreen } from '@/screens/dashboard/TodayActivityScreen';
import { AlertsScreen } from '@/screens/alerts/AlertsScreen';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { ExpensesScreen } from '@/screens/expenses/ExpensesScreen';
import { ExpenseFormScreen } from '@/screens/expenses/ExpenseFormScreen';
import { CustomerFormScreen } from '@/screens/customers/CustomerFormScreen';
import { CustomerReceivePaymentScreen } from '@/screens/customers/CustomerReceivePaymentScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="AlertsList" component={AlertsScreen} />
    <Stack.Screen name="TodayActivity" component={TodayActivityScreen} />
    <Stack.Screen name="CustomersList" component={CustomersScreen} />
    <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
    <Stack.Screen
      name="CustomerReceivePayment"
      component={CustomerReceivePaymentScreen}
    />
    <Stack.Screen name="ExpensesList" component={ExpensesScreen} />
    <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
  </Stack.Navigator>
);
