import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';

export const useAppBack = (onBackPress?: () => void) => {
  const navigation = useNavigation();

  return useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: { screen: 'Dashboard' },
      }),
    );
  }, [navigation, onBackPress]);
};
