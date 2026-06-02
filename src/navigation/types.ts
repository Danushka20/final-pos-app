import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { SaleReceiptPayload } from '@/types/sales';

export type TodayActivityTab = 'sales' | 'purchases' | 'reorder';

export type HomeStackParamList = {
  Dashboard: undefined;
  TodayActivity: { tab?: TodayActivityTab } | undefined;
  AlertsList: undefined;
  CustomersList: undefined;
  ExpensesList: undefined;
  ExpenseForm: { expenseId?: number };
};

export type AuthStackParamList = {
  Opening: undefined;
  BackendConfig: { fromSettings?: boolean } | undefined;
  Login: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type SalesStackParamList = {
  SalesPOS: undefined;
  SaleOrder: undefined;
  SaleReceipt: { receipt: SaleReceiptPayload };
};

export type ProductsStackParamList = {
  ProductsList: undefined;
  PurchasesList: undefined;
  PurchaseCreate: undefined;
  PurchaseOrder: undefined;
  PurchaseReceipt: { receipt: PurchaseReceiptPayload };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  BackendConfig: { fromSettings?: boolean } | undefined;
  CompanySettings: undefined;
  InventorySettings: undefined;
  OrderSettings: undefined;
  AlertSettings: undefined;
  NotificationsSettings: undefined;
  UserProfile: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Sales: NavigatorScreenParams<SalesStackParamList> | undefined;
  Products: NavigatorScreenParams<ProductsStackParamList> | undefined;
  Profile: NavigatorScreenParams<SettingsStackParamList> | undefined;
};
