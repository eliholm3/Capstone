import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const { token } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);

  const loadDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setDatasets(data);
    } catch (e) {
      console.error('Failed to load datasets', e);
    }
  };

  const createDataset = async (name, searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, search_term: searchTerm, total_images: 20 }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const newDataset = await response.json();
      setDatasets((prev) => [newDataset, ...prev]);
      setActiveDataset(newDataset);
      return newDataset;
    } catch (e) {
      console.error('Failed to create dataset', e);
      return null;
    }
  };

  const deleteDataset = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      setDatasets((prev) => prev.filter((ds) => ds.dataset_id !== id));
      if (activeDataset?.dataset_id === id) {
        setActiveDataset(null);
      }
    } catch (e) {
      console.error('Failed to delete dataset', e);
    }
  };

  return (
    <DatasetContext.Provider
      value={{ datasets, activeDataset, setActiveDataset, loadDatasets, createDataset, deleteDataset }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDatasets() {
  return useContext(DatasetContext);
}
