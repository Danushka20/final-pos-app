import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SmoothScrollView } from '@/components/common/SmoothScrollView';
import type { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Lock, Mail, ShieldCheck, Wifi } from 'lucide-react-native';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ScreenTopBar, FLOATING_BACK_SCROLL_TOP } from '@/components/common/ScreenTopBar';
import { useAuth } from '@/context/AuthContext';
import { useErrorDialog } from '@/context/ErrorDialogContext';
import { AuthInput } from '@/components/inputs/AuthInput';
import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { photoAssets } from '@/assets/photos';
import { getApiBaseUrl } from '@/config/env';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { colors, shadows, typography } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const KEYBOARD_SCROLL_DELAY_MS = Platform.OS === 'ios' ? 80 : 160;

const fadeSlideUp = (
  opacity: Animated.Value,
  translateY: Animated.Value,
  delay = 0,
) =>
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 520,
      delay,
      useNativeDriver: true,
    }),
    Animated.spring(translateY, {
      toValue: 0,
      delay,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }),
  ]);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { login } = useAuth();
  const { showError, showErrorFromUnknown } = useErrorDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(-16)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(28)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      fadeSlideUp(heroOpacity, heroY, 0),
      fadeSlideUp(cardOpacity, cardY, 120),
      fadeSlideUp(formOpacity, formY, 240),
      Animated.spring(logoScale, {
        toValue: 1,
        delay: 180,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.04,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseTimer = setTimeout(() => pulse.start(), 900);
    return () => {
      clearTimeout(pulseTimer);
      pulse.stop();
    };
  }, [cardOpacity, cardY, formOpacity, formY, heroOpacity, heroY, logoScale]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, KEYBOARD_SCROLL_DELAY_MS);
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!isValidPassword(password)) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      showError({
        title: 'Check your details',
        message: 'Please fix the highlighted fields and try again.',
        variant: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      showErrorFromUnknown(err, 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const apiUrl = getApiBaseUrl();

  return (
    <ScreenContainer>
      <ScreenTopBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SmoothScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[
              styles.scroll,
              keyboardVisible ? styles.scrollWithKeyboard : styles.scrollIdle,
              { paddingTop: insets.top + FLOATING_BACK_SCROLL_TOP },
            ]}
            contentPaddingBottom={Math.max(insets.bottom, 24) + 24}
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets>
            <Animated.View
              style={{
                opacity: heroOpacity,
                transform: [{ translateY: heroY }],
              }}>
              <View style={styles.hero}>
                <HStack alignItems="center" justifyContent="space-between" px="$1">
                  <VStack flex={1} pr="$2">
                    <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                      <Box
                        bg={colors.white}
                        borderRadius="$xl"
                        px="$3"
                        py="$2"
                        alignSelf="flex-start"
                        borderWidth={1}
                        borderColor={colors.border}
                        style={shadows.sm}>
                        <Image
                          source={photoAssets.companyLogo}
                          style={styles.heroLogo}
                          resizeMode="contain"
                          accessibilityLabel="Company logo"
                        />
                      </Box>
                    </Animated.View>
                    <Text
                      style={[
                        typography.h2,
                        { color: colors.text, marginTop: 16 },
                      ]}>
                      Welcome back
                    </Text>
                    <Text
                      style={[
                        typography.body,
                        { color: colors.textSecondary, marginTop: 4 },
                      ]}>
                      Sign in to manage sales, stock & customers
                    </Text>
                    <HStack
                      alignItems="center"
                      gap="$1.5"
                      mt="$3"
                      bg={colors.backgroundAlt}
                      alignSelf="flex-start"
                      px="$3"
                      py="$1.5"
                      borderRadius="$full"
                      borderWidth={1}
                      borderColor={colors.border}>
                      <ShieldCheck size={14} color={colors.text} />
                      <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                        Secure POS login
                      </Text>
                    </HStack>
                  </VStack>

                  <Box w={108} h={96} alignItems="center" justifyContent="center">
                    <LottieView
                      source={require('@/assets/animations/login-secure.json')}
                      autoPlay
                      loop
                      speed={0.85}
                      style={styles.lottie}
                    />
                  </Box>
                </HStack>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                shadows.lg,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardY }],
                },
              ]}>
              <View style={styles.accentBar} />

              <Animated.View
                style={{
                  opacity: formOpacity,
                  transform: [{ translateY: formY }],
                }}>
                <Text style={[typography.h3, { color: colors.text, marginBottom: 4 }]}>
                  Sign in
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginBottom: 20 }]}>
                  Use your store account credentials
                </Text>

                <AuthInput
                  label="Email address"
                  icon={Mail}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@store.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  error={errors.email}
                  onFocus={() => scrollToInput(80)}
                />

                <AuthInput
                  label="Password"
                  icon={Lock}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  isPassword
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  error={errors.password}
                  onFocus={() => scrollToInput(180)}
                />

                <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} />

                <Pressable
                  mt="$2"
                  onPress={() => navigation.navigate('BackendConfig')}
                  alignSelf="center"
                  style={styles.serverPill}>
                  <HStack alignItems="center" gap="$2" px="$3" py="$2.5">
                    <Wifi size={14} color={apiUrl ? colors.primary : colors.error} />
                    <VStack flex={1}>
                      <Text
                        style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                        Connected server
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: apiUrl ? colors.primary : colors.error,
                            fontWeight: '700',
                          },
                        ]}
                        numberOfLines={1}>
                        {apiUrl || 'Not configured — tap to set up'}
                      </Text>
                    </VStack>
                  </HStack>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </SmoothScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scrollIdle: {
    justifyContent: 'center',
  },
  scrollWithKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  hero: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: -18,
    minHeight: 168,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLogo: {
    width: 112,
    height: 36,
  },
  lottie: {
    width: 108,
    height: 96,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 22,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentBar: {
    height: 3,
    backgroundColor: colors.text,
    borderRadius: 2,
    marginBottom: 18,
    marginHorizontal: -22,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  serverPill: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
});
