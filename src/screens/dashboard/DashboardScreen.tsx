import React, { useEffect, useRef } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ShoppingCart,
  Package,
  Users,
  Plus,
  Truck,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Receipt,
} from 'lucide-react-native';
import { Card, Text } from 'react-native-paper';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { DashboardHomeHeader } from '@/components/dashboard/DashboardHomeHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { DashboardPanel } from '@/components/common/DashboardPanel';
import { DashboardHero } from '@/components/cards/DashboardHero';
import { StatCard } from '@/components/cards/StatCard';
import { QuickActionCard } from '@/components/cards/QuickActionCard';
import { RecentTransactionRow } from '@/components/cards/RecentTransactionRow';
import { SalesChartCard } from '@/components/cards/SalesChartCard';
import { useAppAlerts } from '@/context/AppAlertContext';
import { useAuth } from '@/context/AuthContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { useDashboard } from '@/hooks/useDashboard';
import { colors, TAB_BAR_SCROLL_PADDING } from '@/theme';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const QUICK_ACTIONS = [
  { id: 'sale', label: 'New Sale', subtitle: 'Open POS checkout', icon: Plus, color: colors.pastelYellow },
  { id: 'inventory', label: 'Inventory', subtitle: 'Stock & items', icon: Package, color: colors.pastelGreen },
  { id: 'expenses', label: 'Expenses', subtitle: 'View history', icon: Wallet, color: colors.pastelPink },
  { id: 'expense_new', label: 'Add Expense', subtitle: 'Record cost', icon: Receipt, color: colors.pastelYellowSoft },
  { id: 'customers', label: 'Customers', subtitle: 'Manage CRM', icon: Users, color: colors.pastelBlue },
  { id: 'purchases', label: 'Purchases', subtitle: 'Supplier orders', icon: Truck, color: colors.pastelGreenSoft },
] as const;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNav>();
  const { user, logout } = useAuth();
  const { currency } = usePosSettings();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const { unreadCount } = useAppAlerts();
  const {
    loading,
    refreshing,
    refresh,
    error,
    revenue,
    revenueChange,
    revenueHint,
    monthRevenue,
    orders,
    products,
    lowStock,
    customers,
    holdOrders,
    todayExpenses,
    todayPurchases,
    salesChart,
    recentTransactions,
    generatedAt,
  } = useDashboard();

  const lastError = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastError.current) {
      lastError.current = error;
      showErrorFromUnknown(new Error(error), 'Dashboard unavailable');
    }
  }, [error, showErrorFromUnknown]);

  const handleLogout = () => {
    showConfirm({
      title: 'Sign out?',
      message: 'You will need to log in again to access your store.',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      onConfirm: () => logout(),
    });
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const handleQuickAction = (id: (typeof QUICK_ACTIONS)[number]['id']) => {
    switch (id) {
      case 'sale':
        navigation.navigate('Sales');
        break;
      case 'inventory':
        navigation.navigate('Products', { screen: 'ProductsList' });
        break;
      case 'expenses':
        navigation.navigate('ExpensesList');
        break;
      case 'expense_new':
        navigation.navigate('ExpenseForm', {});
        break;
      case 'customers':
        navigation.navigate('CustomersList');
        break;
      case 'purchases':
        navigation.navigate('Products', { screen: 'PurchasesList' });
        break;
      default:
        break;
    }
  };

  const onTransactionPress = (type: string) => {
    if (type === 'expense') {
      navigation.navigate('ExpensesList');
      return;
    }
    if (type === 'purchase') {
      navigation.navigate('Products', { screen: 'PurchasesList' });
      return;
    }
    navigation.navigate('Sales');
  };

  const heroHint =
    revenueHint ??
    revenueChange ??
    (monthRevenue ? `Month actual sales ${monthRevenue}` : undefined);

  return (
    <ScreenContainer enableTabSwipe>
      <DashboardHomeHeader
        userName={user?.name}
        alertCount={unreadCount}
        onAlertsPress={() => navigation.navigate('AlertsList')}
        onLogout={handleLogout}
      />

      <SmoothScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <DashboardHero
          firstName={firstName}
          revenue={revenue}
          revenueHint={heroHint}
          loading={loading}
          generatedAt={generatedAt}
          pills={[
            { label: 'Orders', value: orders },
            { label: 'Customers', value: customers },
            { label: 'Expenses', value: todayExpenses },
          ]}
        />

        {salesChart.length > 0 ? (
          <SalesChartCard data={salesChart} currency={currency} />
        ) : null}

        <DashboardPanel>
          <SectionHeader
            title="Business metrics"
            subtitle="Tap any card to open details"
          />
          <View style={styles.metricsGrid}>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Sales today"
                value={orders}
                subtitle="Actual sale bills only"
                icon={ShoppingCart}
                variant="yellow"
                onPress={() => navigation.navigate('TodayActivity', { tab: 'sales' })}
              />
            </View>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Inventory"
                value={products}
                subtitle={lowStock !== '0' ? `${lowStock} low stock` : 'Active items'}
                icon={Package}
                variant="green"
                subtitleColor={lowStock !== '0' ? colors.warning : colors.success}
                onPress={() =>
                  lowStock !== '0'
                    ? navigation.navigate('TodayActivity', { tab: 'reorder' })
                    : navigation.navigate('Products', { screen: 'ProductsList' })
                }
              />
            </View>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Customers"
                value={customers}
                subtitle="Registered"
                icon={Users}
                accentColor={colors.chartCustomers}
                onPress={() => navigation.navigate('CustomersList')}
              />
            </View>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Hold orders"
                value={holdOrders}
                subtitle="Needs action"
                icon={AlertTriangle}
                variant="pink"
                subtitleColor={colors.warning}
                onPress={() => navigation.navigate('Sales')}
              />
            </View>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Expenses"
                value={todayExpenses}
                subtitle="Today"
                icon={Wallet}
                accentColor={colors.chartExpenses}
                subtitleColor={colors.textMuted}
                onPress={() => navigation.navigate('ExpensesList')}
              />
            </View>
            <View style={styles.metricHalf}>
              <StatCard
                fullWidth
                compact
                title="Purchases"
                value={todayPurchases}
                subtitle="Today"
                icon={Truck}
                accentColor={colors.chartOrders}
                onPress={() => navigation.navigate('TodayActivity', { tab: 'purchases' })}
              />
            </View>
            <View style={styles.metricFull}>
              <StatCard
                fullWidth
                compact
                title="Month sales"
                value={monthRevenue}
                subtitle="Running total this month"
                icon={TrendingUp}
                variant="dark"
                onPress={() => navigation.navigate('TodayActivity', { tab: 'sales' })}
              />
            </View>
          </View>
        </DashboardPanel>

        <DashboardPanel>
          <SectionHeader title="Quick actions" subtitle="Shortcuts to daily tasks" />
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <QuickActionCard
                key={action.id}
                wide
                label={action.label}
                subtitle={action.subtitle}
                icon={action.icon}
                color={action.color}
                onPress={() => handleQuickAction(action.id)}
              />
            ))}
          </View>
        </DashboardPanel>

        <DashboardPanel style={styles.lastPanel}>
          <SectionHeader
            title="Today's tables"
            subtitle="Sales, purchases & reorder list"
            actionLabel="View all"
            onActionPress={() => navigation.navigate('TodayActivity')}
          />

          {loading && !recentTransactions.length ? (
            <Text variant="bodyMedium" style={styles.mutedCenter}>
              Loading live data…
            </Text>
          ) : null}

          {!loading && recentTransactions.length === 0 ? (
            <Card mode="outlined" style={styles.emptyCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.mutedCenter}>
                  No activity yet. Your transactions will show here once you start selling.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View>
              {recentTransactions.slice(0, 8).map((item, index, arr) => (
                <RecentTransactionRow
                  key={item.id}
                  item={item}
                  isLast={index === arr.length - 1}
                  onPress={() => onTransactionPress(item.type)}
                />
              ))}
            </View>
          )}
        </DashboardPanel>
      </SmoothScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricHalf: {
    width: '48%',
  },
  metricFull: {
    width: '100%',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  lastPanel: {
    marginBottom: 4,
  },
  mutedCenter: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 24,
  },
});
