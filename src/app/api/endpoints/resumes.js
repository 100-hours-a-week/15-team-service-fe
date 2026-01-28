import apiClient from '../client';
import { API_CONFIG } from '../config';

export const fetchResumes = async ({ page = 0, size = 10 } = {}) => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.RESUMES, {
    params: { page, size },
  });
  return response.data.data;
};

export const createResume = async (request) => {
  const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESUMES, request);
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
  await apiClient.patch(API_CONFIG.ENDPOINTS.RESUME_RENAME(resumeId), { name });
};

export const saveResumeVersion = async (resumeId, versionNo) => {
  await apiClient.post(API_CONFIG.ENDPOINTS.RESUME_VERSION(resumeId, versionNo));
};

export const deleteResume = async (resumeId) => {
  await apiClient.delete(API_CONFIG.ENDPOINTS.RESUME_BY_ID(resumeId));
};
