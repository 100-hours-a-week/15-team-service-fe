/**
 * User API Endpoints
 * Handles user profile and settings management
 *
 * Implementation Notes:
 * - All endpoints require ROLE_ACTIVE authentication (HttpOnly cookies)
 * - User profile syncs with React Query cache after updates
 * - User settings are separate from profile (notification, interview defaults)
 */

import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * Fetch current user profile
 * @returns {Promise<Object>} User profile with id, profileImageUrl, name, positionId, phone
 * @throws {Error} 401 AUTH_UNAUTHORIZED, 404 USER_NOT_FOUND
 */
export const fetchUser = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_INFO);
  return response.data.data;
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @param {string} updates.name - User name (2~10 chars, no spaces/emoji, required)
 * @param {number} updates.positionId - Position ID (required)
 * @param {string|null} [updates.profileImageUrl] - Profile image URL (optional, null to delete)
 * @param {string|null} [updates.phone] - Phone number without dashes (optional, null to delete)
 * @param {boolean} updates.privacyAgreed - Privacy agreement (required, must be true)
 * @param {boolean} [updates.phonePolicyAgreed] - Phone policy agreement (required if phone exists)
 * @returns {Promise<Object>} Updated user profile
 * @throws {Error} 400 (validation), 401, 404
 */
export const updateUser = async (updates) => {
  const response = await apiClient.patch(
    API_CONFIG.ENDPOINTS.USER_INFO,
    updates,
  );
  return response.data.data;
};

/**
 * Fetch user settings
 * @returns {Promise<Object>} Settings with userId, notificationEnabled, interviewResumeDefaultsEnabled
 * @throws {Error} 401 AUTH_UNAUTHORIZED, 404 USER_SETTINGS_NOT_FOUND
 */
export const fetchUserSettings = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_SETTINGS);
  return response.data.data;
};

/**
 * Update user settings
 * @param {Object} settings - Settings to update
 * @param {boolean} [settings.notificationEnabled] - Notification setting (optional)
 * @param {boolean} [settings.interviewResumeDefaultsEnabled] - Interview resume defaults (optional)
 * @returns {Promise<Object>} Updated settings
 * @throws {Error} 401 AUTH_UNAUTHORIZED, 404 USER_SETTINGS_NOT_FOUND
 */
export const updateUserSettings = async (settings) => {
  const response = await apiClient.patch(
    API_CONFIG.ENDPOINTS.USER_SETTINGS,
    settings,
  );
  return response.data.data;
};
