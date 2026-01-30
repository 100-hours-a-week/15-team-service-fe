/**
 * Streaming API Client
 * Handles Server-Sent Events (SSE) for AI chatbot streaming responses
 */

import { API_CONFIG } from './config';
import { getCsrfToken } from '@/app/lib/utils';

/**
 * Stream API call with chunk-by-chunk processing
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request payload
 * @param {Object} options - Streaming options
 * @param {Function} options.onChunk - Callback for each chunk
 * @param {Function} options.onComplete - Callback on completion
 * @param {Function} options.onError - Callback on error
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 */
export async function streamAPI(endpoint, data, options = {}) {
  const { onChunk, onComplete, onError, signal } = options;

  try {
    // Build headers with CSRF token
    const headers = {
      'Content-Type': 'application/json',
    };

    if (!endpoint.includes('/api/v1/resume/callback')) {
      const csrfToken = getCsrfToken('XSRF-TOKEN');
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include', // CRITICAL: Send cookies with request
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      onChunk?.(chunk);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    onError?.(error);
  }
}
