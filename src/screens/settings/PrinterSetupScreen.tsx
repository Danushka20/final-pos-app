import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Check, Printer } from 'lucide-react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { AppHeader } from '@/components/common/AppHeader';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { SelectionModal } from '@/components/common/SelectionModal';
import { AuthInput } from '@/components/inputs/AuthInput';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { usePosSettings } from '@/context/PosSettingsContext';
import {
  bluetoothPrintService,
  formatNetworkAddress,
  type PrinterConnectionType,
  type SavedPrinter,
} from '@/services/bluetooth/bluetoothPrintService';
import {
  guessPrinterProfile,
  PRINTER_PROFILES,
  type PrinterProfileId,
} from '@/types/printerProfile';
import { colors } from '@/theme';

type SessionPrinter = SavedPrinter;

const StepBadge: React.FC<{ step: number; label: string; done?: boolean }> = ({
  step,
  label,
  done,
}) => (
  <HStack alignItems="center" gap="$2" mb="$2">
    <Box
      w={28}
      h={28}
      borderRadius="$full"
      bg={done ? colors.success : colors.primarySoft}
      alignItems="center"
      justifyContent="center">
      {done ? (
        <Check size={16} color="#fff" />
      ) : (
        <Text fontSize="$sm" fontWeight="$bold" color={colors.primary}>
          {step}
        </Text>
      )}
    </Box>
    <Text fontSize="$sm" fontWeight="$semibold" color="$textLight0">
      {label}
    </Text>
  </HStack>
);

const TypeChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}> = ({ label, active, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={{
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: active ? colors.primary : colors.border,
      backgroundColor: active ? colors.primarySoft : colors.white,
      opacity: disabled ? 0.5 : 1,
    }}>
    <Text
      textAlign="center"
      fontSize="$sm"
      fontWeight="$semibold"
      color={active ? colors.primary : colors.textSecondary}>
      {label}
    </Text>
  </Pressable>
);

export const PrinterSetupScreen: React.FC = () => {
  const { settings } = usePosSettings();
  const { showError, showConfirm } = useErrorDialog();

  const [savedPrinter, setSavedPrinter] = useState<SavedPrinter | null>(null);
  const [session, setSession] = useState<SessionPrinter | null>(null);
  const [printerProfile, setPrinterProfile] = useState<PrinterProfileId>('mini_portable');
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>('bluetooth');
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [devices, setDevices] = useState<Array<{ name: string; address: string }>>([]);
  const [manualMac, setManualMac] = useState('');
  const [manualName, setManualName] = useState('');
  const [netHost, setNetHost] = useState('');
  const [netPort, setNetPort] = useState('9100');
  const [netName, setNetName] = useState('');
  const [shortTestOk, setShortTestOk] = useState(false);
  const [longTestOk, setLongTestOk] = useState(false);
  const [testingShort, setTestingShort] = useState(false);
  const [testingLong, setTestingLong] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const storeName = settings?.company?.name ?? settings?.printHeader?.company_name;
  const paperSize =
    settings?.hardware &&
    (settings.hardware as { printing_paper_size?: string }).printing_paper_size
      ? String((settings.hardware as { printing_paper_size?: string }).printing_paper_size)
      : null;

  const loadSaved = useCallback(async () => {
    const saved = await bluetoothPrintService.getSavedPrinter();
    setSavedPrinter(saved);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved]),
  );

  const resetTests = () => {
    setShortTestOk(false);
    setLongTestOk(false);
  };

  const applySession = (printer: SessionPrinter) => {
    setSession(printer);
    setPrinterProfile(printer.profile);
    resetTests();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  };

  const handleScanBluetooth = async () => {
    setScanning(true);
    try {
      const list = await bluetoothPrintService.scanBluetoothPrinters();
      setDevices(list.map(d => ({ name: d.name, address: d.address })));
      setPickerVisible(true);
      if (list.length === 0) {
        showError({
          title: 'No paired printers',
          message:
            'Pair your portable printer in Android Settings → Bluetooth first, then scan again. Any ESC/POS thermal printer should work.',
          variant: 'warning',
        });
      }
    } catch (e) {
      showError({
        title: 'Scan failed',
        message: e instanceof Error ? e.message : 'Could not scan printers',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSelectDevice = async (address: string, name: string) => {
    setPickerVisible(false);
    setConnecting(true);
    try {
      const printer: SessionPrinter = {
        type: 'bluetooth',
        address,
        name,
        profile: guessPrinterProfile(name),
      };
      await bluetoothPrintService.connectSession(printer);
      applySession(printer);
      showError({
        title: 'Connected',
        message: `Connected to ${name}. Run short and long test prints, then save.`,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Connection failed',
        message: e instanceof Error ? e.message : 'Could not connect to printer',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectManualBluetooth = async () => {
    const mac = manualMac.trim();
    if (!bluetoothPrintService.isValidMacAddress(mac)) {
      showError({
        title: 'Invalid address',
        message: 'Enter Bluetooth MAC like AA:BB:CC:DD:EE:FF (from printer label or Android settings).',
        variant: 'warning',
      });
      return;
    }
    setConnecting(true);
    try {
      const printerName = manualName.trim() || 'Bluetooth printer';
      const printer: SessionPrinter = {
        type: 'bluetooth',
        address: mac,
        name: printerName,
        profile: guessPrinterProfile(printerName),
      };
      await bluetoothPrintService.connectSession(printer);
      applySession(printer);
      showError({
        title: 'Connected',
        message: `Connected to ${printer.name}. Run short and long test prints, then save.`,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Connection failed',
        message: e instanceof Error ? e.message : 'Could not connect. Pair the printer in Android Bluetooth settings first.',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectNetwork = async () => {
    setConnecting(true);
    try {
      const port = parseInt(netPort.trim() || '9100', 10);
      if (Number.isNaN(port) || port <= 0) {
        throw new Error('Port must be a number (usually 9100)');
      }
      const address = formatNetworkAddress(netHost, port);
      const printerName = netName.trim() || `Wi‑Fi printer ${netHost.trim()}`;
      const printer: SessionPrinter = {
        type: 'network',
        address,
        name: printerName,
        profile: 'standard_counter',
      };
      await bluetoothPrintService.connectSession(printer);
      applySession(printer);
      showError({
        title: 'Connected',
        message: `Connected to ${printer.name}. Run short and long test prints, then save.`,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Connection failed',
        message: e instanceof Error ? e.message : 'Could not connect to Wi‑Fi printer',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleTestShort = async () => {
    if (!session) {
      return;
    }
    setTestingShort(true);
    try {
      await bluetoothPrintService.printTestReceipt('short', {
        address: session.address,
        type: session.type,
        profile: printerProfile,
        storeName: storeName ?? undefined,
        settings,
      });
      setShortTestOk(true);
    } catch (e) {
      showError({
        title: 'Short test failed',
        message: e instanceof Error ? e.message : 'Print failed',
      });
    } finally {
      setTestingShort(false);
    }
  };

  const handleTestLong = async () => {
    if (!session) {
      return;
    }
    setTestingLong(true);
    try {
      await bluetoothPrintService.printTestReceipt('long', {
        address: session.address,
        type: session.type,
        profile: printerProfile,
        storeName: storeName ?? undefined,
        settings,
      });
      setLongTestOk(true);
    } catch (e) {
      showError({
        title: 'Long test failed',
        message: e instanceof Error ? e.message : 'Print failed',
      });
    } finally {
      setTestingLong(false);
    }
  };

  const handleSave = async () => {
    if (!session || !shortTestOk || !longTestOk) {
      return;
    }
    setSaving(true);
    try {
      await bluetoothPrintService.savePrinter({ ...session, profile: printerProfile });
      await loadSaved();
      setSession(null);
      resetTests();
      showError({
        title: 'Printer saved',
        message: `${session.name} is saved on this device. Receipts will print automatically.`,
        variant: 'info',
        confirmLabel: 'OK',
      });
    } catch (e) {
      showError({
        title: 'Save failed',
        message: e instanceof Error ? e.message : 'Could not save printer',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleForget = () => {
    showConfirm({
      title: 'Forget printer?',
      message: 'You will need to configure and test again before printing receipts.',
      confirmLabel: 'Forget',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        await bluetoothPrintService.clearSavedPrinter();
        setSavedPrinter(null);
        setSession(null);
        resetTests();
      },
    });
  };

  const deviceOptions = devices.map(d => ({
    id: d.address,
    label: d.name,
    subtitle: d.address,
  }));

  const canSave = Boolean(session && shortTestOk && longTestOk);
  const supportsBt = bluetoothPrintService.supportsBluetooth();
  const supportsNet = bluetoothPrintService.supportsNetwork();

  if (!bluetoothPrintService.isSupported()) {
    return (
      <ScreenContainer>
        <AppHeader title="Receipt printer" subtitle="Setup" showBack />
        <Box px="$5" py="$6">
          <Text color="$textLight400" textAlign="center">
            Printer module is not available in this build. Use a release Android build.
          </Text>
        </Box>
      </ScreenContainer>
    );
  }

  const savedTypeLabel =
    savedPrinter?.type === 'network' ? 'Wi‑Fi' : 'Bluetooth';
  const savedProfileLabel = savedPrinter
    ? PRINTER_PROFILES.find(p => p.id === savedPrinter.profile)?.title
    : null;

  return (
    <ScreenContainer>
      <AppHeader title="Receipt printer" subtitle="Any ESC/POS portable printer" showBack />
      <SmoothScrollView
        contentPaddingBottom={40}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <VStack px="$5" py="$4" space="md">
          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4">
            <HStack alignItems="center" gap="$3" mb="$2">
              <Box
                w={48}
                h={48}
                borderRadius="$xl"
                bg={colors.primarySoft}
                alignItems="center"
                justifyContent="center">
                <Printer size={24} color={colors.primary} />
              </Box>
              <VStack flex={1}>
                <Text fontSize="$md" fontWeight="$bold" color="$textLight0">
                  {savedPrinter ? savedPrinter.name : 'No printer saved'}
                </Text>
                <Text fontSize="$xs" color="$textLight400">
                  {savedPrinter
                    ? `${savedTypeLabel} · ${savedPrinter.address}${savedProfileLabel ? ` · ${savedProfileLabel}` : ''}`
                    : 'Works with most 58mm/80mm Bluetooth or Wi‑Fi thermal printers'}
                </Text>
              </VStack>
            </HStack>
            {paperSize ? (
              <Text fontSize="$xs" color="$textLight400">
                Server paper size: {paperSize}
              </Text>
            ) : null}
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4">
            <StepBadge step={1} label="Configure — connect any printer" done={Boolean(session)} />

            <HStack gap="$2" mb="$3">
              <TypeChip
                label="Bluetooth"
                active={connectionType === 'bluetooth'}
                onPress={() => setConnectionType('bluetooth')}
                disabled={!supportsBt}
              />
              <TypeChip
                label="Wi‑Fi"
                active={connectionType === 'network'}
                onPress={() => setConnectionType('network')}
                disabled={!supportsNet}
              />
            </HStack>

            {connectionType === 'bluetooth' ? (
              <VStack space="sm">
                <Text fontSize="$xs" color="$textLight400">
                  Pair the printer in Android Bluetooth settings, then scan. Works with mini ESC/POS
                  printers (SCO3H, Xprinter, etc.). Turn printer on, load paper, then run test prints.
                </Text>
                <PrimaryButton
                  label={scanning ? 'Scanning…' : 'Scan paired printers'}
                  onPress={handleScanBluetooth}
                  loading={scanning}
                  disabled={connecting}
                />
                <Text fontSize="$xs" fontWeight="$semibold" color="$textLight400" mt="$1">
                  Or connect by MAC address
                </Text>
                <AuthInput
                  label="Printer name (optional)"
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="My portable printer"
                />
                <AuthInput
                  label="Bluetooth MAC address"
                  value={manualMac}
                  onChangeText={setManualMac}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  autoCapitalize="characters"
                />
                <PrimaryButton
                  label={connecting ? 'Connecting…' : 'Connect by MAC'}
                  variant="outline"
                  onPress={handleConnectManualBluetooth}
                  loading={connecting}
                  disabled={scanning}
                />
              </VStack>
            ) : (
              <VStack space="sm">
                <Text fontSize="$xs" color="$textLight400">
                  Enter the printer IP on your shop Wi‑Fi (port 9100 is standard for ESC/POS).
                </Text>
                <AuthInput
                  label="Printer name (optional)"
                  value={netName}
                  onChangeText={setNetName}
                  placeholder="Counter Wi‑Fi printer"
                />
                <AuthInput
                  label="IP address"
                  value={netHost}
                  onChangeText={setNetHost}
                  placeholder="192.168.1.50"
                />
                <AuthInput
                  label="Port"
                  value={netPort}
                  onChangeText={setNetPort}
                  placeholder="9100"
                  keyboardType="number-pad"
                />
                <PrimaryButton
                  label={connecting ? 'Connecting…' : 'Connect Wi‑Fi printer'}
                  onPress={handleConnectNetwork}
                  loading={connecting}
                />
              </VStack>
            )}

            {session ? (
              <Box mt="$3" p="$3" bg={colors.primarySoft} borderRadius="$xl">
                <Text fontSize="$sm" fontWeight="$semibold" color={colors.text}>
                  Selected: {session.name}
                </Text>
                <Text fontSize="$xs" color={colors.textSecondary}>
                  {session.type === 'network' ? 'Wi‑Fi' : 'Bluetooth'} · {session.address}
                </Text>
              </Box>
            ) : null}

            <Text fontSize="$xs" fontWeight="$semibold" color="$textLight400" mt="$3" mb="$2">
              Printer type
            </Text>
            <Text fontSize="$xs" color="$textLight400" mb="$2">
              SCO3H and other mini Bluetooth printers need the portable profile. Counter /
              Wi‑Fi printers use the standard profile.
            </Text>
            <VStack space="sm">
              {PRINTER_PROFILES.map(profile => (
                <TypeChip
                  key={profile.id}
                  label={profile.title}
                  active={printerProfile === profile.id}
                  onPress={() => {
                    setPrinterProfile(profile.id);
                    resetTests();
                  }}
                />
              ))}
            </VStack>
            <Text fontSize="$xs" color="$textLight400" mt="$2">
              {PRINTER_PROFILES.find(p => p.id === printerProfile)?.examples}
            </Text>
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4"
            opacity={session ? 1 : 0.55}>
            <StepBadge
              step={2}
              label="Test — short and long receipt"
              done={shortTestOk && longTestOk}
            />
            <Text fontSize="$xs" color="$textLight400" mb="$3">
              Print both samples to confirm paper feed and layout before saving.
            </Text>
            <VStack space="sm">
              <PrimaryButton
                label={testingShort ? 'Printing…' : shortTestOk ? 'Short test ✓' : 'Print short test'}
                variant="outline"
                onPress={handleTestShort}
                loading={testingShort}
                disabled={!session}
              />
              <PrimaryButton
                label={testingLong ? 'Printing…' : longTestOk ? 'Long test ✓' : 'Print long test'}
                variant="outline"
                onPress={handleTestLong}
                loading={testingLong}
                disabled={!session}
              />
            </VStack>
          </Box>

          <Box
            bg="$white"
            borderRadius="$2xl"
            borderWidth={1}
            borderColor="$borderLight300"
            p="$4"
            opacity={canSave ? 1 : 0.55}>
            <StepBadge step={3} label="Save — use for all receipts" done={Boolean(savedPrinter)} />
            <PrimaryButton
              label="Save printer on this device"
              onPress={handleSave}
              loading={saving}
              disabled={!canSave}
            />
            {!canSave && session ? (
              <Text fontSize="$xs" color="$textLight400" mt="$2" textAlign="center">
                Complete short and long test prints to enable save.
              </Text>
            ) : null}
          </Box>

          {savedPrinter ? (
            <PrimaryButton
              label="Forget saved printer"
              variant="outline"
              onPress={handleForget}
            />
          ) : null}
        </VStack>
      </SmoothScrollView>

      <SelectionModal
        visible={pickerVisible}
        title={scanning ? 'Scanning…' : 'Select paired printer'}
        options={deviceOptions}
        onSelect={opt => handleSelectDevice(opt.id, opt.label)}
        onClose={() => setPickerVisible(false)}
        emptyMessage="No paired devices — add printer in Android Bluetooth settings"
      />
    </ScreenContainer>
  );
};
