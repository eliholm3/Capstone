import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { themes } from '../theme';
import SwipeCard from '../components/SwipeCard';
import BufferStrip from '../components/BufferStrip';
import StatsBar from '../components/StatsBar';

const FETCH_TRIGGER_THRESHOLD = 5;

export default function SwipeScreen() {
  const { token, username, logout } = useAuth();

  // Original State
  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [discardedImages, setDiscardedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [themeName, setThemeName] = useState('default');

  // New Dataset Management State
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const isFetchingRef = useRef(false);
  const theme = themes[themeName] || themes.default;

  // 1. Initial Load: Theme and Datasets
  useEffect(() => {
    AsyncStorage.getItem('theme').then(saved => {
      if (saved && themes[saved]) setThemeName(saved);
    });
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
        
        // Only advance the index if the DB successfully saved the status
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

  const toggleTheme = () => {
    const next = themeName === 'default' ? 'developer' : 'default';
    setThemeName(next);
    AsyncStorage.setItem('theme', next);
  };

  // Buffer Helper
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
    <LinearGradient colors={theme.bgColors} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        
        {/* Top bar - Modified to include Selector */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={logout} style={[styles.iconBtn, { backgroundColor: theme.buttonBg, borderColor: theme.buttonBorder, borderRadius: theme.borderRadius }]}>
            <Text style={[styles.iconBtnText, { color: theme.buttonText }]}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.selectorTrigger}>
            <Text style={[styles.selectorText, { color: theme.text }]}>
              {activeDataset ? `📁 ${activeDataset.name}` : 'Select Category'} ▼
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.buttonBg, borderColor: theme.buttonBorder, borderRadius: theme.borderRadius }]}>
            <Text style={[styles.iconBtnText, { color: theme.buttonText }]}>
              {themeName === 'default' ? 'Dev' : 'Color'}
            </Text>
          </TouchableOpacity>
        </View>

        <StatsBar kept={keptImages.length} discarded={discardedImages.length} inBuffer={images.length - currentIndex} isFetching={isFetching} theme={theme} />

        {!isLoading && bufferImages.length > 0 && (
          <BufferStrip bufferImages={bufferImages} theme={theme} />
        )}

        <View style={styles.cardContainer}>
          {isLoading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={theme.loadingColor} /></View>
          ) : currentImage ? (
            <SwipeCard key={currentImage.image_id} image={currentImage} onSwipe={handleSwipe} theme={theme} />
          ) : (
            <View style={styles.centered}>
              <Text style={[styles.loadingText, { color: theme.text }]}>
                {activeDataset ? "All images reviewed!" : "Create a category to begin."}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.hint, { color: theme.subText }]}>Swipe left to discard • Swipe right to keep</Text>
          <View style={styles.controls}>
            <TouchableOpacity onPress={handleUndo} disabled={currentIndex === 0} style={[styles.controlBtn, { backgroundColor: theme.buttonBg, borderRadius: theme.borderRadius, opacity: currentIndex === 0 ? 0.4 : 1 }]}>
              <Text style={{ color: theme.buttonText }}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={[styles.controlBtn, { backgroundColor: theme.buttonBg, borderRadius: theme.borderRadius }]}>
              <Text style={{ color: theme.buttonText }}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal - Moved outside of cardContainer to prevent layout issues */}
        <Modal visible={isModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Datasets</Text>
              <ScrollView style={{ maxHeight: 150 }}>
                {datasets.map(ds => (
                  <TouchableOpacity key={ds.dataset_id} onPress={() => { selectDataset(ds); setIsModalVisible(false); }} style={styles.dsItem}>
                    <Text style={styles.dsItemText}>{ds.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.divider} />
              <TextInput style={styles.input} value={newDatasetName} onChangeText={setNewDatasetName} placeholder="New Category Name" placeholderTextColor="#999" />
              <TextInput style={styles.input} value={searchTerm} onChangeText={setSearchTerm} placeholder="Wikimedia Search (e.g. Birds)" placeholderTextColor="#999" />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={createDataset} style={styles.createBtn}><Text style={{ color: '#fff' }}>Create</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  selectorTrigger: { padding: 8 },
  selectorText: { fontSize: 16, fontWeight: '700' },
  iconBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  iconBtnText: { fontSize: 13, fontWeight: '600' },
  cardContainer: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 16, marginVertical: 12, justifyContent: 'center' },
  centered: { alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center', gap: 10 },
  hint: { fontSize: 13 },
  controls: { flexDirection: 'row', gap: 12 },
  controlBtn: { paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  dsItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dsItemText: { fontSize: 16, color: '#4A90E2' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 10 },
  cancelText: { color: '#666', fontSize: 16 },
  createBtn: { backgroundColor: '#4A90E2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});