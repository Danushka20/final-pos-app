import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useTabSwipeNavigation } from '@/hooks/useSwipeScreenMode';

/** Minimum horizontal drag to switch tab */
const SWIPE_DISTANCE = 48;
/** Quick flick velocity (px/s) */
const SWIPE_VELOCITY = 280;
/** Vertical movement before tab pan cancels — keeps ScrollView free to scroll */
const VERTICAL_FAIL = 12;

interface TabSwipeGestureProps {
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Smooth swipe between main tabs: Home → Sales → Products → Settings.
 */
export const TabSwipeGesture: React.FC<TabSwipeGestureProps> = ({
  enabled = true,
  children,
}) => {
  const { goNextTab, goPrevTab } = useTabSwipeNavigation();

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(10)
        .activeOffsetX([-22, 22])
        .failOffsetY([-VERTICAL_FAIL, VERTICAL_FAIL])
        .onEnd(e => {
          'worklet';
          const dx = e.translationX;
          const dy = e.translationY;
          const vx = e.velocityX;

          if (Math.abs(dx) < Math.abs(dy) * 1.25) {
            return;
          }

          if (dx >= SWIPE_DISTANCE || vx >= SWIPE_VELOCITY) {
            runOnJS(goPrevTab)();
            return;
          }
          if (dx <= -SWIPE_DISTANCE || vx <= -SWIPE_VELOCITY) {
            runOnJS(goNextTab)();
          }
        }),
    [enabled, goNextTab, goPrevTab],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
