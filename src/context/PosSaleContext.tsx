import React, { createContext, useContext } from 'react';
import { usePosSale } from '@/hooks/usePosSale';

type PosSaleContextValue = ReturnType<typeof usePosSale>;

const PosSaleContext = createContext<PosSaleContextValue | null>(null);

export const PosSaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = usePosSale();
  return (
    <PosSaleContext.Provider value={value}>{children}</PosSaleContext.Provider>
  );
};

export const usePosSaleContext = (): PosSaleContextValue => {
  const ctx = useContext(PosSaleContext);
  if (!ctx) {
    throw new Error('usePosSaleContext must be used within PosSaleProvider');
  }
  return ctx;
};
