import React from 'react';
import { View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackBackSwipeGesture } from '@/components/common/StackBackSwipeGesture';
import { TabSwipeGesture } from '@/components/common/TabSwipeGesture';
import { useSwipeScreenMode } from '@/hooks/useSwipeScreenMode';
import { colors } from '@/theme';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom')[];
  className?: string;
  variant?: 'default' | 'white' | 'dark';
  /**
   * auto — tab roots: swipe between tabs; nested screens: swipe back
   * off — disable all swipe gestures
   */
  swipeMode?: 'auto' | 'off';
  /** @deprecated Use swipeMode="auto" (default). Kept for compatibility. */
  enableTabSwipe?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  edges = [],
  variant = 'default',
  className = '',
  swipeMode = 'auto',
  enableTabSwipe: enableTabSwipeLegacy,
  style,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const bg =
    variant === 'white'
      ? colors.white
      : variant === 'dark'
        ? colors.black
        : colors.backgroundAlt;
  const { enableTabSwipe: autoTab, enableBackSwipe } = useSwipeScreenMode();

  const tabSwipeOn =
    swipeMode === 'off'
      ? false
      : enableTabSwipeLegacy ?? autoTab;
  const backSwipeOn = swipeMode === 'auto' && enableBackSwipe;

  const content = (
    <View
      className={`flex-1 ${className}`}
      style={[
        { backgroundColor: bg, flex: 1, position: 'relative' },
        edges.includes('top') ? { paddingTop: insets.top } : undefined,
        edges.includes('bottom') ? { paddingBottom: insets.bottom } : undefined,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );

  if (!tabSwipeOn && !backSwipeOn) {
    return content;
  }

  if (tabSwipeOn) {
    return <TabSwipeGesture enabled>{content}</TabSwipeGesture>;
  }

  return (
    <StackBackSwipeGesture enabled={backSwipeOn}>{content}</StackBackSwipeGesture>
  );
};
