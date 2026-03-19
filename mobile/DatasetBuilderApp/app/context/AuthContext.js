import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Helper to handle Web vs Native storage
  const getItem = async (key) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  };

  const setItem = async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  };

  const deleteItem = async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  };

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getItem('token');
        const storedUsername = await getItem('username');
        if (storedToken) {
          setToken(storedToken);
          setUsername(storedUsername);
        }
      } catch (e) {
        console.error("Session restore failed", e);
      } finally {
        setIsRestoring(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (newToken, newUsername) => {
    try {
      await setItem('token', newToken);
      await setItem('username', newUsername || '');
      setToken(newToken);
      setUsername(newUsername);
    } catch (e) {
      console.error("Login storage failed", e);
      throw e; // Re-throw so the Screen can catch it
    }
  };

  const logout = async () => {
    await deleteItem('token');
    await deleteItem('username');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout, isRestoring }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}