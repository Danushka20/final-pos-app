import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReportsListScreen } from '@/screens/reports/ReportsListScreen';
import { ReportViewScreen } from '@/screens/reports/ReportViewScreen';
import { ReportCategoryScreen } from '@/screens/reports/ReportCategoryScreen';
import type { ReportsStackParamList } from './types';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export const ReportsStackNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
    }}>
    <Stack.Screen name="ReportsList" component={ReportsListScreen} />
    <Stack.Screen name="ReportCategory" component={ReportCategoryScreen} />
    <Stack.Screen name="ReportView" component={ReportViewScreen} />
  </Stack.Navigator>
);
