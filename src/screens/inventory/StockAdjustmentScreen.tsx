import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { Layers } from 'lucide-react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePosSettings } from '@/context/PosSettingsContext';
import { inventoryService } from '@/services/api/inventoryService';
import type { ProductsStackParamList } from '@/navigation/types';
import type { ItemRecord, ItemInventoryBreakdown } from '@/types/inventory';
import { formatCurrency } from '@/utils/format';
import {
  colors,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
} from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'StockAdjustment'>;
type Route = RouteProp<ProductsStackParamList, 'StockAdjustment'>;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const StockAdjustmentScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { currency } = usePosSettings();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [breakdown, setBreakdown] = useState<ItemInventoryBreakdown | null>(null);
  const [newQty, setNewQty] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const loaded = await inventoryService.getItem(params.itemId);
        setItem(loaded);
        if (loaded.has_batches || (loaded.batch_count ?? 0) > 0) {
          try {
            const stockBreakdown = await inventoryService.getInventoryBreakdown(params.itemId);
            setBreakdown(stockBreakdown);
          } catch {
            setBreakdown(null);
          }
        } else {
          setBreakdown(null);
        }
        if (!silent) {
          setNewQty(String(loaded.qty ?? 0));
        }
      } catch (e) {
        if (!silent) {
          showErrorFromUnknown(e, 'Stock adjustment');
          navigation.goBack();
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [navigation, params.itemId, showErrorFromUnknown],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useAutoRefresh({
    onRefresh: silent => load(silent),
    scopes: ['inventory', 'sales', 'purchases'],
  });

  const handleSave = async () => {
    const parsed = parseFloat(newQty);
    if (Number.isNaN(parsed) || parsed < 0) {
      showErrorFromUnknown(new Error('Enter a valid quantity'), 'Stock adjustment');
      return;
    }
    setSubmitting(true);
    try {
      await inventoryService.adjustStock(params.itemId, {
        new_qty: parsed,
        notes: notes.trim() || undefined,
      });
      notifyRefresh(['inventory', 'dashboard', 'reports']);
      showConfirm({
        title: 'Stock adjusted',
        message: 'Quantity has been updated on the server.',
        confirmLabel: 'OK',
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      showErrorFromUnknown(e, 'Stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !item) {
    return (
      <ScreenContainer>
        <AppHeader title="Stock adjustment" showBack />
        <LoadingOverlay message="Loading item…" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader title="Stock adjustment" subtitle={item.description} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SmoothScrollView contentContainerStyle={styles.scroll}>
            <VStack px="$5" pb="$8">
              <Box
                bg={colors.white}
                borderRadius="$2xl"
                p="$4"
                borderWidth={1}
                borderColor={colors.border}
                mb="$2">
                <Text fontWeight="$bold" color={colors.text}>
                  {item.description}
                </Text>
                <Text size="sm" color={colors.textMuted} mt="$1">
                  {item.item_number ? `#${item.item_number}` : `ID ${item.id}`}
                  {item.location ? ` · ${item.location}` : ''}
                </Text>
                <Text size="sm" color={colors.textSecondary} mt="$2">
                  Current qty: {item.qty ?? 0} {item.uom ?? ''}
                </Text>
                {breakdown ? (
                  <Text size="sm" color={colors.textSecondary}>
                    Unbatched {breakdown.totals.total_unbatched_qty} · Batch{' '}
                    {breakdown.totals.total_batch_qty} · {breakdown.totals.batch_count} batch
                    {breakdown.totals.batch_count === 1 ? '' : 'es'}
                  </Text>
                ) : null}
                <Text size="sm" color={colors.textSecondary}>
                  Price: {formatCurrency(item.selling_price, currency)}
                </Text>
              </Box>

              {breakdown ? (
                <Pressable
                  onPress={() => navigation.navigate('ItemBatches', { itemId: params.itemId })}
                  mb="$3"
                  borderRadius="$xl"
                  borderWidth={1}
                  borderColor={colors.primaryMuted}
                  bg={colors.primarySoft}
                  px="$4"
                  py="$3"
                  flexDirection="row"
                  alignItems="center"
                  gap="$2">
                  <Layers size={18} color={colors.primary} />
                  <VStack flex={1}>
                    <Text fontWeight="$bold" color={colors.primaryDeep}>
                      Manage batches
                    </Text>
                    <Text size="xs" color={colors.textSecondary}>
                      Adjustment here updates total stock; use batches for batch-level qty
                    </Text>
                  </VStack>
                </Pressable>
              ) : null}

              <Label>New quantity on hand</Label>
              <TextInput
                value={newQty}
                onChangeText={setNewQty}
                keyboardType="decimal-pad"
                style={appInputStyle}
                placeholder="0"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Label>Notes (optional)</Label>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[appInputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="Reason for adjustment"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Box mt="$6">
                <PrimaryButton
                  label={submitting ? 'Saving…' : 'Save adjustment'}
                  onPress={handleSave}
                  loading={submitting}
                />
              </Box>
            </VStack>
          </SmoothScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
});
