import { useCallback, useEffect, useState } from 'react';
import { holdPinStorage } from '@/services/storage/holdPinStorage';

export function useSavedHoldPin() {
  const [savedHoldPin, setSavedHoldPin] = useState<string | null>(null);
  const [holdPinReady, setHoldPinReady] = useState(false);

  useEffect(() => {
    let active = true;
    holdPinStorage.get().then(pin => {
      if (!active) {
        return;
      }
      setSavedHoldPin(pin);
      setHoldPinReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const saveHoldPin = useCallback(async (pin: string) => {
    const trimmed = pin.trim();
    if (!trimmed) {
      return;
    }
    await holdPinStorage.save(trimmed);
    setSavedHoldPin(trimmed);
  }, []);

  const clearHoldPin = useCallback(async () => {
    await holdPinStorage.clear();
    setSavedHoldPin(null);
  }, []);

  return { savedHoldPin, holdPinReady, saveHoldPin, clearHoldPin };
}
