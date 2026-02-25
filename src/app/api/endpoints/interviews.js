import apiClient from '../client';
import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * Fetch interviews with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.page - Page number (optional)
 * @param {number} params.limit - Items per page (optional)
 * @returns {Promise<Object>} - Paginated interview list
 */
export const fetchInterviews = async (params = {}) => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.INTERVIEWS, {
    params,
  });
  return response.data.data;
};

/**
 * Fetch interview by ID
 * @param {string} id - Interview ID
 * @returns {Promise<Object>} - Interview data with Q&A and evaluation
 */
export const fetchInterviewById = async (id) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.INTERVIEW_BY_ID(id)
  );
  return response.data.data;
};

/**
 * Fetch interview messages by ID
 * @param {string} id - Interview ID
 * @returns {Promise<Object>} - Interview messages
 */
export const fetchInterviewMessages = async (id) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.INTERVIEW_MESSAGES(id)
  );
  return response.data.data;
};

/**
 * Rename interview
 * @param {string} id - Interview ID
 * @param {string} name - New name
 */
export const renameInterview = async (id, name) => {
  const response = await mutatingClient.patch(
    API_CONFIG.ENDPOINTS.INTERVIEW_RENAME(id),
    { name }
  );
  return response.data.data;
};

/**
 * Start new interview session
 * @param {Object} payload - Interview configuration
 * @returns {Promise<Object>} - Interview start data
 */
export const startInterview = async (payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_CREATE,
    payload
  );
  return response.data.data;
};

/**
 * Submit interview answer
 * @param {string} interviewId - Interview ID
 * @param {Object} payload - Answer data
 * @param {number} payload.turnNo - Current turn number
 * @param {string} payload.answer - User's answer text
 * @param {string} payload.answerInputType - "TEXT" or "AUDIO"
 * @param {string | null} payload.audioUrl - Audio URL if provided
 * @returns {Promise<Object>} - Next question or completion status
 */
export const submitInterviewAnswer = async (interviewId, payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_SUBMIT_ANSWER(interviewId),
    payload
  );
  return response.data.data;
};

/**
 * Complete interview session
 * @param {string} interviewId - Interview ID
 * @returns {Promise<Object>} - Completed interview with evaluation
 */
export const completeInterview = async (interviewId) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_COMPLETE(interviewId)
  );
  return response.data.data;
};

/**
 * Delete interview record
 * @param {string} id - Interview ID
 */
export const deleteInterview = async (id) => {
  await mutatingClient.delete(API_CONFIG.ENDPOINTS.INTERVIEW_BY_ID(id));
};
