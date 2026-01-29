import apiClient from '../client';
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
  return response.data;
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
  return response.data;
};

/**
 * Start new interview session
 * @param {Object} payload - Interview configuration
 * @param {string} payload.resumeId - Resume ID
 * @param {string} payload.jobCategory - Job category (백엔드, 프론트엔드, etc.)
 * @param {string} payload.difficulty - Difficulty level (신입, 주니어, etc.)
 * @param {Array<string>} payload.techStacks - Selected tech stacks
 * @param {number} payload.questionCount - Number of questions (5-10)
 * @returns {Promise<Object>} - Session data with first question
 */
export const startInterview = async (payload) => {
  const response = await apiClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_SESSION,
    payload
  );
  return response.data;
};

/**
 * Submit interview answer
 * @param {string} sessionId - Session ID
 * @param {Object} payload - Answer data
 * @param {string} payload.answer - User's answer text
 * @param {File} payload.audioFile - Audio recording file (optional)
 * @returns {Promise<Object>} - Next question or completion status
 */
export const submitInterviewAnswer = async (sessionId, payload) => {
  const response = await apiClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_SUBMIT_ANSWER(sessionId),
    payload
  );
  return response.data;
};

/**
 * Complete interview session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Completed interview with evaluation
 */
export const completeInterview = async (sessionId) => {
  const response = await apiClient.post(
    API_CONFIG.ENDPOINTS.INTERVIEW_COMPLETE(sessionId)
  );
  return response.data;
};

/**
 * Delete interview record
 * @param {string} id - Interview ID
 */
export const deleteInterview = async (id) => {
  await apiClient.delete(API_CONFIG.ENDPOINTS.INTERVIEW_BY_ID(id));
};
