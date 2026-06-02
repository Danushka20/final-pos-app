import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, ShieldCheck, Zap } from 'lucide-react-native';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import {
  OpeningHeroCollage,
  OPENING_HERO_HEIGHT,
} from '@/components/common/OpeningHeroCollage';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { photoAssets } from '@/assets/photos';
import { colors, fontFamily, radius, shadows, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Opening'>;

const { width, height } = Dimensions.get('window');

const TRUST_ITEMS = [
  { icon: Zap, label: 'Fast checkout' },
  { icon: ShieldCheck, label: 'Secure login' },
  { icon: BarChart3, label: 'Live analytics' },
] as const;

export const OpeningScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const heroY = useRef(new Animated.Value(28)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copyY = useRef(new Animated.Value(18)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.stagger(110, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
        Animated.timing(heroY, {
          toValue: 0,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(copyOpacity, {
          toValue: 1,
          duration: 540,
          useNativeDriver: true,
        }),
        Animated.timing(copyY, {
          toValue: 0,
          duration: 540,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(ctaY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [copyOpacity, copyY, ctaOpacity, ctaY, heroOpacity, heroScale, heroY]);

  const goToSetup = () => navigation.navigate('BackendConfig');

  return (
    <ScreenContainer variant="dark" swipeMode="off">
      <View style={styles.backdrop}>
        <View style={styles.backdropGlowTop} />
        <View style={styles.backdropGlowBottom} />
      </View>

      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}>
        <View style={styles.topBar}>
          <View style={styles.logoBadge}>
            <Image
              source={photoAssets.companyLogo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Company logo"
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.heroBlock,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroY }, { scale: heroScale }],
            },
          ]}>
          <OpeningHeroCollage />
        </Animated.View>

        <Animated.View
          style={[
            styles.copyBlock,
            {
              opacity: copyOpacity,
              transform: [{ translateY: copyY }],
            },
          ]}>
          <Text style={styles.eyebrow}>BUSINESS POS PLATFORM</Text>
          <Text style={styles.title}>Welcome to{'\n'}POS Mobile</Text>
          <Text style={styles.subtitle}>
            Manage sales, inventory, and customers in one modern workspace built for
            professional retail teams.
          </Text>

          <View style={styles.trustRow}>
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Icon size={13} color={colors.textOnDark} strokeWidth={2.35} />
                </View>
                <Text style={styles.trustLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View
          style={[
            styles.ctaBlock,
            {
              opacity: ctaOpacity,
              transform: [{ translateY: ctaY }],
            },
          ]}>
          <View style={styles.ctaDivider} />

          <PrimaryButton label="Get Started" variant="light" onPress={goToSetup} />

          <Pressable
            onPress={goToSetup}
            style={styles.signInLink}
            accessibilityRole="button"
            accessibilityLabel="Sign in">
            <Text style={styles.signInText}>Already configured? Sign in</Text>
          </Pressable>

          <View style={styles.pageDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.black,
  },
  backdropGlowTop: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: width * 1.1,
    height: width * 0.72,
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backdropGlowBottom: {
    position: 'absolute',
    bottom: -120,
    alignSelf: 'center',
    width: width * 0.9,
    height: width * 0.5,
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  root: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 24,
  },
  topBar: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logoBadge: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 22,
    paddingVertical: 12,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logo: {
    width: Math.min(width * 0.44, 168),
    height: 46,
  },
  heroBlock: {
    minHeight: OPENING_HERO_HEIGHT,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  copyBlock: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.52)',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    ...typography.screenTitle,
    fontFamily: fontFamily.extrabold,
    color: colors.textOnDark,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    fontFamily: fontFamily.regular,
    color: 'rgba(255,255,255,0.64)',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 330,
    fontSize: 15,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  trustIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
  spacer: {
    flex: 1,
    minHeight: 10,
  },
  ctaBlock: {
    width: '100%',
    paddingTop: 4,
  },
  ctaDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 18,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.68)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.28)',
  },
  pageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.white,
  },
});
