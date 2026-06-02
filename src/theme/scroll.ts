import { Platform, type ScrollViewProps } from 'react-native';

/** Shared props for buttery vertical scrolling */
export const smoothVerticalScrollProps: Partial<ScrollViewProps> = {
  showsVerticalScrollIndicator: false,
  decelerationRate: 'normal',
  scrollEventThrottle: 16,
  nestedScrollEnabled: true,
  overScrollMode: 'always',
  bounces: true,
  keyboardShouldPersistTaps: 'handled',
  ...(Platform.OS === 'android' ? { persistentScrollbar: false } : {}),
};

/** Horizontal chip / tab strips */
export const smoothHorizontalScrollProps: Partial<ScrollViewProps> = {
  showsHorizontalScrollIndicator: false,
  decelerationRate: 'fast',
  scrollEventThrottle: 16,
  nestedScrollEnabled: true,
  overScrollMode: 'always',
  directionalLockEnabled: true,
  keyboardShouldPersistTaps: 'handled',
};

export const smoothListProps = {
  showsVerticalScrollIndicator: false,
  decelerationRate: 'normal' as const,
  scrollEventThrottle: 16,
  nestedScrollEnabled: true,
  overScrollMode: 'always' as const,
  keyboardShouldPersistTaps: 'handled' as const,
  removeClippedSubviews: Platform.OS === 'android',
  initialNumToRender: 12,
  maxToRenderPerBatch: 12,
  windowSize: 11,
  updateCellsBatchingPeriod: 50,
};
