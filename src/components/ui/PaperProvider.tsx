import React, { type PropsWithChildren } from 'react';
import { PaperProvider as RNPaperProvider } from 'react-native-paper';
import { paperTheme } from '@/theme/paperTheme';

export const AppPaperProvider: React.FC<PropsWithChildren> = ({ children }) => (
  <RNPaperProvider theme={paperTheme}>{children}</RNPaperProvider>
);
