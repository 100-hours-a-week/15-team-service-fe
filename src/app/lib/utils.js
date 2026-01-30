import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import yaml from 'js-yaml';
import { FILTER_UNSPECIFIED_LABEL } from '@/app/constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 텍스트가 지정된 길이를 초과하면 말줄임표(...)로 자릅니다.
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이 (기본값: 20)
 * @returns 잘린 텍스트 또는 원본 텍스트
 */
export function truncateText(text = '', maxLength = 20) {
  const value = String(text);
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

/**
 * 초 단위 시간을 "분 초" 형식으로 변환합니다.
 * @param seconds - 초 단위 시간
 * @returns "분 초" 형식의 문자열 (예: "2분 30초")
 */
export function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}분 ${secs}초`;
}

/**
 * 초 단위 시간을 "시간 분 초" 형식으로 변환합니다.
 * 1시간 미만인 경우 formatTime과 동일하게 "분 초"만 반환합니다.
 * @param seconds - 초 단위 시간
 * @returns "시간 분 초" 또는 "분 초" 형식의 문자열
 */
export function formatDuration(seconds = 0) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}시간 ${mins}분 ${secs}초`;
  }
  return formatTime(seconds);
}

/**
 * ISO 8601 타임스탬프를 한국어 형식으로 변환합니다.
 * @param {string | null} isoTimestamp - ISO 8601 timestamp from API
 * @returns {string} "YYYY.MM.DD 오전/오후 H:MM" 형식의 문자열 (변환 실패 시 빈 문자열)
 */
export function formatKoreanTimestamp(isoTimestamp) {
  if (!isoTimestamp) return '';

  try {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 || 12;

    return `${year}.${month}.${day} ${period} ${displayHours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Format ISO timestamp to time-only Korean format
 * Used for chat message timestamps (no date, only time)
 * @param {string | null} isoTimestamp - ISO 8601 timestamp
 * @returns {string} "오전 10:30" or "오후 03:05" format (empty string if invalid)
 */
export function formatMessageTime(isoTimestamp) {
  if (!isoTimestamp) return '';

  try {
    const date = new Date(isoTimestamp);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 || 12;

    return `${period} ${displayHours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Format ISO timestamp to Korean date format (for date dividers)
 * @param {string | null} isoTimestamp - ISO 8601 timestamp
 * @returns {string} "YYYY년 M월 D일" format (empty string if invalid)
 */
export function formatMessageDate(isoTimestamp) {
  if (!isoTimestamp) return '';

  try {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // No padding
    const day = date.getDate(); // No padding

    return `${year}년 ${month}월 ${day}일`;
  } catch {
    return '';
  }
}

/**
 * Extract local date string from ISO timestamp (YYYY-M-D)
 * Used for date comparison to determine when to show date dividers
 * @param {string | null} isoTimestamp - ISO 8601 timestamp
 * @returns {string} "YYYY-M-D" format (empty string if invalid)
 */
export function getLocalDate(isoTimestamp) {
  if (!isoTimestamp) return '';

  try {
    const date = new Date(isoTimestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  } catch {
    return '';
  }
}

/**
 * 이모티콘 존재 여부를 검증합니다.
 */
const EMOJI_REGEX = /\p{Emoji_Presentation}/gu;
/**
 * 이름 검증 포맷입니다.
 * @param {string} input - Name string
 * @returns {boolean} True if valid name (2-10 chars, no spaces, no emoji)
 */
export function validateName(input = '') {
  const trimmed = String(input).trim();

  if (trimmed.length < 2 || trimmed.length > 10) {
    return false;
  }

  if (/\s/.test(trimmed)) {
    return false;
  }

  if (EMOJI_REGEX.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Get error message for invalid name
 * @param {string} input - Name string
 * @returns {string} Error message (empty if valid)
 */
export function getNameErrorMessage(input = '') {
  const trimmed = String(input).trim();

  if (!trimmed) {
    return '이름을 입력해주세요.';
  }

  if (trimmed.length < 2) {
    return '이름은 최소 2자 이상이어야 합니다.';
  }

  if (trimmed.length > 10) {
    return '이름은 최대 10자까지 입력할 수 있습니다.';
  }

  if (/\s/.test(trimmed)) {
    return '이름에 공백을 포함할 수 없습니다.';
  }

  if (EMOJI_REGEX.test(trimmed)) {
    return '이름에 이모지를 사용할 수 없습니다.';
  }

  return '';
}

/**
 * Format phone number with dashes (010-1234-5678)
 * @param {string} input - Raw phone number string
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(input = '') {
  const digits = String(input).replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Remove formatting from phone number (010-1234-5678 → 01012345678)
 * @param {string} input - Formatted phone number string
 * @returns {string} Phone number with only digits
 */
export function stripPhoneFormat(input = '') {
  return String(input).replace(/\D/g, '');
}

/**
 * Validate phone number format
 * @param {string} input - Phone number string
 * @returns {boolean} True if valid Korean mobile number
 */
export function validatePhoneNumber(input = '') {
  const digits = String(input).replace(/\D/g, '');
  return (
    digits.startsWith('01') && (digits.length === 10 || digits.length === 11)
  );
}

/**
 * Get error message for invalid phone number
 * @param {string} input - Phone number string
 * @returns {string} Error message (empty if valid)
 */
export function getPhoneErrorMessage(input = '') {
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '전화번호를 입력해주세요.';
  if (!digits.startsWith('01')) return '휴대폰 번호 형식이 올바르지 않습니다.';
  if (digits.length < 10) return '전화번호가 너무 짧습니다.';
  if (digits.length > 11) return '전화번호가 너무 깁니다.';
  return '';
}

/**
 * Get CSRF token from cookie
 * @param {string} cookieName - Cookie name (default: 'XSRF-TOKEN')
 * @returns {string | null} CSRF token value or null if not found
 */
export function getCsrfToken(cookieName = 'XSRF-TOKEN') {
  const cookies = document.cookie.split('; ');
  const csrfCookie = cookies.find((row) => row.startsWith(`${cookieName}=`));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

export function parseYAMLToResume(yamlContent = '') {
  try {
    const parsed = yaml.load(String(yamlContent));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---- interviews ----
export function extractUniqueCompanies(interviews = []) {
  const companies = new Set();

  interviews.forEach((interview) => {
    const company = interview?.company?.trim();
    companies.add(company || FILTER_UNSPECIFIED_LABEL);
  });

  return Array.from(companies);
}

export function generatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const isNearStart = currentPage <= 4;
  const isNearEnd = currentPage >= totalPages - 3;

  if (!isNearStart) {
    pages.push('ellipsis');
  }

  const start = isNearStart ? 2 : Math.max(2, currentPage - 1);
  const end = isNearEnd
    ? totalPages - 1
    : Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (!isNearEnd) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function sortInterviews(interviews = [], sortOption = 'newest') {
  const toTime = (dateValue) => Date.parse(dateValue) || 0;

  return [...interviews].sort((a, b) =>
    sortOption === 'oldest'
      ? toTime(a.date) - toTime(b.date)
      : toTime(b.date) - toTime(a.date)
  );
}
