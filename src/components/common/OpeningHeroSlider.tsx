import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import type { ScrollView } from 'react-native-gesture-handler';
import { colors } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const OPENING_SLIDE_HEIGHT = Math.min(
  SCREEN_WIDTH * 0.68,
  SCREEN_HEIGHT * 0.38,
  300,
);

const AUTO_PLAY_MS = 3500;

interface OpeningHeroSliderProps {
  slides: readonly ImageSourcePropType[];
}

export const OpeningHeroSlider: React.FC<OpeningHeroSliderProps> = ({ slides }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isUserScrolling = useRef(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0) {
      setPageWidth(width);
    }
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || pageWidth === 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      if (isUserScrolling.current) {
        return;
      }
      const next = (activeIndexRef.current + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * pageWidth, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [slides.length, pageWidth]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth === 0) {
      return;
    }
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    activeIndexRef.current = safeIndex;
    setActiveIndex(safeIndex);
    isUserScrolling.current = false;
  };

  const goToSlide = (index: number) => {
    if (pageWidth === 0) {
      return;
    }
    activeIndexRef.current = index;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  };

  if (!slides.length) {
    return null;
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {pageWidth > 0 ? (
        <SmoothScrollView
          ref={scrollRef}
          horizontal
          contentPaddingBottom={0}
          snapToInterval={pageWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          pagingEnabled={false}
          onScrollBeginDrag={() => {
            isUserScrolling.current = true;
          }}
          onMomentumScrollEnd={handleScrollEnd}
          style={{ width: pageWidth, height: OPENING_SLIDE_HEIGHT }}
          contentContainerStyle={{ width: pageWidth * slides.length }}>
          {slides.map((slide, index) => (
            <View
              key={`opening-slide-${index}`}
              style={{ width: pageWidth, height: OPENING_SLIDE_HEIGHT }}>
              <Image
                source={slide}
                style={{ width: pageWidth, height: OPENING_SLIDE_HEIGHT }}
                resizeMode="contain"
                accessibilityLabel={`Welcome slide ${index + 1}`}
              />
            </View>
          ))}
        </SmoothScrollView>
      ) : (
        <View style={styles.placeholder}>
          <Image
            source={slides[0]}
            style={styles.placeholderImage}
            resizeMode="contain"
            accessibilityLabel="Welcome slide 1"
          />
        </View>
      )}

      <View style={styles.dots}>
        {slides.map((_, index) => (
          <Pressable
            key={`dot-${index}`}
            onPress={() => goToSlide(index)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Show slide ${index + 1}`}>
            <View
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  placeholder: {
    width: '100%',
    height: OPENING_SLIDE_HEIGHT,
  },
  placeholderImage: {
    width: '100%',
    height: OPENING_SLIDE_HEIGHT,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.white,
  },
});
