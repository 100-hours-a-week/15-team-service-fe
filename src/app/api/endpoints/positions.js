import apiClient from '../client';
import { API_CONFIG } from '../config';

export const fetchPositions = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.POSITIONS);
  return response.data.data;
};
