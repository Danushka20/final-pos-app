import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ScrollView } from 'react-native-gesture-handler';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { FilterChips } from '@/components/common/FilterChips';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { useOptionalPosSaleContext } from '@/context/PosSaleContext';
import { customerService } from '@/services/api/customerService';
import { suggestNextCustomerCode } from '@/utils/customerCode';
import { colors, typography, appInputStyle, appInputPlaceholderColor } from '@/theme';
import type { HomeStackParamList, SalesStackParamList } from '@/navigation/types';
import type { CustomerPayload } from '@/types/customers';

type CustomerFormParams = HomeStackParamList['CustomerForm'];
type Nav = NativeStackNavigationProp<
  HomeStackParamList & SalesStackParamList,
  'CustomerForm'
>;
type Route = RouteProp<HomeStackParamList & SalesStackParamList, 'CustomerForm'>;

const KEYBOARD_SCROLL_PADDING = 320;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const CustomerFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const pos = useOptionalPosSaleContext();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();
  const scrollRef = useRef<ScrollView>(null);
  const customerId = route.params?.customerId != null ? Number(route.params.customerId) : undefined;
  const selectOnSave = route.params?.selectOnSave === true;
  const isEdit = customerId != null && !Number.isNaN(customerId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Main Location');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [locations, setLocations] = useState<string[]>(['Main Location']);

  const scrollToFocusedField = useCallback(() => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'android' ? 120 : 60);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const list = await customerService.list();
        if (cancelled) return;

        setLocations(
          list.filters.locations.length ? list.filters.locations : ['Main Location'],
        );

        if (isEdit && customerId) {
          const customer = await customerService.get(customerId);
          if (cancelled) return;

          setCustomerName(customer.customer_name);
          setCustomerCode(customer.customer_code ?? '');
          setContactNo(customer.contact_no ?? '');
          setEmail(customer.email ?? '');
          setLocation(customer.location ?? 'Main Location');
          setAddress(customer.address ?? customer.address_line1 ?? '');
          setTaxId(customer.tax_id ?? customer.nic ?? '');
        } else {
          setCustomerCode(suggestNextCustomerCode(list.customers));

          const loc =
            list.filters.locations.find(l => l === 'Main Location') ??
            list.filters.locations[0] ??
            'Main Location';
          setLocation(loc);
        }
      } catch (e) {
        if (!cancelled) {
          showErrorFromUnknown(e, isEdit ? 'Modify customer' : 'Add customer');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, customerId, showErrorFromUnknown]);

  const buildPayload = (): CustomerPayload => {
    const name = customerName.trim();
    return {
      first_name: name,
      customer_name: name,
      contact_no: contactNo.trim(),
      email: email.trim() || null,
      location,
      address_line1: address.trim() || null,
      nic: taxId.trim() || null,
      ...(isEdit
        ? { customer_code: customerCode.trim() || undefined }
        : customerCode.trim()
          ? { customer_code: customerCode.trim() }
          : {}),
    };
  };

  const finishAfterSave = (savedName: string) => {
    if (selectOnSave) {
      navigation.goBack();
      return;
    }

    showConfirm({
      title: isEdit ? 'Customer updated' : 'Customer added',
      message: `${savedName} has been saved to the server.`,
      confirmLabel: 'OK',
      onConfirm: () => navigation.goBack(),
    });
  };

  const handleDelete = () => {
    if (!isEdit || !customerId) {
      return;
    }

    showConfirm({
      title: 'Delete customer?',
      message: `Remove ${customerName.trim() || 'this customer'}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await customerService.remove(customerId);
          notifyRefresh(['customers', 'sales', 'dashboard']);
          if (pos) {
            await pos.loadCustomers();
            if (pos.customer?.id === customerId) {
              pos.selectCustomer({ id: 0, customer_name: 'Walk-in Customer' });
            }
          }
          navigation.goBack();
        } catch (e) {
          showErrorFromUnknown(e, 'Delete customer');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      showErrorFromUnknown(new Error('Customer name is required'), 'Customer');
      return;
    }

    if (!contactNo.trim()) {
      showErrorFromUnknown(new Error('Phone number is required'), 'Customer');
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      let saved = null as Awaited<ReturnType<typeof customerService.create>> | null;

      if (isEdit && customerId) {
        saved = await customerService.update(customerId, payload);
      } else {
        saved = await customerService.create(payload);
      }

      notifyRefresh(['customers', 'sales', 'dashboard']);

      if (selectOnSave && saved && pos) {
        await pos.loadCustomers();
        pos.selectCustomer(saved);
        navigation.goBack();
        return;
      }

      finishAfterSave(saved?.customer_name ?? customerName.trim());
    } catch (e) {
      showErrorFromUnknown(e, isEdit ? 'Modify customer' : 'Add customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <AppHeader title={isEdit ? 'Modify customer' : 'New customer'} showBack />
        <LoadingOverlay message="Loading…" />
      </ScreenContainer>
    );
  }

  const bottomPad = Math.max(0, KEYBOARD_SCROLL_PADDING);

  return (
    <ScreenContainer>
      <AppHeader title={isEdit ? 'Modify customer' : 'New customer'} showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SmoothScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
            <VStack px="$5" pb="$4">
              <Label>Customer code</Label>
              <TextInput
                value={customerCode}
                onChangeText={setCustomerCode}
                style={appInputStyle}
                placeholder="Auto-assigned on save if empty"
                placeholderTextColor={appInputPlaceholderColor}
                editable={!submitting && !isEdit}
                onFocus={scrollToFocusedField}
              />

              <Label>Customer name *</Label>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                style={appInputStyle}
                placeholder="Full name or business name"
                placeholderTextColor={appInputPlaceholderColor}
                editable={!submitting}
                onFocus={scrollToFocusedField}
              />

              <Label>Contact number *</Label>
              <TextInput
                value={contactNo}
                onChangeText={setContactNo}
                style={appInputStyle}
                placeholder="Phone number"
                placeholderTextColor={appInputPlaceholderColor}
                keyboardType="phone-pad"
                editable={!submitting}
                onFocus={scrollToFocusedField}
              />

              <Label>Email</Label>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={appInputStyle}
                placeholder="email@example.com"
                placeholderTextColor={appInputPlaceholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                onFocus={scrollToFocusedField}
              />

              <Label>Location</Label>
              <FilterChips
                options={locations}
                selected={location}
                onSelect={setLocation}
              />

              <Label>Address</Label>
              <TextInput
                value={address}
                onChangeText={setAddress}
                style={[appInputStyle, styles.multiline]}
                placeholder="Street address, city, country"
                placeholderTextColor={appInputPlaceholderColor}
                multiline
                editable={!submitting}
                onFocus={scrollToFocusedField}
              />

              <Label>NIC / Tax ID</Label>
              <TextInput
                value={taxId}
                onChangeText={setTaxId}
                style={appInputStyle}
                placeholder="Optional identification number"
                placeholderTextColor={appInputPlaceholderColor}
                editable={!submitting}
                onFocus={scrollToFocusedField}
              />

              <Box mt="$6" gap="$3">
                <PrimaryButton
                  label={
                    submitting
                      ? 'Saving…'
                      : selectOnSave && !isEdit
                        ? 'Add & select customer'
                        : isEdit
                          ? 'Update customer'
                          : 'Add customer'
                  }
                  onPress={handleSave}
                  loading={submitting}
                  disabled={deleting}
                />
                {isEdit && !selectOnSave ? (
                  <PrimaryButton
                    label={deleting ? 'Deleting…' : 'Delete customer'}
                    onPress={handleDelete}
                    loading={deleting}
                    disabled={submitting}
                    variant="outline"
                  />
                ) : null}
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
    flexGrow: 1,
    paddingTop: 4,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
