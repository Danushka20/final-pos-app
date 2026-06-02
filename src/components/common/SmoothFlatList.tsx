import React from 'react';
import { StyleSheet, type FlatListProps } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { smoothListProps } from '@/theme/scroll';

export function SmoothFlatList<ItemT>({
  style,
  contentContainerStyle,
  ...props
}: FlatListProps<ItemT>) {
  return (
    <FlatList
      {...smoothListProps}
      {...props}
      style={[styles.list, style]}
      contentContainerStyle={[
        props.data?.length === 0 ? undefined : { paddingBottom: 24 },
        contentContainerStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
