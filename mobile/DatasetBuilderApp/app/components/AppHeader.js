import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themes } from '../theme';

const t = themes.default;

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: t.border }]}>
      <Image
        source={require('../../assets/Classi-Logo-Style1-Transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: t.bg,
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },
  logo: {
    height: 32,
    width: 120,
  },
});
