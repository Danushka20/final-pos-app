import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { NotificationBellButton } from '@/components/common/NotificationBellButton';
import { colors, typography } from '@/theme';

interface DashboardHomeHeaderProps {
  userName?: string;
  alertCount?: number;
  onAlertsPress: () => void;
  onLogout: () => void;
}

export const DashboardHomeHeader: React.FC<DashboardHomeHeaderProps> = ({
  userName,
  alertCount = 0,
  onAlertsPress,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Surface style={[styles.bar, { paddingTop: insets.top + 10 }]} elevation={0}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.greeting}>POS Mobile</Text>
          <Text style={styles.title}>Dashboard</Text>
          {userName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {userName}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <NotificationBellButton count={alertCount} onPress={onAlertsPress} />
          <IconButton
            icon={() => <LogOut size={20} color={colors.text} strokeWidth={2.25} />}
            mode="outlined"
            size={22}
            onPress={onLogout}
            accessibilityLabel="Sign out"
            style={styles.logoutBtn}
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.backgroundAlt,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  textCol: {
    flex: 1,
    paddingRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greeting: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    marginTop: 4,
    fontSize: 32,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  logoutBtn: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
});
