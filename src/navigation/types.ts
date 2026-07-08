import type { NavigatorScreenParams } from '@react-navigation/native';
import type { PurchaseReceiptPayload } from '@/types/inventory';
import type { ItemSelectAction } from '@/types/inventory';
import type { SaleReceiptPayload } from '@/types/sales';
import type { SystemReportType, ReportCategoryId } from '@/types/reports';

export type TodayActivityTab = 'sales' | 'purchases' | 'reorder';

export type HomeStackParamList = {
  Dashboard: undefined;
  TodayActivity: { tab?: TodayActivityTab } | undefined;
  AlertsList: undefined;
  CustomersList: undefined;
  CustomerForm: { customerId?: number; selectOnSave?: boolean };
  CustomerReceivePayment: { customerId: number };
  ExpensesList: undefined;
  ExpenseForm: { expenseId?: number };
};

export type ReportsStackParamList = {
  ReportsList: undefined;
  ReportCategory: { categoryId: ReportCategoryId };
  ReportView: { type: SystemReportType };
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
  HoldOrders: undefined;
  CustomerForm: { customerId?: number; selectOnSave?: boolean };
};

export type ProductsStackParamList = {
  ProductsList: undefined;
  InventoryActivity: undefined;
  ItemForm: { itemId?: number };
  ItemSelect: { action: ItemSelectAction };
  StockAdjustment: { itemId: number };
  ItemHistory: { itemId: number };
  ItemBatches: { itemId: number };
  AddLocation: undefined;
  TogTransfer: undefined;
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
  PrinterSetup: undefined;
  ReceiptCustomize: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Sales: NavigatorScreenParams<SalesStackParamList> | undefined;
  Products: NavigatorScreenParams<ProductsStackParamList> | undefined;
  Reports: NavigatorScreenParams<ReportsStackParamList> | undefined;
  Profile: NavigatorScreenParams<SettingsStackParamList> | undefined;
};
