import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { themes } from '../theme';

const t = themes.default;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      await login(data.token, data.username);
    } catch (e) {
      setError('Network error. Check your connection and server address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.inner}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: t.text }]}>Dataset Builder</Text>
                <Text style={[styles.subtitle, { color: t.mutedText }]}>
                  Sign in to the Swipe Interface
                </Text>
              </View>

              <View>
                <Text style={[styles.label, { color: t.subText }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText }]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="johndoe"
                  placeholderTextColor={t.inputPlaceholder}
                />

                <Text style={[styles.label, { color: t.subText }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter password"
                  placeholderTextColor={t.inputPlaceholder}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: t.accentBg }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={t.accentText} />
                  ) : (
                    <Text style={[styles.buttonText, { color: t.accentText }]}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={[styles.linkText, { color: t.mutedText }]}>
                    Don't have an account?{' '}
                    <Text style={{ color: t.text, textDecorationLine: 'underline' }}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
});
