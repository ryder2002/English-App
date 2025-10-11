import type { Folder } from "@/lib/types";

const API_BASE = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const getFolders = async (): Promise<Folder[]> => {
  try {
    const headers = getAuthHeaders();
    console.log('Getting folders with headers:', headers);
    
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      console.error('Folders API error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Folders response:', data);
    return data.folders || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};

export const createFolder = async (name: string): Promise<Folder | null> => {
  try {
    const response = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
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
      body: JSON.stringify({ name })
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
      headers: getAuthHeaders()
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
};
