import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * File upload policies per purpose
 * Defines allowed MIME types and max file sizes
 */
export const UPLOAD_POLICIES = {
  CHAT_ATTACHMENT: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
  },
  PROFILE_IMAGE: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSize: 5 * 1024 * 1024,
  },
  INTERVIEW_AUDIO: {
    allowedTypes: ['audio/mpeg', 'audio/wav'],
    maxSize: 50 * 1024 * 1024,
  },
};

/**
 * @param {Object} payload
 * @param {'CHAT_ATTACHMENT' | 'PROFILE_IMAGE' | 'INTERVIEW_AUDIO'} payload.purpose - Upload purpose
 * @param {string} payload.fileName - Original file name
 * @param {string} payload.contentType - MIME type (must match file)
 * @param {number} payload.fileSize - File size in bytes
 * @returns {Promise<{uploadId: number, presignedUrl: string, s3Key: string, expiresAt: string}>}
 * @throws {Error} 400 if invalid payload, 401 if not authenticated
 */
export const requestUploadUrl = async (payload) => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.UPLOADS,
    payload
  );
  return response.data.data;
};

/**
 * @param {string} presignedUrl - S3 presigned URL from step 1
 * @param {File | Blob} file - File to upload
 * @param {string} contentType - MIME type (must match what was sent in step 1)
 * @returns {Promise<string>} ETag header value from S3 (includes surrounding quotes)
 * @throws {Error} If S3 upload fails
 */
export const uploadToS3 = async (presignedUrl, file, contentType) => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }

  const etag = response.headers.get('ETag');
  return etag;
};

/**
 * @param {number} uploadId - Upload ID from step 1
 * @param {Object} payload
 * @param {string} payload.etag - ETag from S3 upload (step 2, includes quotes)
 * @param {number} payload.fileSize - File size in bytes (must match step 1)
 * @returns {Promise<{uploadId: number, attachmentId: number, s3Key: string, uploadedAt: string}>}
 * @throws {Error} 400 if etag/size mismatch, 401 if not authenticated, 404 if uploadId invalid
 */
export const confirmUpload = async (uploadId, payload) => {
  const response = await mutatingClient.patch(
    API_CONFIG.ENDPOINTS.UPLOAD_BY_ID(uploadId),
    payload
  );
  return response.data.data;
};
