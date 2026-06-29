import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PurchaseCreateProvider } from '@/context/PurchaseCreateContext';
import { ProductsScreen } from '@/screens/products/ProductsScreen';
import { PurchasesScreen } from '@/screens/products/PurchasesScreen';
import { PurchaseCreateScreen } from '@/screens/products/PurchaseCreateScreen';
import { PurchaseOrderScreen } from '@/screens/products/PurchaseOrderScreen';
import { PurchaseReceiptScreen } from '@/screens/products/PurchaseReceiptScreen';
import { InventoryActivityScreen } from '@/screens/inventory/InventoryActivityScreen';
import { ItemFormScreen } from '@/screens/inventory/ItemFormScreen';
import { ItemSelectScreen } from '@/screens/inventory/ItemSelectScreen';
import { StockAdjustmentScreen } from '@/screens/inventory/StockAdjustmentScreen';
import { ItemBatchesScreen } from '@/screens/inventory/ItemBatchesScreen';
import { ItemHistoryScreen } from '@/screens/inventory/ItemHistoryScreen';
import { AddLocationScreen } from '@/screens/inventory/AddLocationScreen';
import { TogTransferScreen } from '@/screens/inventory/TogTransferScreen';
import type { ProductsStackParamList } from './types';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export const ProductsStackNavigator: React.FC = () => (
  <PurchaseCreateProvider>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="InventoryActivity" component={InventoryActivityScreen} />
      <Stack.Screen name="ItemForm" component={ItemFormScreen} />
      <Stack.Screen name="ItemSelect" component={ItemSelectScreen} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
      <Stack.Screen name="ItemHistory" component={ItemHistoryScreen} />
      <Stack.Screen name="ItemBatches" component={ItemBatchesScreen} />
      <Stack.Screen name="AddLocation" component={AddLocationScreen} />
      <Stack.Screen name="TogTransfer" component={TogTransferScreen} />
      <Stack.Screen name="PurchasesList" component={PurchasesScreen} />
      <Stack.Screen name="PurchaseCreate" component={PurchaseCreateScreen} />
      <Stack.Screen name="PurchaseOrder" component={PurchaseOrderScreen} />
      <Stack.Screen name="PurchaseReceipt" component={PurchaseReceiptScreen} />
    </Stack.Navigator>
  </PurchaseCreateProvider>
);
