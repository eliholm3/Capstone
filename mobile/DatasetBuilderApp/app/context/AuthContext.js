import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUsername = await SecureStore.getItemAsync('username');
        if (storedToken) {
          setToken(storedToken);
          setUsername(storedUsername);
        }
      } catch (e) {
        // Ignore restore errors
      } finally {
        setIsRestoring(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (newToken, newUsername) => {
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('username', newUsername || '');
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('username');
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
