import type { VocabularyItem } from "@/lib/types";

const API_BASE = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return { 'Content-Type': 'application/json' };
};

export const getVocabulary = async (): Promise<VocabularyItem[]> => {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/vocabulary`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Vocabulary API error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.vocabulary || [];
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    return [];
  }
};

export const addVocabularyItem = async (
  item: Omit<VocabularyItem, "id" | "createdAt">
): Promise<VocabularyItem | null> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ item }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.vocabulary;
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    return null;
  }
};

export const addManyVocabularyItems = async (
  items: Omit<VocabularyItem, "id" | "createdAt">[]
): Promise<VocabularyItem[]> => {
  try {
    // For now, add items one by one
    // TODO: Create batch API endpoint
    const results = [];
    for (const item of items) {
      const result = await addVocabularyItem(item);
      if (result) {
        results.push(result);
      }
    }
    return results;
  } catch (error) {
    console.error('Error adding vocabulary items:', error);
    return [];
  }
};

export const updateVocabularyItem = async (
  id: string,
  updates: Partial<Omit<VocabularyItem, "id" | "createdAt">>
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ updates }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    return false;
  }
};

export const deleteVocabularyItem = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    return false;
  }
};

export const deleteVocabularyByFolder = async (
  folderName: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary/folder/${encodeURIComponent(folderName)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting vocabulary by folder:', error);
    return false;
  }
};

export const updateVocabularyFolder = async (
  oldFolderName: string,
  newFolderName: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary/folder`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldFolderName, newFolderName }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating vocabulary folder:', error);
    return false;
  }
};

export const clearVocabulary = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/vocabulary/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error clearing vocabulary:', error);
    return false;
  }
};
