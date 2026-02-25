import { mutatingClient } from '../mutatingClient';
import { API_CONFIG } from '../config';

/**
 * Transcribe audio stored in S3
 * @param {string} s3Key
 * @param {string} [language='ko']
 * @returns {Promise<{text: string}>}
 */
export const transcribeAudio = async (s3Key, language = 'ko') => {
  const response = await mutatingClient.post(
    API_CONFIG.ENDPOINTS.STT_TRANSCRIBE,
    {
      s3Key,
      language,
    }
  );
  return response.data.data;
};
