import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import yaml from 'js-yaml';
import {
  FILTER_UNSPECIFIED_LABEL,
  EMPLOYMENT_TYPE_MAP,
  REVERSE_EMPLOYMENT_TYPE_MAP,
  EDUCATION_STATUS_MAP,
  REVERSE_EDUCATION_STATUS_MAP,
  EDUCATION_TYPE_MAP,
  REVERSE_EDUCATION_TYPE_MAP,
} from '@/app/constants';

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
 * @param {string} countryCode - Country code (default: '+82')
 * @returns {boolean} True if valid
 */
export function validatePhoneNumber(input = '', countryCode = '+82') {
  const digits = String(input).replace(/\D/g, '');
  if (countryCode === '+82') {
    return digits.startsWith('01') && digits.length === 11;
  }
  return digits.length >= 6 && digits.length <= 15;
}

/**
 * Get error message for invalid phone number
 * @param {string} input - Phone number string
 * @param {string} countryCode - Country code (default: '+82')
 * @returns {string} Error message (empty if valid)
 */
export function getPhoneErrorMessage(input = '', countryCode = '+82') {
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '전화번호를 입력해주세요.';
  if (countryCode === '+82') {
    if (!digits.startsWith('01'))
      return '휴대폰 번호 형식이 올바르지 않습니다.';
    if (digits.length < 11) return '전화번호가 너무 짧습니다.';
    if (digits.length > 11) return '전화번호가 너무 깁니다.';
  } else {
    if (digits.length < 6) return '전화번호가 너무 짧습니다.';
    if (digits.length > 15) return '전화번호가 너무 깁니다.';
  }
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

/**
 * Get cookie value by name
 * @param {string} cookieName - Cookie name
 * @returns {string | null} Cookie value or null if not found
 */
export function getCookieValue(cookieName) {
  if (!cookieName) return null;
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith(`${cookieName}=`));
  return cookie ? cookie.split('=')[1] : null;
}

/**
 * Ensure CSRF token is present by fetching from backend if needed
 * Uses GET /positions endpoint to trigger CSRF token generation
 * Prevents duplicate requests with promise caching
 * @returns {Promise<string | null>} CSRF token value
 */
let csrfTokenPromise = null;
export async function ensureCsrfToken() {
  // Return existing token if available
  const existingToken = getCsrfToken('XSRF-TOKEN');
  if (existingToken) {
    return existingToken;
  }

  // Prevent duplicate requests
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      // Use environment variable directly to avoid circular dependency with API_CONFIG
      let baseUrl =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

      // Remove trailing slash to prevent double-slash in URL
      baseUrl = baseUrl.replace(/\/+$/, '');

      // Call harmless GET endpoint to trigger CSRF token generation
      // Using /positions as it's a lightweight endpoint
      const url = `${baseUrl}/positions`;

      await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Token should now be in cookie
      const token = getCsrfToken('XSRF-TOKEN');
      if (!token) {
        console.warn(
          '[CSRF] Token not found in cookie after fetch. Check backend CORS settings and cookie configuration.'
        );
        console.warn('[CSRF] Document cookies:', document.cookie);
      }
      return token;
    } catch (error) {
      console.error('[CSRF] Failed to fetch token:', error);
      console.error('[CSRF] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
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

  const byName = (a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    return aName.localeCompare(bName, 'ko');
  };

  if (sortOption === 'name') {
    return [...interviews].sort(byName);
  }

  return [...interviews].sort((a, b) => {
    if (sortOption === 'oldest') {
      return toTime(a.date) - toTime(b.date);
    }
    return toTime(b.date) - toTime(a.date);
  });
}

// Re-export type maps from constants for convenience
export {
  EMPLOYMENT_TYPE_MAP,
  REVERSE_EMPLOYMENT_TYPE_MAP,
  EDUCATION_STATUS_MAP,
  REVERSE_EDUCATION_STATUS_MAP,
  EDUCATION_TYPE_MAP,
  REVERSE_EDUCATION_TYPE_MAP,
} from '@/app/constants';

/**
 * Map API profile response to react-hook-form field values.
 * Handles both master profile and resume-specific profile shapes.
 * Includes `id` fields so edit-mode pages can pass them back to the API.
 * @param {Object} profileData - Raw API response from GET /resumes/profile or GET /resumes/:id/profile
 * @returns {Object} Form default values
 */
export function mapProfileDataToForm(profileData) {
  return {
    name: profileData.name || '',
    countryCode: profileData.phoneCountryCode || '+82',
    phone: profileData.phoneNumber
      ? formatPhoneNumber(profileData.phoneNumber)
      : '',
    bio: profileData.introduction || '',
    techStacks: profileData.techStacks?.map((t) => t.name) || [],
    experiences:
      profileData.experiences?.map((exp) => ({
        ...(exp.id && { id: exp.id }),
        company: exp.companyName || '',
        position: exp.position || '',
        department: exp.department || '',
        startDate: exp.startAt?.replace(/\./g, '-') || '',
        endDate: exp.endAt?.replace(/\./g, '-') || '',
        isCurrent: exp.isCurrentlyWorking || false,
        workType: REVERSE_EMPLOYMENT_TYPE_MAP[exp.employmentType] || '정규직',
        description: exp.responsibilities || '',
      })) || [],
    educations:
      profileData.educations?.map((edu) => ({
        ...(edu.id && { id: edu.id }),
        type: REVERSE_EDUCATION_TYPE_MAP[edu.educationType] || '대학교(학사)',
        institution: edu.institution || '',
        major: edu.major || '',
        status: REVERSE_EDUCATION_STATUS_MAP[edu.status] || '졸업',
        startDate: edu.startAt?.replace(/\./g, '-') || '',
        endDate: edu.endAt?.replace(/\./g, '-') || '',
      })) || [],
    activities:
      profileData.activities?.map((act) => ({
        ...(act.id && { id: act.id }),
        name: act.title || '',
        organization: act.organization || '',
        year: String(act.year || ''),
        description: act.description || '',
      })) || [],
    certifications:
      profileData.certificates?.map((cert) => ({
        ...(cert.id && { id: cert.id }),
        name: cert.name || '',
        score: cert.score || '',
        issuer: cert.issuer || '',
        date: cert.issuedAt?.replace(/\./g, '-') || '',
      })) || [],
  };
}

/**
 * Build API payload from react-hook-form data.
 * Filters out empty list entries and maps field names back to API shape.
 * Preserves `id` fields when present (required for resume-specific profile updates).
 * @param {Object} data - Form values from handleSubmit
 * @param {string | null} profileImageUrl - S3 key or existing URL
 * @returns {Object} Payload for PUT /resumes/profile or PUT /resumes/:id/profile
 */
export function buildProfilePayload(data, profileImageUrl) {
  const experiences = data.experiences.filter((e) => e.company || e.startDate);
  const educations = data.educations.filter(
    (e) => e.institution || e.startDate
  );
  const activities = data.activities.filter((a) => a.name || a.year);
  const certifications = data.certifications.filter((c) => c.name);

  return {
    name: data.name,
    profileImageUrl,
    phoneCountryCode: data.phone ? data.countryCode : null,
    phoneNumber: data.phone ? stripPhoneFormat(data.phone) : null,
    introduction: data.bio,
    techStacks: data.techStacks.map((name) => ({ name })),
    experiences: experiences.map((exp) => ({
      ...(exp.id && { id: exp.id }),
      companyName: exp.company,
      position: exp.position,
      department: exp.department,
      startAt: exp.startDate.replace(/-/g, '.'),
      endAt: exp.isCurrent ? null : exp.endDate.replace(/-/g, '.'),
      isCurrentlyWorking: exp.isCurrent,
      employmentType: EMPLOYMENT_TYPE_MAP[exp.workType] || 'FULL_TIME',
      responsibilities: exp.description,
    })),
    educations: educations.map((edu) => ({
      ...(edu.id && { id: edu.id }),
      educationType: EDUCATION_TYPE_MAP[edu.type] || 'BACHELOR',
      institution: edu.institution,
      major: edu.major,
      status: EDUCATION_STATUS_MAP[edu.status] || 'GRADUATED',
      startAt: edu.startDate.replace(/-/g, '.'),
      endAt: edu.endDate.replace(/-/g, '.'),
    })),
    activities: activities.map((act) => ({
      ...(act.id && { id: act.id }),
      title: act.name,
      organization: act.organization,
      year: Number(act.year),
      description: act.description,
    })),
    certificates: certifications.map((cert) => ({
      ...(cert.id && { id: cert.id }),
      name: cert.name,
      score: cert.score,
      issuer: cert.issuer,
      issuedAt: cert.date.replace(/-/g, '.'),
    })),
  };
}
