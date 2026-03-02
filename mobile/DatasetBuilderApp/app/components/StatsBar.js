import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsBar({ kept, discarded, inBuffer, isFetching, theme }) {
  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: theme.pillKeptBg, borderRadius: theme.borderRadius }]}>
        <Text style={[styles.pillText, { color: theme.pillKeptText }]}>
          Kept: {kept}
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: theme.pillDiscardedBg, borderRadius: theme.borderRadius }]}>
        <Text style={[styles.pillText, { color: theme.pillDiscardedText }]}>
          Discarded: {discarded}
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: theme.pillBufferBg, borderRadius: theme.borderRadius }]}>
        <Text style={[styles.pillText, { color: theme.pillBufferText }]}>
          Buffer: {inBuffer}
          {isFetching ? '...' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
