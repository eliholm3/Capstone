import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useDatasets } from '../context/DatasetContext';
import { API_BASE_URL } from '../config';
import { themes } from '../theme';
import SwipeCard from '../components/SwipeCard';
import BufferStrip from '../components/BufferStrip';
import StatsBar from '../components/StatsBar';

const FETCH_TRIGGER_THRESHOLD = 5;
const t = themes.default;

export default function SwipeScreen() {
  const { token } = useAuth();
  const { activeDataset } = useDatasets();

  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [discardedImages, setDiscardedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const isFetchingRef = useRef(false);
  const cursorRef = useRef(0);
  const retryTimerRef = useRef(null);

  // Reset buffer whenever the active dataset changes
  useEffect(() => {
    setImages([]);
    setKeptImages([]);
    setDiscardedImages([]);
    setCurrentIndex(0);
    cursorRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (activeDataset) {
      fetchImages(activeDataset.dataset_id).then((data) => setImages(data));
    }
  }, [activeDataset?.dataset_id]);

  const fetchImages = async (datasetId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/datasets/${datasetId}/images?after=${cursorRef.current}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.length > 0) {
        const maxId = Math.max(...data.map((img) => img.image_id));
        cursorRef.current = maxId;
      }
      return data;
    } catch (e) {
      console.error('Fetch error:', e);
      return [];
    }
  };

  const doFetch = (datasetId) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsFetching(true);

    fetchImages(datasetId).then((newData) => {
      if (newData.length > 0) {
        setImages((prev) => {
          const existingIds = new Set(prev.map((img) => img.image_id));
          const unique = newData.filter((img) => !existingIds.has(img.image_id));
          return unique.length > 0 ? [...prev, ...unique] : prev;
        });
      }
      setIsFetching(false);
      isFetchingRef.current = false;
    });
  };

  // Background refill when buffer runs low
  useEffect(() => {
    const remaining = images.length - currentIndex;

    if (
      activeDataset &&
      remaining <= FETCH_TRIGGER_THRESHOLD &&
      !isFetchingRef.current &&
      images.length > 0
    ) {
      doFetch(activeDataset.dataset_id);
    }
  }, [currentIndex, images.length, activeDataset]);

  // Poll for server refill when all local images are exhausted
  useEffect(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    const remaining = images.length - currentIndex;
    if (
      activeDataset &&
      remaining === 0 &&
      images.length > 0 &&
      !isFetchingRef.current
    ) {
      retryTimerRef.current = setTimeout(() => {
        doFetch(activeDataset.dataset_id);
      }, 3000);
    }

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [currentIndex, images.length, activeDataset]);

  const handleSwipe = async (image_id, direction) => {
    if (!activeDataset) return;

    const status = direction === 'right' ? 'approved' : 'rejected';

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/datasets/${activeDataset.dataset_id}/images/${image_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        if (status === 'approved') {
          setKeptImages((prev) => [...prev, currentImage]);
        } else {
          setDiscardedImages((prev) => [...prev, currentImage]);
        }
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Swipe failed:', err);
    }
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;
    const prevImage = images[currentIndex - 1];
    setKeptImages((prev) => prev.filter((img) => img.image_id !== prevImage.image_id));
    setDiscardedImages((prev) => prev.filter((img) => img.image_id !== prevImage.image_id));
    setCurrentIndex((prev) => prev - 1);
  };

  const getBufferImages = () => {
    const startIdx = Math.max(0, currentIndex - 2);
    const endIdx = Math.min(images.length, currentIndex + 5);
    const result = [];
    for (let i = startIdx; i < endIdx; i++) {
      const img = images[i];
      const status =
        i < currentIndex
          ? keptImages.find((k) => k.image_id === img.image_id)
            ? 'kept'
            : 'discarded'
          : null;
      result.push({ ...img, isCurrent: i === currentIndex, status });
    }
    return result;
  };

  const currentImage = images[currentIndex];
  const bufferImages = getBufferImages();

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.appShell}>

          {/* Active dataset subtitle */}
          {activeDataset ? (
            <Text style={[styles.subtitle, { color: t.mutedText }]}>
              {activeDataset.name}
            </Text>
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: t.mutedText }]}>
                Select a dataset from the Datasets tab to begin.
              </Text>
            </View>
          )}

          {activeDataset && (
            <>
              <StatsBar
                kept={keptImages.length}
                discarded={discardedImages.length}
                inBuffer={images.length - currentIndex}
                isFetching={isFetching}
                theme={t}
              />

              {bufferImages.length > 0 && (
                <BufferStrip bufferImages={bufferImages} theme={t} />
              )}

              <View style={styles.cardContainer}>
                {currentImage ? (
                  <SwipeCard
                    key={currentImage.image_id}
                    image={currentImage}
                    onSwipe={handleSwipe}
                    theme={t}
                  />
                ) : (
                  <View style={styles.centered}>
                    <Text style={[styles.emptyText, { color: t.mutedText }]}>
                      All images reviewed.
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: t.border }]}>
                <Text style={[styles.hint, { color: t.mutedText }]}>
                  Swipe left to discard / right to keep
                </Text>
                <TouchableOpacity
                  onPress={handleUndo}
                  disabled={currentIndex === 0}
                  style={[
                    styles.btn,
                    {
                      backgroundColor: t.buttonBg,
                      borderColor: t.buttonBorder,
                      opacity: currentIndex === 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.btnText, { color: t.buttonText }]}>Undo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
  },
  hint: { fontSize: 13 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  btnText: { fontSize: 13, fontWeight: '500' },
});
