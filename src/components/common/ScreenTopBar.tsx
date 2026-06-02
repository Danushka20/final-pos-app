import React from 'react';
import { FloatingBackButton } from '@/components/common/FloatingBackButton';
import { useAppBack } from '@/hooks/useAppBack';

interface ScreenTopBarProps {
  onBack?: () => void;
  showBack?: boolean;
}

/** Floating back only — no extra header bar. */
export const ScreenTopBar: React.FC<ScreenTopBarProps> = ({ onBack, showBack = true }) => {
  const defaultBack = useAppBack(onBack);

  if (!showBack) {
    return null;
  }

  return <FloatingBackButton onPress={onBack ?? defaultBack} />;
};

/** Scroll padding so content clears floating back + status bar on auth screens. */
export const FLOATING_BACK_SCROLL_TOP = 56;
