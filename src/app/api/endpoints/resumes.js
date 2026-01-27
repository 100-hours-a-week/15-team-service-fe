import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * @typedef {Object} ResumeCreateRequest
 * @property {string[]} repoUrls - GitHub repository URLs
 * @property {number} positionId - Position ID
 * @property {number} [companyId] - Company ID (optional)
 * @property {string} [name] - Resume name (optional, defaults to "새 이력서")
 */

/**
 * @typedef {Object} ResumeSummary
 * @property {number} resumeId
 * @property {string} name
 * @property {number} positionId
 * @property {string} positionName
 * @property {number} [companyId]
 * @property {string} [companyName]
 * @property {number} currentVersionNo
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ResumeDetail
 * @property {number} resumeId
 * @property {string} name
 * @property {number} positionId
 * @property {string} positionName
 * @property {number} [companyId]
 * @property {string} [companyName]
 * @property {number} currentVersionNo
 * @property {string} content - JSON string
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ResumeVersion
 * @property {number} resumeId
 * @property {number} versionNo
 * @property {'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'DRAFT'} status
 * @property {string} content - JSON string
 * @property {string} [aiTaskId]
 * @property {string} [errorLog]
 * @property {string} [startedAt]
 * @property {string} [finishedAt]
 * @property {string} [committedAt]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Fetch paginated list of resumes
 * @param {Object} params
 * @param {number} [params.page=0] - Page number (0-indexed)
 * @param {number} [params.size=10] - Page size
 * @returns {Promise<{content: ResumeSummary[], totalElements: number, totalPages: number, size: number, number: number}>}
 */
export const fetchResumes = async ({ page = 0, size = 10 } = {}) => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.RESUMES, {
    params: { page, size },
  });
  return response.data.data;
};

/**
 * Create a new resume
 * @param {ResumeCreateRequest} request
 * @returns {Promise<number>} - Resume ID
 */
export const createResume = async (request) => {
  const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESUMES, request);
  return response.data.data;
};

/**
 * Fetch resume detail by ID
 * @param {number} resumeId
 * @returns {Promise<ResumeDetail>}
 */
export const fetchResumeById = async (resumeId) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.RESUME_BY_ID(resumeId)
  );
  return response.data.data;
};

/**
 * Fetch specific version of a resume
 * @param {number} resumeId
 * @param {number} versionNo
 * @returns {Promise<ResumeVersion>}
 */
export const fetchResumeVersion = async (resumeId, versionNo) => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.RESUME_VERSION(resumeId, versionNo)
  );
  return response.data.data;
};

/**
 * Rename a resume
 * @param {number} resumeId
 * @param {string} name - New name (1-18 characters)
 * @returns {Promise<void>}
 */
export const renameResume = async (resumeId, name) => {
  await apiClient.patch(API_CONFIG.ENDPOINTS.RESUME_RENAME(resumeId), { name });
};

/**
 * Save (commit) a resume version
 * @param {number} resumeId
 * @param {number} versionNo
 * @returns {Promise<void>}
 */
export const saveResumeVersion = async (resumeId, versionNo) => {
  await apiClient.post(API_CONFIG.ENDPOINTS.RESUME_VERSION(resumeId, versionNo));
};

/**
 * Delete a resume
 * @param {number} resumeId
 * @returns {Promise<void>}
 */
export const deleteResume = async (resumeId) => {
  await apiClient.delete(API_CONFIG.ENDPOINTS.RESUME_BY_ID(resumeId));
};
