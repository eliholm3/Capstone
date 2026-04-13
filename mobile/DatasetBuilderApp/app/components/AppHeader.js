import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { themes } from '../theme';

const t = themes.default;

export default function AppHeader() {
  return (
    <View style={styles.header}>
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
    height: 52,
    backgroundColor: t.bg,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    height: 32,
    width: 120,
  },
});
