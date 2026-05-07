import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../app/context/AuthContext';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('restoreSession on mount', () => {
    it('restores token and username from storage', async () => {
      SecureStore.getItemAsync
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce('stored-user');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isRestoring).toBe(false));

      expect(result.current.token).toBe('stored-token');
      expect(result.current.username).toBe('stored-user');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('username');
    });

    it('leaves token null when storage is empty', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isRestoring).toBe(false));

      expect(result.current.token).toBeNull();
      expect(result.current.username).toBeNull();
    });
  });

  describe('login()', () => {
    it('stores token and username then updates state', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);
      SecureStore.setItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isRestoring).toBe(false));

      await act(async () => {
        await result.current.login('new-token', 'new-user');
      });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'new-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('username', 'new-user');
      expect(result.current.token).toBe('new-token');
      expect(result.current.username).toBe('new-user');
    });
  });

  describe('logout()', () => {
    it('deletes token and username then clears state', async () => {
      SecureStore.getItemAsync
        .mockResolvedValueOnce('some-token')
        .mockResolvedValueOnce('some-user');
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isRestoring).toBe(false));

      expect(result.current.token).toBe('some-token');

      await act(async () => {
        await result.current.logout();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('username');
      expect(result.current.token).toBeNull();
      expect(result.current.username).toBeNull();
    });
  });
});
