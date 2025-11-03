import type { Folder } from "@/lib/types";

const API_BASE = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  return { 'Content-Type': 'application/json' };
};

export const getFolders = async (): Promise<Folder[]> => {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Folders API error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.folders || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};

export const createFolder = async (name: string, parentId?: string | null): Promise<Folder | null> => {
  try {
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, parentId }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.folder;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
};

export const updateFolder = async (id: string, name: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/folders/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating folder:', error);
    return false;
  }
};

export const deleteFolder = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/folders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error deleting folder:', response.status, errorData);
      throw new Error(errorData.error || `Failed to delete folder: ${response.statusText}`);
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    throw error; // Re-throw to allow context to handle it
  }
};
