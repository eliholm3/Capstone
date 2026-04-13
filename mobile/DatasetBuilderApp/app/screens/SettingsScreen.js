import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { themes } from '../theme';

const t = themes.default;

export default function SettingsScreen() {
  const { username, logout } = useAuth();

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.content}>

          {/* Account section */}
          <Text style={[styles.sectionLabel, { color: t.mutedText }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <Text style={[styles.cardLabel, { color: t.mutedText }]}>Signed in as</Text>
            <Text style={[styles.cardValue, { color: t.text }]}>{username}</Text>
          </View>

          <TouchableOpacity
            onPress={logout}
            style={[styles.signOutBtn, { backgroundColor: t.buttonBg, borderColor: t.buttonBorder }]}
          >
            <Text style={[styles.signOutText, { color: t.discardColor }]}>Sign Out</Text>
          </TouchableOpacity>

          {/* App section */}
          <Text style={[styles.sectionLabel, { color: t.mutedText, marginTop: 32 }]}>App</Text>
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border }]}>
            <Text style={[styles.cardLabel, { color: t.mutedText }]}>Version</Text>
            <Text style={[styles.cardValue, { color: t.text }]}>Classi v1.0</Text>
          </View>
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.border, marginTop: 10 }]}>
            <Text style={[styles.cardLabel, { color: t.mutedText }]}>Export your datasets</Text>
            <Text style={[styles.cardValue, { color: t.mutedText, fontSize: 13 }]}>
              Visit the web export panel to download approved images as CSV.
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
