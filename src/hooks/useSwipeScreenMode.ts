import { useCallback } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NavigationState, PartialState } from '@react-navigation/native';

const TAB_ROOT_ROUTES = new Set([
  'Dashboard',
  'SalesPOS',
  'ProductsList',
  'SettingsHome',
]);

const getFocusedRouteName = (
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined => {
  if (!state?.routes?.length) {
    return undefined;
  }
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (!route) {
    return undefined;
  }
  if (route.state) {
    return getFocusedRouteName(route.state);
  }
  return route.name;
};

export const useSwipeScreenMode = () => {
  const navigation = useNavigation();
  /** Stack-level state: focused screen name (e.g. Dashboard, SalesPOS). */
  const routeName = useNavigationState(getFocusedRouteName);

  const canGoBack = navigation.canGoBack();
  const isTabRoot = Boolean(routeName && TAB_ROOT_ROUTES.has(routeName));

  /** Tab roots only exist under main tabs — no need to walk full nav tree. */
  const enableTabSwipe = isTabRoot;
  const enableBackSwipe = canGoBack && !enableTabSwipe;

  return {
    routeName,
    enableTabSwipe,
    enableBackSwipe,
  };
};

export const useTabSwipeNavigation = () => {
  const navigation = useNavigation();

  const getTabNavigation = useCallback(() => {
    let parent = navigation.getParent();
    while (parent) {
      const state = parent.getState();
      if (state?.type === 'tab') {
        return parent;
      }
      parent = parent.getParent();
    }
    return null;
  }, [navigation]);

  const getCurrentTabIndex = useCallback(() => {
    const tabNav = getTabNavigation();
    if (!tabNav) {
      return -1;
    }
    const state = tabNav.getState();
    const routeName = state.routes[state.index]?.name;
    const order = ['Home', 'Sales', 'Products', 'Profile'];
    return order.indexOf(routeName);
  }, [getTabNavigation]);

  const goToTab = useCallback(
    (index: number) => {
      const tabNav = getTabNavigation();
      const order = ['Home', 'Sales', 'Products', 'Profile'] as const;
      const target = order[index];
      if (!tabNav || !target) {
        return;
      }
      tabNav.navigate(target);
    },
    [getTabNavigation],
  );

  const goNextTab = useCallback(() => {
    const index = getCurrentTabIndex();
    if (index >= 0 && index < 3) {
      goToTab(index + 1);
    }
  }, [getCurrentTabIndex, goToTab]);

  const goPrevTab = useCallback(() => {
    const index = getCurrentTabIndex();
    if (index > 0) {
      goToTab(index - 1);
    }
  }, [getCurrentTabIndex, goToTab]);

  return { goNextTab, goPrevTab, getCurrentTabIndex };
};
