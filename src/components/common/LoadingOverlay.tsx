import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, Center, Spinner, Text } from '@gluestack-ui/themed';
import { colors } from '@/theme';

interface LoadingOverlayProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  fullscreen = false,
}) => (
  <View style={fullscreen ? styles.full : styles.inline} pointerEvents="box-none">
    <Box bg={fullscreen ? '$white' : 'rgba(255,255,255,0.92)'} flex={fullscreen ? 1 : undefined}>
      <Center flex={fullscreen ? 1 : undefined} py={fullscreen ? undefined : '$6'}>
        <Spinner size="large" color="$primary500" />
        {message ? (
          <Text mt="$3" size="sm" color={colors.textMuted}>
            {message}
          </Text>
        ) : null}
      </Center>
    </Box>
  </View>
);

const styles = StyleSheet.create({
  full: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  inline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
  },
});
