import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * @typedef {Object} RepoSummaryDto
 * @property {string} name
 * @property {string} repoUrl - Full GitHub URL
 * @property {boolean} isPrivate
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Repository
 * @property {number} id - Generated from index
 * @property {string} name
 * @property {string} owner - Extracted from repoUrl
 * @property {boolean} isPrivate
 * @property {string} updatedAt
 * @property {string} htmlUrl - Full GitHub URL
 */

/**
 * Fetch user's GitHub repositories
 * Transforms backend RepoSummaryDto to frontend Repository format
 * @returns {Promise<Repository[]>}
 */
export const fetchRepositories = async () => {
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.REPOSITORIES);
  /** @type {RepoSummaryDto[]} */
  const data = response.data.data;

  // Transform backend DTO to frontend Repository format
  return data.map((repo, index) => {
    // Extract owner from repoUrl (e.g., "https://github.com/owner/repo")
    const urlParts = repo.repoUrl.split('/');
    const owner = urlParts.length >= 4 ? urlParts[urlParts.length - 2] : '';

    return {
      id: index + 1, // Generate ID from index
      name: repo.name,
      owner,
      isPrivate: repo.isPrivate,
      updatedAt: repo.updatedAt,
      htmlUrl: repo.repoUrl,
    };
  });
};
