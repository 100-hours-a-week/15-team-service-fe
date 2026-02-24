import apiClient from '../client';
import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * Fetch interview types
 * @returns {Promise<Object>} - Available interview types
 */
export const fetchInterviewTypes = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.INTERVIEW_TYPES);
  return response.data;
};

/**
 * Fetch interviews with optional filters
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Interview list
 */
export const fetchInterviews = async (params = {}) => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.INTERVIEWS, {
    params,
  });
  return response.data;
};

/**
 * Fetch interview by ID
 * @param {string} id - Interview ID
 * @returns {Promise<Object>} - Interview data with messages and feedback
 */
export const fetchInterviewById = async (id) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.INTERVIEW_BY_ID(id)
  );
  return response.data;
};

/**
 * Create new interview session
 * @param {Object} payload - Interview configuration
 * @param {string} payload.interviewType - Interview type (TECHNICAL, BEHAVIORAL)
 * @param {number} payload.positionId - Position ID
 * @param {number} payload.companyId - Company ID (optional)
 * @param {number} payload.resumeVersionId - Resume version ID (optional)
 * @returns {Promise<Object>} - Created interview with aiSessionId
 */
export const startInterview = async (payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEWS,
    payload
  );
  return response.data;
};

/**
 * Submit interview answer
 * @param {number} interviewId - Interview ID
 * @param {Object} payload - Answer data
 * @param {number} payload.turnNo - Turn number
 * @param {string} payload.answer - User's answer text
 * @param {string} payload.answerInputType - Input type (TEXT, AUDIO)
 * @returns {Promise<Object>} - Response
 */
export const submitInterviewAnswer = async (interviewId, payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_MESSAGES(interviewId),
    payload
  );
  return response.data;
};

/**
 * End interview session
 * @param {number} interviewId - Interview ID
 * @returns {Promise<Object>} - Response with feedback
 */
export const completeInterview = async (interviewId) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_END(interviewId)
  );
  return response.data;
};

/**
 * Delete interview record
 * @param {string} id - Interview ID
 */
export const deleteInterview = async (id) => {
  await mutatingClient.delete(API_CONFIG.ENDPOINTS.INTERVIEW_BY_ID(id));
};

/**
 * Rename interview
 * @param {string} id - Interview ID
 * @param {string} name - New name
 * @returns {Promise<Object>} - Updated interview
 */
export const renameInterview = async (id, name) => {
  const response = await apiClient.patch(
    API_CONFIG.ENDPOINTS.INTERVIEW_RENAME(id),
    { name }
  );
  return response.data;
};
