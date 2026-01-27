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
 * @param {string | null} cursor - Cursor value (timestamp|messageId format)
 * @param {number} size - Page size (default: 20)
 * @returns {Promise<{chats: Array, before: string | null, next: string | null}>}
 * @throws {Error} 401 if not authenticated, 400 if invalid cursor/size
 */
export const fetchChatMessages = async (chatroomId, cursor = null, size = 20) => {
  const params = { size };
  if (cursor) {
    params.after = cursor;
  }

  const response = await apiClient.get(API_CONFIG.ENDPOINTS.CHAT_MESSAGES(chatroomId), {
    params,
  });
  return response.data.data;
};

/**
 * Send a message to a chatroom
 * TODO: Implement after POST API spec is provided
 * @param {number} chatroomId - Chatroom ID
 * @param {object} payload - Message payload (text, files, etc.)
 * @returns {Promise<object>} Created message object
 */
export const sendChatMessage = async (chatroomId, payload) => {
  // TODO: Implement after POST /chats/{chatroomId} spec is provided
  throw new Error('POST /chats/{chatroomId} API spec not yet provided');
};
