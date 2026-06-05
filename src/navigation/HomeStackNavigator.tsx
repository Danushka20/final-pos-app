import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { TodayActivityScreen } from '@/screens/dashboard/TodayActivityScreen';
import { AlertsScreen } from '@/screens/alerts/AlertsScreen';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { ExpensesScreen } from '@/screens/expenses/ExpensesScreen';
import { ExpenseFormScreen } from '@/screens/expenses/ExpenseFormScreen';
import { ReportsListScreen } from '@/screens/reports/ReportsListScreen';
import { ReportViewScreen } from '@/screens/reports/ReportViewScreen';
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
    <Stack.Screen name="ExpensesList" component={ExpensesScreen} />
    <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
    <Stack.Screen name="ReportsList" component={ReportsListScreen} />
    <Stack.Screen name="ReportView" component={ReportViewScreen} />
  </Stack.Navigator>
);
