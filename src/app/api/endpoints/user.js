import apiClient from '../client';
import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * Fetch current user profile
 * @returns {Promise<Object>}
 * @throws {Error} 401 AUTH_UNAUTHORIZED, 404 USER_NOT_FOUND
 */
export const fetchUser = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_INFO, {
    skipErrorToast: true,
    skipAuthRedirect: true,
  });
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
  const response = await mutatingClient.patch(
    API_CONFIG.ENDPOINTS.USER_INFO,
    updates
  );
  return response.data.data;
};

/**
 * Fetch user settings
 * @returns {Promise<Object>} Settings with userId, notificationEnabled, interviewResumeDefaultsEnabled
 * @throws {Error} 401 AUTH_UNAUTHORIZED, 404 USER_SETTINGS_NOT_FOUND
 */
export const fetchUserSettings = async () => {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_SETTINGS, {
      skipErrorToast: true,
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        notificationEnabled: true,
        interviewResumeDefaultsEnabled: false,
      };
    }
    throw error;
  }
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
  const response = await mutatingClient.patch(
    API_CONFIG.ENDPOINTS.USER_SETTINGS,
    settings
  );
  return response.data.data;
};
