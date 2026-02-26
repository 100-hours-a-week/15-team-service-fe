import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/app/lib/toast';
import { validateImageFile } from '@/app/lib/validators';

/**
 * 프로필 이미지 선택 및 미리보기 상태 관리 훅.
 * - 파일 선택 시 유효성 검사 + Object URL 생성
 * - 언마운트 시 Object URL 자동 revoke
 * - 실제 S3 업로드는 포함하지 않음 (useUploadFile 훅 별도 사용)
 *
 * @returns {{
 *   file: File|null,
 *   previewUrl: string|null,
 *   fileInputRef: React.RefObject,
 *   handleChange: function,
 *   reset: function
 * }}
 */
export function useProfileImageUpload() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // 언마운트 시 preview URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = useCallback(
    (e) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      const validation = validateImageFile(selectedFile);
      if (!validation.ok) {
        if (validation.reason === 'type') {
          toast.error('지원하지 않는 이미지 형식입니다.');
        } else if (validation.reason === 'size') {
          toast.error('이미지 용량이 너무 큽니다. 최대 5MB까지 가능합니다.');
        }
        e.target.value = '';
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      const url = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setPreviewUrl(url);

      // 같은 파일 재선택 가능하도록 초기화
      e.target.value = '';
    },
    [previewUrl]
  );

  /** file + previewUrl 초기화 (Object URL revoke 포함) */
  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  return { file, previewUrl, fileInputRef, handleChange, reset };
}
