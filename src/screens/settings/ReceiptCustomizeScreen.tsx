import React, { useCallback, useState } from 'react';
import { Image, Pressable, Switch, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { AuthInput } from '@/components/inputs/AuthInput';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import { bluetoothPrintService } from '@/services/bluetooth/bluetoothPrintService';
import { receiptLogoStorage } from '@/services/storage/receiptLogoStorage';
import { receiptPrintStorage } from '@/services/storage/receiptPrintStorage';
import { RECEIPT_SOFTWARE_PROVIDER } from '@/constants/receiptBranding';
import { pickReceiptLogoFromGallery } from '@/utils/pickReceiptLogo';
import { resolveReceiptLogo } from '@/utils/receiptLogoResolver';
import {
  DEFAULT_RECEIPT_PRINT_CUSTOMIZATION,
  type ReceiptPaperWidth,
  type ReceiptPrintCustomization,
  type ReceiptTextAlign,
  type ReceiptTitleFont,
} from '@/types/receiptPrint';
import { mergeReceiptPrintSettings } from '@/utils/receiptPrintCustomization';
import { createReceiptLayout, previewLine } from '@/utils/receiptEscPosLayout';
import { colors } from '@/theme';

const ChipRow: React.FC<{
  label: string;
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}> = ({ label, options, value, onChange }) => (
  <VStack mb="$4">
    <Text fontSize="$xs" fontWeight="$semibold" color="$textLight400" mb="$2">
      {label}
    </Text>
    <HStack gap="$2" flexWrap="wrap">
      {options.map(opt => (
        <Pressable
          key={opt.id}
          onPress={() => onChange(opt.id)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: value === opt.id ? colors.primary : colors.border,
            backgroundColor: value === opt.id ? colors.primarySoft : colors.white,
          }}>
          <Text
            fontSize="$sm"
            fontWeight="$semibold"
            color={value === opt.id ? colors.primary : colors.textSecondary}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </HStack>
  </VStack>
);

const ToggleRow: React.FC<{
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, subtitle, value, onChange }) => (
  <HStack
    alignItems="center"
    justifyContent="space-between"
    py="$3"
    borderBottomWidth={1}
    borderBottomColor={colors.borderLight}>
    <VStack flex={1} pr="$3">
      <Text fontSize="$sm" fontWeight="$semibold" color="$textLight0">
        {label}
      </Text>
      {subtitle ? (
        <Text fontSize="$xs" color="$textLight400" mt="$0.5">
          {subtitle}
        </Text>
      ) : null}
    </VStack>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primaryMuted }}
      thumbColor={value ? colors.primary : colors.white}
    />
  </HStack>
);

export const ReceiptCustomizeScreen: React.FC = () => {
  const { settings } = usePosSettings();
  const { showError } = useErrorDialog();
  const [form, setForm] = useState<ReceiptPrintCustomization>(
    DEFAULT_RECEIPT_PRINT_CUSTOMIZATION,
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreviewUri, setLogoPreviewUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    const saved = await receiptPrintStorage.get();
    setForm(mergeReceiptPrintSettings(settings, saved));
    const logo = await resolveReceiptLogo(null, settings);
    setLogoPreviewUri(logo?.displayUri ?? null);
  }, [settings]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const patch = (partial: Partial<ReceiptPrintCustomization>) => {
    setForm(prev => ({ ...prev, ...partial }));
  };

  const companyName =
    settings?.printHeader?.company_name ?? settings?.company?.name ?? 'Your Store';
  const serverLogoUrl =
    settings?.printHeader?.logo_url ?? settings?.company?.logo_url ?? null;
  const layout = createReceiptLayout(form);
  const previewTitle = previewLine(layout, companyName, form.headerAlign);
  const previewFooter = previewLine(layout, form.footerMessage, form.headerAlign);

  const handleSave = async () => {
    setSaving(true);
    try {
      await receiptPrintStorage.save(form);
      showError({
        title: 'Saved',
        message: 'Receipt print layout saved on this device.',
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Save failed',
        message: e instanceof Error ? e.message : 'Could not save',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await receiptPrintStorage.reset();
    await load();
  };

  const handleUploadLogo = async () => {
    setUploadingLogo(true);
    try {
      const uri = await pickReceiptLogoFromGallery();
      if (!uri) {
        return;
      }
      await receiptLogoStorage.saveFromUri(uri);
      await load();
      showError({
        title: 'Logo saved',
        message: 'Receipt logo stored on this device. It will print on receipts.',
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Upload failed',
        message: e instanceof Error ? e.message : 'Could not save logo',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    await receiptLogoStorage.clear();
    await load();
    showError({
      title: 'Logo removed',
      message: serverLogoUrl
        ? 'Using server company logo again if available.'
        : 'No logo will show until you upload one.',
      variant: 'info',
      confirmLabel: 'OK',
    });
  };

  const handleTestPrint = async () => {
    if (!(await bluetoothPrintService.isConfigured())) {
      showError({
        title: 'Printer not set up',
        message: 'Configure your printer first under Receipt printer.',
        variant: 'warning',
      });
      return;
    }
    setTesting(true);
    try {
      await receiptPrintStorage.save(form);
      await bluetoothPrintService.printTestReceipt('short', {
        storeName: companyName,
        settings,
      });
    } catch (e) {
      showError({
        title: 'Test print failed',
        message: e instanceof Error ? e.message : 'Print failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="Receipt layout" subtitle="Bluetooth print customization" showBack />
      <SmoothScrollView contentPaddingBottom={40}>
        <VStack px="$5" py="$4" space="md">
          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4">
            <Text fontSize="$sm" fontWeight="$bold" color="$textLight0" mb="$3">
              Paper preview
            </Text>
            <Box bg="#fff" borderWidth={1} borderColor={colors.border} borderRadius="$lg" p="$4">
              {form.showLogo && logoPreviewUri ? (
                <Image
                  source={{ uri: logoPreviewUri }}
                  style={styles.previewLogo}
                  resizeMode="contain"
                />
              ) : form.showLogo ? (
                <Text style={styles.previewMono} textAlign="center">
                  [Logo]
                </Text>
              ) : null}
              <Text style={styles.previewMono}>{previewTitle}</Text>
              <Text style={styles.previewMono}>----------------</Text>
              <Text style={styles.previewMono}>SALES RECEIPT</Text>
              <Text style={styles.previewMono}>Item ........ 100.00</Text>
              <Text style={styles.previewMono}>----------------</Text>
              <Text style={styles.previewMono}>{previewFooter}</Text>
              <Text style={styles.previewMono}>{RECEIPT_SOFTWARE_PROVIDER}</Text>
            </Box>
            <Text fontSize="$xs" color="$textLight400" mt="$2">
              Printed output uses ESC/POS center/bold tags — fixes left-aligned headers on thermal
              paper.
            </Text>
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4">
            <Text fontSize="$sm" fontWeight="$bold" color="$textLight0" mb="$3">
              Receipt logo (this device)
            </Text>
            {logoPreviewUri ? (
              <Image
                source={{ uri: logoPreviewUri }}
                style={styles.uploadPreview}
                resizeMode="contain"
              />
            ) : (
              <Text fontSize="$xs" color="$textLight400" mb="$3">
                No logo on this phone. Upload one for printed receipts, or use the server company
                logo if configured.
              </Text>
            )}
            <VStack space="sm" mb="$2">
              <PrimaryButton
                label={uploadingLogo ? 'Saving…' : 'Upload logo from gallery'}
                variant="outline"
                onPress={handleUploadLogo}
                loading={uploadingLogo}
              />
              {logoPreviewUri ? (
                <PrimaryButton
                  label="Remove uploaded logo"
                  variant="outline"
                  onPress={handleRemoveLogo}
                  disabled={uploadingLogo}
                />
              ) : null}
            </VStack>
            {serverLogoUrl && !logoPreviewUri ? (
              <Text fontSize="$xs" color="$textLight400">
                Server logo available as fallback when you enable Company logo below.
              </Text>
            ) : null}
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4">
            <ChipRow
              label="Paper width"
              value={form.paperWidth}
              onChange={id => patch({ paperWidth: id as ReceiptPaperWidth })}
              options={[
                { id: '58mm', label: '58mm (32 chars)' },
                { id: '80mm', label: '80mm (48 chars)' },
              ]}
            />
            <ChipRow
              label="Header alignment (store name, footer)"
              value={form.headerAlign}
              onChange={id => patch({ headerAlign: id as ReceiptTextAlign })}
              options={[
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Right' },
              ]}
            />
            <ChipRow
              label="Body alignment (items, totals)"
              value={form.bodyAlign}
              onChange={id => patch({ bodyAlign: id as ReceiptTextAlign })}
              options={[
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Right' },
              ]}
            />
            <ChipRow
              label="Store name font"
              value={form.titleFont}
              onChange={id => patch({ titleFont: id as ReceiptTitleFont })}
              options={[
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Large' },
                { id: 'bold', label: 'Bold' },
              ]}
            />
            <AuthInput
              label="Footer message"
              value={form.footerMessage}
              onChangeText={text => patch({ footerMessage: text })}
              placeholder="Thank you for your business!"
            />
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            px="$4"
            pb="$2">
            <Text fontSize="$sm" fontWeight="$bold" color="$textLight0" py="$3">
              Show on printed receipt
            </Text>
            <ToggleRow
              label="Company logo"
              subtitle={
                logoPreviewUri
                  ? 'Uses logo uploaded on this device'
                  : serverLogoUrl
                    ? 'Uses server company logo (needs internet to print)'
                    : 'Upload a logo above or set logo on server'
              }
              value={form.showLogo}
              onChange={v => patch({ showLogo: v })}
            />
            <ToggleRow
              label="Phone number"
              value={form.showPhone}
              onChange={v => patch({ showPhone: v })}
            />
            <ToggleRow
              label="Email"
              value={form.showEmail}
              onChange={v => patch({ showEmail: v })}
            />
            <ToggleRow
              label="Tax ID"
              value={form.showTaxId}
              onChange={v => patch({ showTaxId: v })}
            />
            <ToggleRow
              label="Registration number"
              value={form.showRegistration}
              onChange={v => patch({ showRegistration: v })}
            />
          </Box>

          <PrimaryButton label="Save layout" onPress={handleSave} loading={saving} />
          {bluetoothPrintService.isSupported() ? (
            <PrimaryButton
              label={testing ? 'Printing…' : 'Test print with this layout'}
              variant="outline"
              onPress={handleTestPrint}
              loading={testing}
              disabled={saving}
            />
          ) : null}
          <PrimaryButton label="Reset to defaults" variant="outline" onPress={handleReset} />
        </VStack>
      </SmoothScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  previewLogo: {
    width: 100,
    height: 40,
    alignSelf: 'center',
    marginBottom: 6,
  },
  uploadPreview: {
    width: '100%',
    height: 72,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
  },
  previewMono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
