import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { useDatasets } from '../context/DatasetContext';
import { themes } from '../theme';

const t = themes.default;

export default function DatasetsScreen({ navigation }) {
  const { datasets, activeDataset, setActiveDataset, loadDatasets, createDataset, deleteDataset } =
    useDatasets();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchTermRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadDatasets();
    }, [])
  );

  const handleSelectDataset = (ds) => {
    setActiveDataset(ds);
    navigation.navigate('Swipe');
  };

  const handleCreate = async () => {
    if (!newDatasetName.trim() || !searchTerm.trim()) return;
    setIsCreating(true);
    const newDs = await createDataset(newDatasetName.trim(), searchTerm.trim());
    setIsCreating(false);
    if (newDs) {
      setNewDatasetName('');
      setSearchTerm('');
      setIsFormVisible(false);
      navigation.navigate('Swipe');
    }
  };

  const handleDelete = (ds) => {
    Alert.alert(
      'Delete Dataset',
      `Delete "${ds.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDataset(ds.dataset_id),
        },
      ],
    );
  };

  const renderDataset = ({ item: ds }) => {
    const isActive = activeDataset?.dataset_id === ds.dataset_id;

    return (
      <TouchableOpacity
        onPress={() => handleSelectDataset(ds)}
        activeOpacity={0.75}
        style={[
          styles.card,
          { backgroundColor: t.cardBg, borderColor: t.border },
          isActive && styles.cardActive,
        ]}
      >
        {/* Active left accent bar */}
        {isActive && <View style={styles.accentBar} />}

        {/* Thumbnail */}
        <View style={styles.thumb}>
          {ds.recent_image ? (
            <Image
              source={{ uri: ds.recent_image }}
              style={styles.thumbImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: t.buttonBg }]}>
              <Ionicons name="image-outline" size={22} color={t.mutedText} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.dsName, { color: t.text }]} numberOfLines={1}>
            {ds.name}
          </Text>
          <View style={styles.counts}>
            <View style={[styles.countPill, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Text style={[styles.countText, { color: t.keepColor }]}>
                ✓ {parseInt(ds.approved_count, 10) || 0}
              </Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Text style={[styles.countText, { color: t.discardColor }]}>
                ✗ {parseInt(ds.rejected_count, 10) || 0}
              </Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: t.buttonBg }]}>
              <Text style={[styles.countText, { color: t.mutedText }]}>
                ○ {parseInt(ds.pending_count, 10) || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          onPress={() => handleDelete(ds)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color={t.mutedText} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <FlatList
          data={datasets}
          keyExtractor={(ds) => String(ds.dataset_id)}
          renderItem={renderDataset}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: t.mutedText }]}>
              No datasets yet. Create your first one below.
            </Text>
          }
        />

        {/* Inline create form */}
        <View style={[styles.formArea, { borderTopColor: t.border }]}>
          {isFormVisible ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText },
                ]}
                value={newDatasetName}
                onChangeText={setNewDatasetName}
                placeholder="Dataset name"
                placeholderTextColor={t.inputPlaceholder}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => searchTermRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                ref={searchTermRef}
                style={[
                  styles.input,
                  { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.inputText },
                ]}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search term (e.g. Birds)"
                placeholderTextColor={t.inputPlaceholder}
                returnKeyType="go"
                onSubmitEditing={handleCreate}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setIsFormVisible(false);
                    setNewDatasetName('');
                    setSearchTerm('');
                  }}
                  style={[styles.btn, styles.cancelBtn, { backgroundColor: t.buttonBg, borderColor: t.buttonBorder }]}
                >
                  <Text style={[styles.btnText, { color: t.buttonText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={isCreating || !newDatasetName.trim() || !searchTerm.trim()}
                  style={[
                    styles.btn,
                    styles.createBtn,
                    { backgroundColor: t.accentBg },
                    (isCreating || !newDatasetName.trim() || !searchTerm.trim()) && { opacity: 0.5 },
                  ]}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={t.accentText} />
                  ) : (
                    <Text style={[styles.btnText, { color: t.accentText }]}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setIsFormVisible(true)}
              style={[styles.btn, styles.newBtn, { backgroundColor: t.accentBg }]}
            >
              <Ionicons name="add" size={18} color={t.accentText} />
              <Text style={[styles.btnText, { color: t.accentText }]}>New Dataset</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },

  // Dataset card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 72,
  },
  cardActive: {
    borderColor: '#fafafa',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: '#fafafa',
  },
  thumb: {
    width: 56,
    height: 72,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  dsName: {
    fontSize: 14,
    fontWeight: '600',
  },
  counts: {
    flexDirection: 'row',
    gap: 6,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },

  // Form area
  formArea: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flex: 1,
    borderWidth: 0,
  },
  cancelBtn: {
    flex: 1,
  },
  newBtn: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 6,
    borderWidth: 0,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
