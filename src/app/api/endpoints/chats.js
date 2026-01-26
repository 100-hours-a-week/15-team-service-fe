import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * Fetch all chatrooms for current user
 * Sorted by latest message timestamp (descending)
 * @returns {Promise<Array<{id: number, name: string, lastMessage: string | null, lastUpdatedAt: string | null}>>}
 * @throws {Error} 401 if not authenticated (ROLE_ACTIVE required)
 */
export const fetchChats = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.CHATS);
  return response.data.data;
};
