import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PauseCircle, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { usePosSaleContext } from '@/context/PosSaleContext';
import { useSavedHoldPin } from '@/hooks/useSavedHoldPin';
import { isInvalidHoldPinError } from '@/services/storage/holdPinStorage';
import { salesService } from '@/services/api/salesService';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { navigateToPrinterSetup } from '@/navigation/navigationRef';
import type { SaleRecord } from '@/types/sales';
import type { SaleReceiptPayload } from '@/types/sales';
import { formatCurrency } from '@/utils/format';
import { appInputStyle, colors, shadows, TAB_BAR_SCROLL_PADDING, typography } from '@/theme';
import type { SalesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SalesStackParamList, 'HoldOrders'>;

const isPrinterSetupError = (msg: string): boolean =>
  /no printer|not configured|settings/i.test(msg);

const withHoldFlags = (receipt: SaleReceiptPayload): SaleReceiptPayload => {
  const pct =
    receipt.sale.sub_total > 0
      ? Math.round((receipt.sale.discount / receipt.sale.sub_total) * 10000) / 100
      : null;
  return {
    ...receipt,
    sale: {
      ...receipt.sale,
      order_status: 'hold',
      is_hold: true,
      payment_method: receipt.sale.payment_method ?? 'Hold',
      discount_percent:
        receipt.sale.discount_percent ??
        (receipt.sale.discount > 0 && pct ? pct : null),
      discount_type: receipt.sale.discount_type ?? 'amount',
    },
  };
};

export const HoldOrdersScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const pos = usePosSaleContext();
  const notifyRefresh = useDataRefreshNotify();
  const { currency, settings } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<SaleRecord[]>([]);
  const [orderSettings, setOrderSettings] = useState<Record<string, unknown>>({});
  const [pinModalOrder, setPinModalOrder] = useState<SaleRecord | null>(null);
  const [pinModalBulk, setPinModalBulk] = useState(false);
  const [holdPinDraft, setHoldPinDraft] = useState('');
  const { savedHoldPin, saveHoldPin, clearHoldPin } = useSavedHoldPin();

  const allowDeleteHold = useMemo(() => {
    const fromList = orderSettings.allow_deletion_of_hold_orders;
    const fromContext = (pos.context?.order_settings as Record<string, unknown> | undefined)
      ?.allow_deletion_of_hold_orders;
    const value = fromList ?? fromContext;
    return value !== false;
  }, [orderSettings, pos.context?.order_settings]);

  const requiresHoldPin = useMemo(() => {
    const fromList = orderSettings.requires_hold_pin;
    const fromContext = (pos.context?.order_settings as Record<string, unknown> | undefined)
      ?.requires_hold_pin;
    const value = fromList ?? fromContext;
    return value !== false;
  }, [orderSettings, pos.context?.order_settings]);

  const load = useCallback(async (pull = false) => {
    if (pull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const result = await salesService.getHoldOrders('all');
      setOrders(result.hold_orders ?? []);
      setOrderSettings(result.order_settings ?? {});
    } catch (e) {
      showError({
        title: 'Hold orders',
        message: e instanceof Error ? e.message : 'Failed to load hold orders',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    load(false);
  }, [load]);

  const promptPrinterSetup = (message: string) => {
    showConfirm({
      title: 'Printer not set up',
      message,
      confirmLabel: 'Open printer setup',
      cancelLabel: 'Cancel',
      onConfirm: () => navigateToPrinterSetup(),
    });
  };

  const handlePrint = async (order: SaleRecord) => {
    setPrintingId(order.id);
    try {
      const receipt = withHoldFlags(await salesService.getReceipt(order.id));
      if (!bluetoothPrintService.isSupported()) {
        promptPrinterSetup('Configure a receipt printer in Settings → Receipt printer.');
        return;
      }
      await bluetoothPrintService.printReceipt(receipt, currency, settings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Print failed';
      if (isPrinterSetupError(msg)) {
        promptPrinterSetup(msg);
      } else {
        showError({ title: 'Print', message: msg, variant: 'warning' });
      }
    } finally {
      setPrintingId(null);
    }
  };

  const handleComplete = async (order: SaleRecord) => {
    const ok = await pos.loadHoldOrder(order.id);
    if (ok) {
      navigation.navigate('SaleOrder');
    }
  };

  const runDelete = async (order: SaleRecord, holdPin?: string | null) => {
    setDeletingId(order.id);
    let reopenPinModal = false;
    try {
      await salesService.deleteHoldOrder(order.id, holdPin);
      if (holdPin?.trim()) {
        await saveHoldPin(holdPin);
      }
      if (pos.activeHoldId === order.id) {
        pos.clearHoldSession();
      }
      setOrders(prev => prev.filter(o => o.id !== order.id));
      notifyRefresh(['sales', 'dashboard', 'todayActivity', 'reports']);
      showError({
        title: 'Hold deleted',
        message: `Hold bill ${order.sales_id} was removed.`,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not delete hold order';
      if (isInvalidHoldPinError(message)) {
        await clearHoldPin();
        reopenPinModal = true;
        setPinModalBulk(false);
        setPinModalOrder(order);
        setHoldPinDraft('');
      }
      showError({
        title: 'Delete failed',
        message,
        variant: 'warning',
      });
    } finally {
      setDeletingId(null);
      if (!reopenPinModal) {
        setPinModalOrder(null);
        setPinModalBulk(false);
        setHoldPinDraft('');
      }
    }
  };

  const runDeleteAll = async (holdPin?: string | null) => {
    const snapshot = [...orders];
    if (snapshot.length === 0) {
      return;
    }
    setDeletingId(-1);
    const deletedIds: number[] = [];
    let lastError: string | null = null;
    let reopenPinModal = false;
    try {
      for (const order of snapshot) {
        try {
          await salesService.deleteHoldOrder(order.id, holdPin);
          if (pos.activeHoldId === order.id) {
            pos.clearHoldSession();
          }
          deletedIds.push(order.id);
        } catch (e) {
          lastError = e instanceof Error ? e.message : 'Could not delete hold order';
          break;
        }
      }
      if (deletedIds.length > 0 && holdPin?.trim()) {
        await saveHoldPin(holdPin);
      }
      if (deletedIds.length > 0) {
        setOrders(prev => prev.filter(o => !deletedIds.includes(o.id)));
        notifyRefresh(['sales', 'dashboard', 'todayActivity', 'reports']);
      }
      if (lastError && isInvalidHoldPinError(lastError)) {
        await clearHoldPin();
        reopenPinModal = true;
        setPinModalOrder(null);
        setPinModalBulk(true);
        setHoldPinDraft('');
      }
      if (deletedIds.length === snapshot.length) {
        showError({
          title: 'All holds deleted',
          message: `${deletedIds.length} hold bill${deletedIds.length === 1 ? '' : 's'} removed.`,
          variant: 'info',
          confirmLabel: 'OK',
        });
      } else if (deletedIds.length > 0) {
        showError({
          title: 'Partial delete',
          message: `${deletedIds.length} of ${snapshot.length} holds removed. ${lastError ?? ''}`.trim(),
          variant: 'warning',
        });
      } else {
        showError({
          title: 'Delete failed',
          message: lastError ?? 'Could not delete hold orders',
          variant: 'warning',
        });
      }
    } finally {
      setDeletingId(null);
      if (!reopenPinModal) {
        setPinModalOrder(null);
        setPinModalBulk(false);
        setHoldPinDraft('');
      }
    }
  };

  const guardDeleteAllowed = (): boolean => {
    if (!allowDeleteHold) {
      showError({
        title: 'Delete disabled',
        message: 'Hold order deletion is turned off in order settings.',
        variant: 'warning',
      });
      return false;
    }
    return true;
  };

  const proceedDelete = (order: SaleRecord) => {
    if (requiresHoldPin) {
      if (savedHoldPin) {
        runDelete(order, savedHoldPin);
        return;
      }
      setPinModalBulk(false);
      setPinModalOrder(order);
      setHoldPinDraft('');
      return;
    }
    runDelete(order);
  };

  const proceedDeleteAll = () => {
    if (requiresHoldPin) {
      if (savedHoldPin) {
        runDeleteAll(savedHoldPin);
        return;
      }
      setPinModalOrder(null);
      setPinModalBulk(true);
      setHoldPinDraft('');
      return;
    }
    runDeleteAll();
  };

  const handleDelete = (order: SaleRecord) => {
    if (!guardDeleteAllowed()) {
      return;
    }

    showConfirm({
      title: 'Delete hold order?',
      message: `Remove ${order.sales_id} permanently? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: () => proceedDelete(order),
    });
  };

  const handleDeleteAll = () => {
    if (!guardDeleteAllowed() || orders.length === 0) {
      return;
    }

    showConfirm({
      title: 'Delete all hold orders?',
      message: `Remove all ${orders.length} hold bill${orders.length === 1 ? '' : 's'}? This cannot be undone.`,
      confirmLabel: 'Delete all',
      cancelLabel: 'Cancel',
      onConfirm: () => proceedDeleteAll(),
    });
  };

  const confirmPinDelete = () => {
    if (!holdPinDraft.trim()) {
      showError({
        title: 'Hold PIN',
        message: 'Enter the hold order PIN to delete.',
        variant: 'warning',
      });
      return;
    }
    if (pinModalBulk) {
      runDeleteAll(holdPinDraft);
      return;
    }
    if (!pinModalOrder) {
      return;
    }
    runDelete(pinModalOrder, holdPinDraft);
  };

  const pinModalVisible = pinModalOrder != null || pinModalBulk;
  const pinModalText = pinModalBulk
    ? `Enter hold PIN once — saved on this device for future deletes.${orders.length > 1 ? ` Deleting ${orders.length} bills.` : ''}`
    : `Enter hold PIN once — saved on this device for future hold actions.`;

  const busy = printingId != null || deletingId != null;
  const bulkDeleting = deletingId === -1;

  return (
    <ScreenContainer>
      <AppHeader title="Hold orders" subtitle="All saved bills waiting for payment" showBack />

      {loading && orders.length === 0 ? <LoadingOverlay message="Loading hold orders…" /> : null}

      <SmoothScrollView
        style={styles.scroll}
        contentPaddingBottom={TAB_BAR_SCROLL_PADDING}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }>
        <View style={styles.content}>
          {orders.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listCount}>
                {orders.length} hold order{orders.length === 1 ? '' : 's'}
              </Text>
              <PrimaryButton
                label={bulkDeleting ? 'Deleting all…' : 'Delete all'}
                onPress={handleDeleteAll}
                loading={bulkDeleting}
                disabled={busy}
                variant="outline"
              />
            </View>
          ) : null}

          {orders.length === 0 && !loading ? (
            <View style={styles.empty}>
              <PauseCircle size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No hold orders</Text>
              <Text style={styles.emptyText}>
                Use Hold on the order screen to save a bill without payment.
              </Text>
            </View>
          ) : null}

          {orders.map(order => (
            <View key={order.id} style={[styles.card, shadows.card]}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleCol}>
                  <Text style={styles.billId}>{order.sales_id}</Text>
                  <Text style={styles.meta}>
                    {[order.customer_name, order.location].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(order)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.deleteIconBtn,
                    pressed && styles.deleteIconBtnPressed,
                    busy && styles.deleteIconBtnDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete hold ${order.sales_id}`}>
                  <Trash2
                    size={20}
                    color={deletingId === order.id ? colors.textMuted : colors.error}
                  />
                </Pressable>
              </View>
              <Text style={styles.amount}>{formatCurrency(order.net_amount, currency)}</Text>
              {order.discount > 0 ? (
                <Text style={styles.discount}>
                  Discount: {formatCurrency(order.discount, currency)}
                </Text>
              ) : null}
              <Text style={styles.items}>
                {(order.items ?? []).length} item{(order.items ?? []).length === 1 ? '' : 's'}
              </Text>
              <View style={styles.actions}>
                <PrimaryButton
                  label={printingId === order.id ? 'Printing…' : 'Print hold slip'}
                  onPress={() => handlePrint(order)}
                  loading={printingId === order.id}
                  disabled={busy}
                  variant="outline"
                />
                <PrimaryButton
                  label="Complete & pay"
                  onPress={() => handleComplete(order)}
                  disabled={busy}
                />
                <PrimaryButton
                  label={deletingId === order.id ? 'Deleting…' : 'Delete hold'}
                  onPress={() => handleDelete(order)}
                  loading={deletingId === order.id}
                  disabled={busy}
                  variant="outline"
                />
              </View>
            </View>
          ))}
        </View>
      </SmoothScrollView>

      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (deletingId == null) {
            setPinModalOrder(null);
            setPinModalBulk(false);
            setHoldPinDraft('');
          }
        }}>
        <View style={styles.pinBackdrop}>
          <View style={styles.pinCard}>
            <Text style={styles.pinTitle}>Enter hold PIN</Text>
            <Text style={styles.pinText}>{pinModalText}</Text>
            <TextInput
              value={holdPinDraft}
              onChangeText={setHoldPinDraft}
              keyboardType="number-pad"
              secureTextEntry
              style={appInputStyle}
              placeholder="Hold PIN"
              placeholderTextColor={colors.textMuted}
              maxLength={20}
            />
            <PrimaryButton
              label={deletingId != null ? 'Deleting…' : 'Confirm delete'}
              onPress={confirmPinDelete}
              loading={deletingId != null}
              disabled={deletingId != null}
            />
            <PrimaryButton
              label="Cancel"
              variant="outline"
              onPress={() => {
                setPinModalOrder(null);
                setPinModalBulk(false);
                setHoldPinDraft('');
              }}
              disabled={deletingId != null}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  listHeader: {
    gap: 8,
    marginBottom: 4,
  },
  listCount: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  deleteIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteIconBtnPressed: {
    opacity: 0.85,
  },
  deleteIconBtnDisabled: {
    opacity: 0.45,
  },
  billId: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.h3,
    color: colors.primary,
    marginTop: 4,
  },
  discount: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  items: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  actions: {
    gap: 4,
    marginTop: 4,
  },
  pinBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  pinCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  pinTitle: {
    ...typography.h3,
    color: colors.text,
  },
  pinText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
