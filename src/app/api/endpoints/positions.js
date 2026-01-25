import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * Fetch all available positions
 * @returns {Promise<Array<{id: number, name: string}>>} - List of positions
 */
export const fetchPositions = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.POSITIONS);
  return response.data.data;
};
