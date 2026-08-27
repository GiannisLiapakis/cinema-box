import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const token = await AsyncStorage.getItem('cinema_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}
