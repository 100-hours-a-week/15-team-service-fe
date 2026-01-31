import apiClient from '../client';
import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * Get GitHub OAuth login URL
 * @returns {Promise<{loginUrl: string}>} - GitHub OAuth URL
 */
export const getGithubLoginUrl = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.GITHUB_LOGIN_URL);
  return response.data.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  await mutatingClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
};

/**
 * Fetch current user profile
 * @returns {Promise<Object>} - User profile data
 */
export const fetchUserProfile = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.USER_PROFILE);
  return response.data.data;
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @param {string} [updates.name] - User name (optional)
 * @param {number} [updates.positionId] - Position ID from /positions API (optional)
 * @param {string} [updates.phone] - User phone (optional)
 * @param {string} [updates.profileImage] - Profile image URL (optional)
 * @returns {Promise<Object>} - Updated user data
 */
export const updateUserProfile = async (updates) => {
  const response = await mutatingClient.patch(
    API_CONFIG.ENDPOINTS.USER_PROFILE,
    updates
  );
  return response.data.data;
};

/**
 * Complete user onboarding
 * @param {Object} payload - Onboarding data
 * @param {string} payload.profileImageUrl - Profile image URL (empty string for now)
 * @param {string} payload.name - User name (min 2 chars)
 * @param {number} payload.positionId - Position ID from /positions API
 * @param {string} [payload.phone] - Phone number without dashes (optional)
 * @param {boolean} payload.privacyAgreed - Privacy agreement (required, must be true)
 * @param {boolean} [payload.phonePolicyAgreed] - Phone policy agreement (required if phone provided)
 * @returns {Promise<{userId: number, status: string}>} - User data from backend
 * @throws {Error} - With response.data.code for specific error handling
 */
export const completeOnboarding = async (payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.ONBOARDING,
    payload
  );
  return response.data.data;
};
