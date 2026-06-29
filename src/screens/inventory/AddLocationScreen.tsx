import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { useDataRefreshNotify } from '@/context/DataRefreshContext';
import { branchService } from '@/services/api/branchService';
import type { ProductsStackParamList } from '@/navigation/types';
import {
  colors,
  typography,
  appInputStyle,
  appInputPlaceholderColor,
} from '@/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'AddLocation'>;

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 6, marginTop: 12 }]}>
    {children}
  </Text>
);

export const AddLocationScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { showErrorFromUnknown, showConfirm } = useErrorDialog();
  const notifyRefresh = useDataRefreshNotify();

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      showErrorFromUnknown(new Error('Location name is required'), 'Add location');
      return;
    }
    setSubmitting(true);
    try {
      await branchService.create({
        name: name.trim(),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        phone: phone.trim() || undefined,
        is_active: true,
      });
      notifyRefresh(['inventory']);
      showConfirm({
        title: 'Location added',
        message: 'The new branch/location is available for inventory and sales.',
        confirmLabel: 'OK',
        onConfirm: () => navigation.goBack(),
      });
    } catch (e) {
      showErrorFromUnknown(e, 'Add location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="Add location" subtitle="New branch or storage area" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SmoothScrollView contentContainerStyle={styles.scroll}>
            <VStack px="$5" pb="$8">
              <Label>Location name *</Label>
              <TextInput
                value={name}
                onChangeText={setName}
                style={appInputStyle}
                placeholder="e.g. Main Location, Warehouse B"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Label>Address</Label>
              <TextInput
                value={address}
                onChangeText={setAddress}
                style={appInputStyle}
                placeholder="Street address"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Label>City</Label>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={appInputStyle}
                placeholder="City"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Label>Phone</Label>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={appInputStyle}
                placeholder="Contact number"
                placeholderTextColor={appInputPlaceholderColor}
              />

              <Box mt="$6">
                <PrimaryButton
                  label={submitting ? 'Saving…' : 'Add location'}
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
