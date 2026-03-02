import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { themes } from '../theme';
import SwipeCard from '../components/SwipeCard';
import BufferStrip from '../components/BufferStrip';
import StatsBar from '../components/StatsBar';

const BUFFER_SIZE = 10;
const FETCH_TRIGGER_THRESHOLD = 5;

export default function SwipeScreen() {
  const { token, username, logout } = useAuth();

  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [discardedImages, setDiscardedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [themeName, setThemeName] = useState('default');
  const [imagesEndpoint, setImagesEndpoint] = useState(false); // tracks if endpoint exists

  const hasFetchedInitial = useRef(false);
  const isFetchingRef = useRef(false);

  const theme = themes[themeName] || themes.default;

  // Restore theme from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved && themes[saved]) setThemeName(saved);
    });
  }, []);

  const toggleTheme = () => {
    const next = themeName === 'default' ? 'developer' : 'default';
    setThemeName(next);
    AsyncStorage.setItem('theme', next);
  };

  const fetchImages = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 404) {
        // Endpoint not yet implemented — show graceful stub
        return [];
      }

      if (!response.ok) {
        console.warn('Images endpoint error:', response.status);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.images || [];
    } catch (e) {
      console.warn('Images fetch error:', e.message);
      return [];
    } finally {
      isFetchingRef.current = false;
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      setIsLoading(true);
      fetchImages().then(newImages => {
        setImages(newImages);
        setIsLoading(false);
      });
    }
  }, [fetchImages]);

  // Fetch more when running low
  useEffect(() => {
    const remaining = images.length - currentIndex;
    if (remaining <= FETCH_TRIGGER_THRESHOLD && !isFetchingRef.current && images.length > 0) {
      setIsFetching(true);
      fetchImages().then(newImages => {
        setImages(prev => [...prev, ...newImages]);
        setIsFetching(false);
      });
    }
  }, [currentIndex, images.length, fetchImages]);

  const handleSwipe = async (direction) => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;

    // Fire-and-forget label POST (endpoint may not exist yet)
    fetch(`${API_BASE_URL}/api/user/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: currentImage.id, label: direction === 'right' ? 'keep' : 'discard' }),
    }).catch(() => {});

    if (direction === 'right') {
      setKeptImages(prev => [...prev, currentImage]);
    } else {
      setDiscardedImages(prev => [...prev, currentImage]);
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;
    const lastImage = images[currentIndex - 1];
    setKeptImages(prev => prev.filter(img => img.id !== lastImage.id));
    setDiscardedImages(prev => prev.filter(img => img.id !== lastImage.id));
    setCurrentIndex(prev => prev - 1);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setKeptImages([]);
    setDiscardedImages([]);
    setImages([]);
    hasFetchedInitial.current = false;
    isFetchingRef.current = false;
    setIsLoading(true);
    fetchImages().then(newImages => {
      setImages(newImages);
      setIsLoading(false);
      hasFetchedInitial.current = true;
    });
  };

  const getBufferImages = () => {
    const startIdx = Math.max(0, currentIndex - 5);
    const endIdx = Math.min(images.length, currentIndex + 6);
    const result = [];

    for (let i = startIdx; i < endIdx; i++) {
      const img = images[i];
      const isPast = i < currentIndex;
      const isCurrent = i === currentIndex;

      let status = null;
      if (isPast) {
        if (keptImages.find(k => k.id === img.id)) status = 'kept';
        else if (discardedImages.find(d => d.id === img.id)) status = 'discarded';
      }

      result.push({ ...img, index: i, isPast, isCurrent, status });
    }

    return result;
  };

  const currentImage = images[currentIndex];
  const bufferImages = getBufferImages();

  return (
    <LinearGradient colors={theme.bgColors} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={logout} style={[styles.iconBtn, { backgroundColor: theme.buttonBg, borderColor: theme.buttonBorder, borderRadius: theme.borderRadius }]}>
            <Text style={[styles.iconBtnText, { color: theme.buttonText }]}>Logout</Text>
          </TouchableOpacity>

          <Text style={[styles.screenTitle, { color: theme.text }]}>
            {username ? `Hi, ${username}` : 'Image Classifier'}
          </Text>

          <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.buttonBg, borderColor: theme.buttonBorder, borderRadius: theme.borderRadius }]}>
            <Text style={[styles.iconBtnText, { color: theme.buttonText }]}>
              {themeName === 'default' ? 'Dev' : 'Color'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <StatsBar
          kept={keptImages.length}
          discarded={discardedImages.length}
          inBuffer={images.length - currentIndex}
          isFetching={isFetching}
          theme={theme}
        />

        {/* Buffer strip */}
        {!isLoading && bufferImages.length > 0 && (
          <BufferStrip bufferImages={bufferImages} theme={theme} />
        )}

        {/* Card area */}
        <View style={styles.cardContainer}>
          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.loadingColor} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Loading images...</Text>
            </View>
          )}

          {!isLoading && !currentImage && (
            <View style={styles.centered}>
              <Text style={[styles.loadingText, { color: theme.text }]}>
                {images.length === 0
                  ? 'Image endpoint not yet available.\nCheck back soon!'
                  : 'Loading next batch...'}
              </Text>
            </View>
          )}

          {!isLoading && currentImage && (
            <SwipeCard
              key={currentImage.id ?? currentIndex}
              image={currentImage}
              onSwipe={handleSwipe}
              theme={theme}
            />
          )}
        </View>

        {/* Footer controls */}
        <View style={styles.footer}>
          <Text style={[styles.hint, { color: theme.subText }]}>
            Swipe left to discard  •  Swipe right to keep
          </Text>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleUndo}
              disabled={currentIndex === 0}
              style={[
                styles.controlBtn,
                {
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  borderRadius: theme.borderRadius,
                  opacity: currentIndex === 0 ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[styles.controlBtnText, { color: theme.buttonText }]}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={[
                styles.controlBtn,
                {
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                  borderRadius: theme.borderRadius,
                },
              ]}
            >
              <Text style={[styles.controlBtnText, { color: theme.buttonText }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  iconBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 10,
  },
  hint: {
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
