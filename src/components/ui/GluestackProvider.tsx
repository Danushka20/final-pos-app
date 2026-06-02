import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { appGluestackConfig } from '@/theme/gluestack.config';

interface Props {
  children: React.ReactNode;
}

export const GluestackProvider: React.FC<Props> = ({ children }) => (
  <GluestackUIProvider config={appGluestackConfig} colorMode="light">
    {children}
  </GluestackUIProvider>
);
