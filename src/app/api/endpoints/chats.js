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

/**
 * Fetch chat messages for a specific chatroom (cursor-based pagination)
 * @param {number} chatroomId - Chatroom ID
 * @param {string | null} cursor - Cursor value ("createdAt|id" format)
 * @param {number} size - Page size (default: 20, max: 49, >=50 will be clamped to 15)
 * @returns {Promise<{chats: Array, before: string | null, next: string | null}>}
 * @throws {Error} 401 if not authenticated, 400 if invalid cursor/size
 * @note Backend only accepts 'next' parameter
 * @note Response is sorted oldest → newest (reversed by backend)
 */
export const fetchChatMessages = async (
  chatroomId,
  cursor = null,
  size = 20
) => {
  const params = { size };
  if (cursor) {
    params.next = cursor;
  }

  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.CHAT_MESSAGES(chatroomId),
    {
      params,
    }
  );
  return response.data.data;
};
