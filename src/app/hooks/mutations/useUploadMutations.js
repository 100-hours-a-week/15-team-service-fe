import { useState, useCallback } from 'react';
import {
  requestUploadUrl,
  uploadToS3,
  confirmUpload,
} from '@/app/api/endpoints/uploads';

/**
 * @param {'PROFILE_IMAGE' | 'CHAT_ATTACHMENT'} purpose - Upload purpose for backend policy
 * @returns {{ upload: (file: File) => Promise<object>, isUploading: boolean }}
 */
export function useUploadFile(purpose) {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file) => {
      setIsUploading(true);
      try {
        const { uploadId, presignedUrl } = await requestUploadUrl({
          purpose,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        const etag = await uploadToS3(presignedUrl, file, file.type);

        const result = await confirmUpload(uploadId, {
          etag,
          fileSize: file.size,
        });

        return result; // { uploadId, attachmentId, s3Key, uploadedAt }
      } finally {
        setIsUploading(false);
      }
    },
    [purpose]
  );

  return { upload, isUploading };
}
