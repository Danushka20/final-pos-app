import React, { createContext, useContext } from 'react';
import { usePurchaseCreate } from '@/hooks/usePurchaseCreate';

type PurchaseCreateContextValue = ReturnType<typeof usePurchaseCreate>;

const PurchaseCreateContext = createContext<PurchaseCreateContextValue | null>(
  null,
);

export const PurchaseCreateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = usePurchaseCreate();
  return (
    <PurchaseCreateContext.Provider value={value}>
      {children}
    </PurchaseCreateContext.Provider>
  );
};

export const usePurchaseCreateContext = (): PurchaseCreateContextValue => {
  const ctx = useContext(PurchaseCreateContext);
  if (!ctx) {
    throw new Error(
      'usePurchaseCreateContext must be used within PurchaseCreateProvider',
    );
  }
  return ctx;
};
