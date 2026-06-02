import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  User,
} from 'lucide-react-native';
import { HomeStackNavigator } from '@/navigation/HomeStackNavigator';
import { SettingsStackNavigator } from '@/navigation/SettingsStackNavigator';
import { SalesStackNavigator } from '@/navigation/SalesStackNavigator';
import { ProductsStackNavigator } from '@/navigation/ProductsStackNavigator';
import { colors, shadows, typography } from '@/theme';
import {
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_HEIGHT,
  TAB_BAR_HORIZONTAL_MARGIN,
} from '@/theme/layout';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon =
  (Icon: typeof LayoutDashboard) =>
  ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) =>
    (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Icon
          size={focused ? size : size - 1}
          color={focused ? colors.primary : color}
          strokeWidth={focused ? 2.5 : 2}
        />
      </View>
    );

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, TAB_BAR_BOTTOM_MARGIN);
  const baseTabBarStyle = {
    position: 'absolute' as const,
    left: TAB_BAR_HORIZONTAL_MARGIN,
    right: TAB_BAR_HORIZONTAL_MARGIN,
    bottom: bottomOffset,
    height: TAB_BAR_HEIGHT,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.tabBar,
    borderTopWidth: 0,
    borderRadius: 28,
    ...shadows.lg,
  };

  return (
    <Tab.Navigator
      initialRouteName="Sales"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.backgroundAlt },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginTop: 2,
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarStyle: baseTabBarStyle,
        animation: 'shift',
        transitionSpec: {
          animation: 'spring',
          config: {
            stiffness: 400,
            damping: 34,
            mass: 0.85,
            overshootClamping: false,
          },
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: tabIcon(LayoutDashboard),
        }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesStackNavigator}
        options={({ route }) => {
          const childRouteName = getFocusedRouteNameFromRoute(route) ?? 'SalesPOS';
          const hideTabBar = childRouteName === 'SaleOrder' || childRouteName === 'SaleReceipt';
          return {
            tabBarLabel: 'Sales',
            tabBarIcon: tabIcon(ShoppingCart),
            tabBarStyle: hideTabBar
              ? [baseTabBarStyle, { display: 'none' }]
              : baseTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsStackNavigator}
        options={({ route }) => {
          const childRouteName =
            getFocusedRouteNameFromRoute(route) ?? 'ProductsList';
          const hideTabBar =
            childRouteName === 'PurchaseOrder' || childRouteName === 'PurchaseReceipt';
          return {
            tabBarLabel: 'Products',
            tabBarIcon: tabIcon(Package),
            tabBarStyle: hideTabBar
              ? [baseTabBarStyle, { display: 'none' }]
              : baseTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: tabIcon(User),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.white,
  },
});
