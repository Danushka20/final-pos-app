import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const EDGE_WIDTH = 32;
const BACK_DISTANCE = 56;
const BACK_VELOCITY = 320;

interface StackBackSwipeGestureProps {
  enabled?: boolean;
  children: React.ReactNode;
}

export const StackBackSwipeGesture: React.FC<StackBackSwipeGestureProps> = ({
  enabled = true,
  children,
}) => {
  const navigation = useNavigation();

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const backGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX(10)
        .failOffsetY([-28, 28])
        .onEnd(e => {
          'worklet';
          if (e.translationX >= BACK_DISTANCE || e.velocityX >= BACK_VELOCITY) {
            runOnJS(goBack)();
          }
        }),
    [enabled, goBack],
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      {children}
      {enabled ? (
        <GestureDetector gesture={backGesture}>
          <View style={styles.leftEdge} />
        </GestureDetector>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  leftEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 8,
  },
});
