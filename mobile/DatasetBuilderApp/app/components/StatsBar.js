import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsBar({ kept, discarded, inBuffer, isFetching, theme }) {
  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: theme.pillKeptBg }]}>
        <Text style={[styles.pillText, { color: theme.pillKeptText }]}>
          Kept: {kept}
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: theme.pillDiscardedBg }]}>
        <Text style={[styles.pillText, { color: theme.pillDiscardedText }]}>
          Discarded: {discarded}
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor: theme.pillBufferBg }]}>
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
