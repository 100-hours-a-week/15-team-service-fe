import {
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
} from '@/app/constants';

export const validateImageFile = (file) => {
  if (!file) return { ok: false, reason: 'invalid' };

  const fileName = file.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const isValidExtension = ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);

  if (!isValidExtension || !isValidType) {
    return { ok: false, reason: 'type' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, reason: 'size' };
  }

  return { ok: true };
};
