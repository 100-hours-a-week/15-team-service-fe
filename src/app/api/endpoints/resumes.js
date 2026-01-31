import apiClient from '../client';
import { mutatingClient } from '../mutatingClient';
import { streamAPI } from '../streamingClient';
import { API_CONFIG } from '../config';

export const fetchResumes = async ({ page = 0, size = 10 } = {}) => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.RESUMES, {
    params: { page, size },
  });
  const data = response.data.data;
  return {
    ...data,
    content: data?.items || data?.content || [],
  };
};

export const createResume = async (request) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.RESUMES,
    request
  );
  return response.data.data;
};

export const fetchResumeById = async (resumeId) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.RESUME_BY_ID(resumeId)
  );
  return response.data.data;
};

export const fetchResumeVersion = async (resumeId, versionNo) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.RESUME_VERSION(resumeId, versionNo)
  );
  return response.data.data;
};

export const renameResume = async (resumeId, name) => {
  await mutatingClient.patch(API_CONFIG.ENDPOINTS.RESUME_RENAME(resumeId), {
    name,
  });
};

export const saveResumeVersion = async (resumeId, versionNo) => {
  await mutatingClient.post(
    API_CONFIG.ENDPOINTS.RESUME_VERSION(resumeId, versionNo)
  );
};

export const deleteResume = async (resumeId) => {
  await mutatingClient.delete(API_CONFIG.ENDPOINTS.RESUME_BY_ID(resumeId));
};

/**
 * Stream AI chat for resume editing
 * @param {string} id - Resume ID
 * @param {string} message - User message
 * @param {Object} options - Streaming options
 * @param {Function} options.onChunk - Callback for each chunk
 * @param {Function} options.onComplete - Callback on completion
 * @param {Function} options.onError - Callback on error
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 */
export const streamResumeChat = async (id, message, options) => {
  await streamAPI(
    API_CONFIG.ENDPOINTS.RESUME_AI_CHAT(id),
    { message },
    options
  );
};
