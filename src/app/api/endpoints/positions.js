/**
 * Positions API Endpoints
 * Fetches available position options from backend
 *
 * Implementation Notes:
 * - Positions data is relatively static and should be cached aggressively
 * - Backend returns positions with id and name for database normalization
 * - Frontend stores positionId in user profile instead of position name string
 */

import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * Fetch all available positions
 * @returns {Promise<Array<{id: number, name: string}>>} - List of positions
 * @example
 * // Response structure:
 * // { code: 200, message: "success", data: [{ id: 1, name: "백엔드" }, { id: 2, name: "프론트엔드" }, ...] }
 */
export const fetchPositions = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.POSITIONS);
  return response.data.data; // Extract positions array from ApiResponse wrapper
};
