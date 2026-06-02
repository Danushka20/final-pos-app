import { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';

/** Hide status bar; Android nav bar is handled in MainActivity immersive mode. */
export const useImmersiveFullScreen = (): void => {
  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        StatusBar.setHidden(true, 'fade');
      }
    });

    return () => subscription.remove();
  }, []);
};
