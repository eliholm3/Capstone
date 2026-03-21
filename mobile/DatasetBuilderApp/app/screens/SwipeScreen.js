import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { themes } from '../theme';
import SwipeCard from '../components/SwipeCard';
import BufferStrip from '../components/BufferStrip';
import StatsBar from '../components/StatsBar';

const FETCH_TRIGGER_THRESHOLD = 5;
const t = themes.default;

export default function SwipeScreen() {
  const { token, username, logout } = useAuth();

  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [discardedImages, setDiscardedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isFetchingRef = useRef(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDatasets(data);
      if (data.length > 0 && !activeDataset) {
        selectDataset(data[0]);
      }
    } catch (e) {
      console.error('Failed to load datasets', e);
    }
  };

  const selectDataset = async (dataset) => {
    setActiveDataset(dataset);
    setImages([]);
    setCurrentIndex(0);
    setKeptImages([]);
    setDiscardedImages([]);
    const data = await fetchImages(dataset.dataset_id);
    setImages(data);
  };

  const createDataset = async () => {
    if (!newDatasetName || !searchTerm) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDatasetName,
          search_term: searchTerm,
          total_images: 20,
        }),
      });
      const newDS = await response.json();
      setDatasets(prev => [newDS, ...prev]);
      selectDataset(newDS);
      setIsModalVisible(false);
      setNewDatasetName('');
      setSearchTerm('');
    } catch (e) {
      console.error('Creation error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImages = async (datasetId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      console.error("Fetch error:", e);
      return [];
    }
  };

  useEffect(() => {
    const remaining = images.length - currentIndex;

    if (activeDataset && remaining <= FETCH_TRIGGER_THRESHOLD && !isFetchingRef.current && images.length > 0) {
      isFetchingRef.current = true;
      setIsFetching(true);

      fetchImages(activeDataset.dataset_id).then((newData) => {
        setImages(prev => {
          const existingIds = new Set(prev.map(img => img.image_id));
          const unique = newData.filter(img => !existingIds.has(img.image_id));
          return [...prev, ...unique];
        });
        setIsFetching(false);
        isFetchingRef.current = false;
      });
    }
  }, [currentIndex, images.length, activeDataset]);

  const handleSwipe = async (image_id, direction) => {
    if (!activeDataset) return;

    const status = direction === 'right' ? 'approved' : 'rejected';

    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${activeDataset.dataset_id}/images/${image_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        if (status === 'approved') {
          setKeptImages(prev => [...prev, currentImage]);
        } else {
          setDiscardedImages(prev => [...prev, currentImage]);
        }

        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Swipe failed:', err);
    }
  };

  const handleUndo = () => {
    if (currentIndex === 0) return;
    setCurrentIndex(prev => prev - 1);
  };

  const handleReset = () => {
    if (activeDataset) selectDataset(activeDataset);
  };

  const getBufferImages = () => {
    const startIdx = Math.max(0, currentIndex - 2);
    const endIdx = Math.min(images.length, currentIndex + 5);
    const result = [];
    for (let i = startIdx; i < endIdx; i++) {
      const img = images[i];
      const status = i < currentIndex ? (keptImages.find(k => k.image_id === img.image_id) ? 'kept' : 'discarded') : null;
      result.push({ ...img, isCurrent: i === currentIndex, status });
    }
    return result;
  };

  const currentImage = images[currentIndex];
  const bufferImages = getBufferImages();

  return (
    <View style={[styles.screen, { backgroundColor: t.bg }]}>
      <SafeAreaView style={styles.safe}>
       <View style={styles.appShell}>

        {/* Top bar */}
        <View style={[styles.topBar, { borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={logout} style={[styles.btn, { backgroundColor: t.buttonBg, borderColor: t.buttonBorder }]}>
            <Text style={[styles.btnText, { color: t.buttonText }]}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.selectorTrigger}>
            <Text style={[styles.selectorText, { color: t.text }]}>
              {activeDataset ? activeDataset.name : 'Select Dataset'}
            </Text>
            <Text style={{ color: t.mutedText, fontSize: 12 }}> ▼</Text>
          </TouchableOpacity>

          <View style={{ width: 60 }} />
        </View>

        <StatsBar kept={keptImages.length} discarded={discardedImages.length} inBuffer={images.length - currentIndex} isFetching={isFetching} theme={t} />

        {!isLoading && bufferImages.length > 0 && (
          <BufferStrip bufferImages={bufferImages} theme={t} />
        )}

        <View style={styles.cardContainer}>
          {isLoading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={t.loadingColor} /></View>
          ) : currentImage ? (
            <SwipeCard key={currentImage.image_id} image={currentImage} onSwipe={handleSwipe} theme={t} />
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: t.mutedText }]}>
                {activeDataset ? "All images reviewed." : "Create a dataset to begin."}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: t.border }]}>
          <Text style={[styles.hint, { color: t.mutedText }]}>Swipe left to discard / right to keep</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleUndo}
              disabled={currentIndex === 0}
              style={[styles.btn, { backgroundColor: t.buttonBg, borderColor: t.buttonBorder, opacity: currentIndex === 0 ? 0.4 : 1 }]}
            >
              <Text style={[styles.btnText, { color: t.buttonText }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReset}
              style={[styles.btn, { backgroundColor: t.buttonBg, borderColor: t.buttonBorder }]}
            >
              <Text style={[styles.btnText, { color: t.buttonText }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

       </View>

        {/* Modal */}
        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: t.cardBg, borderColor: t.border }]}>
              <Text style={[styles.modalTitle, { color: t.text }]}>Datasets</Text>
              <ScrollView style={{ maxHeight: 150 }}>
                {datasets.map(ds => (
                  <TouchableOpacity
                    key={ds.dataset_id}
                    onPress={() => { selectDataset(ds); setIsModalVisible(false); }}
                    style={[styles.dsItem, { borderBottomColor: t.border }]}
                  >
                    <Text style={[styles.dsItemText, { color: t.text }]}>{ds.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <TextInput
                style={[styles.modalInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText }]}
                value={newDatasetName}
                onChangeText={setNewDatasetName}
                placeholder="Dataset name"
                placeholderTextColor={t.inputPlaceholder}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText }]}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search term (e.g. Birds)"
                placeholderTextColor={t.inputPlaceholder}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Text style={[styles.btnText, { color: t.mutedText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={createDataset} style={[styles.createBtn, { backgroundColor: t.accentBg }]}>
                  <Text style={{ color: t.accentText, fontWeight: '600', fontSize: 14 }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: { fontSize: 15, fontWeight: '600' },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  btnText: { fontSize: 13, fontWeight: '500' },
  cardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
  },
  centered: { alignItems: 'center', gap: 12 },
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
  controls: { flexDirection: 'row', gap: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 8, borderWidth: 1, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  dsItem: { paddingVertical: 12, borderBottomWidth: 1 },
  dsItemText: { fontSize: 14 },
  divider: { height: 1, marginVertical: 16 },
  modalInput: { borderRadius: 6, borderWidth: 1, padding: 12, marginBottom: 10, fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 8 },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
});
