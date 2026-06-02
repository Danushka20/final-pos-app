import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Bell } from 'lucide-react-native';
import { colors } from '@/theme';

interface NotificationBellButtonProps {
  count?: number;
  onPress: () => void;
}

export const NotificationBellButton: React.FC<NotificationBellButtonProps> = ({
  count = 0,
  onPress,
}) => (
  <View style={styles.wrap}>
    <IconButton
      icon={() => <Bell size={20} color={colors.text} strokeWidth={2.25} />}
      mode="outlined"
      size={22}
      onPress={onPress}
      accessibilityLabel={
        count > 0 ? `${count} unread alerts` : 'Open alerts'
      }
      style={styles.btn}
    />
    {count > 0 ? (
      <Pressable style={styles.badge} onPress={onPress}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  btn: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
});
