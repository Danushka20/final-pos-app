import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import { cardStyles, colors } from '@/theme';

interface DashboardPanelProps {
  children: React.ReactNode;
  style?: object;
}

/** Elevated section block for dashboard — BizLink white card on gray canvas */
export const DashboardPanel: React.FC<DashboardPanelProps> = ({ children, style }) => (
  <Surface style={[styles.panel, cardStyles.surface, style]} elevation={0}>
    {children}
  </Surface>
);

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    marginBottom: 14,
    borderColor: colors.border,
  },
});
