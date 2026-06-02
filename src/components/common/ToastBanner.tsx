import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '@/theme';
import type { ToastMessage } from '@/types/notifications';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bg: colors.pastelGreenSoft,
    border: colors.pastelGreen,
    color: colors.success,
  },
  info: {
    icon: Info,
    bg: colors.infoSoft,
    border: colors.border,
    color: colors.text,
  },
  warning: {
    icon: AlertTriangle,
    bg: colors.warningSoft,
    border: colors.pastelYellow,
    color: colors.warning,
  },
  error: {
    icon: AlertCircle,
    bg: colors.errorSoft,
    border: colors.pastelPink,
    color: colors.error,
  },
} as const;

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [toast, onDismiss, opacity, translateY]);

  if (!toast) {
    return null;
  }

  const config = VARIANTS[toast.variant];
  const Icon = config.icon;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + 8, opacity, transform: [{ translateY }] },
      ]}>
      <Pressable
        onPress={onDismiss}
        style={[styles.card, shadows.md, { backgroundColor: config.bg, borderColor: config.border }]}>
        <View style={styles.iconWrap}>
          <Icon size={20} color={config.color} strokeWidth={2.25} />
        </View>
        <View style={styles.textCol}>
          {toast.title ? <Text style={styles.title}>{toast.title}</Text> : null}
          <Text style={styles.message}>{toast.message}</Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
          <X size={16} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconWrap: {
    marginTop: 1,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
});
