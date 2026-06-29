import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Bluetooth,
  Camera,
  Contact,
  HardDrive,
  MapPin,
  Mic,
  Smartphone,
} from 'lucide-react-native';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import type { DevicePermissionKey, DevicePermissionsMap } from '@/types/deviceProfile';
import { colors, radius, shadows, typography } from '@/theme';

const PERMISSION_ROWS: Array<{
  key: DevicePermissionKey;
  label: string;
  description: string;
  Icon: typeof Bell;
}> = [
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Low stock and store alerts on your phone',
    Icon: Bell,
  },
  {
    key: 'storage',
    label: 'Storage & photos',
    description: 'Save receipts and choose receipt logos',
    Icon: HardDrive,
  },
  {
    key: 'camera',
    label: 'Camera',
    description: 'Capture product and receipt images',
    Icon: Camera,
  },
  {
    key: 'microphone',
    label: 'Microphone',
    description: 'Voice and audio features on this device',
    Icon: Mic,
  },
  {
    key: 'contacts',
    label: 'Contacts',
    description: 'Link customers from your phone contacts',
    Icon: Contact,
  },
  {
    key: 'phone',
    label: 'Phone',
    description: 'Device identity for secure POS access',
    Icon: Smartphone,
  },
  {
    key: 'location',
    label: 'Location',
    description: 'Bluetooth printer discovery and branch context',
    Icon: MapPin,
  },
  {
    key: 'bluetooth',
    label: 'Bluetooth',
    description: 'Connect to receipt printers',
    Icon: Bluetooth,
  },
];

interface AppPermissionsModalProps {
  visible: boolean;
  busy: boolean;
  permissions: DevicePermissionsMap | null;
  onAllow: () => void;
  onContinue: () => void;
}

const statusLabel = (status: string | undefined): string => {
  switch (status) {
    case 'granted':
      return 'Allowed';
    case 'denied':
      return 'Denied';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Not set';
  }
};

const statusColor = (status: string | undefined): string => {
  switch (status) {
    case 'granted':
      return colors.success;
    case 'blocked':
    case 'denied':
      return colors.error;
    default:
      return colors.textMuted;
  }
};

export const AppPermissionsModal: React.FC<AppPermissionsModalProps> = ({
  visible,
  busy,
  permissions,
  onAllow,
  onContinue,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = windowHeight * 0.88;
  const listMaxHeight = Math.max(sheetMaxHeight - 240, windowHeight * 0.25);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { maxHeight: sheetMaxHeight, paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <View style={styles.header}>
            <Text style={styles.title}>Allow phone access</Text>
            <Text style={styles.subtitle}>
              POS needs these permissions to send alerts, print receipts, sync with your store,
              and register this device on the server with its network address. You only see this
              once — choices are saved on this phone.
            </Text>
          </View>

          <ScrollView
            style={[styles.listScroll, { maxHeight: listMaxHeight }]}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {PERMISSION_ROWS.map(row => {
              const status = permissions?.[row.key];
              return (
                <View key={row.key} style={styles.row}>
                  <View style={styles.iconWrap}>
                    <row.Icon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{row.label}</Text>
                    <Text style={styles.rowDescription}>{row.description}</Text>
                  </View>
                  <Text style={[styles.status, { color: statusColor(status) }]}>
                    {statusLabel(status)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={busy ? 'Requesting access…' : 'Allow all access'}
              onPress={onAllow}
              disabled={busy}
              loading={busy}
            />
            <Pressable
              onPress={onContinue}
              disabled={busy}
              style={styles.secondaryAction}
              accessibilityRole="button">
              <Text style={styles.secondaryLabel}>Continue to app</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 24,
    width: '100%',
    ...shadows.lg,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listScroll: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...typography.label,
    color: colors.text,
  },
  rowDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  status: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
    minWidth: 52,
    textAlign: 'right',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
    backgroundColor: colors.white,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
