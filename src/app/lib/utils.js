import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import yaml from 'js-yaml';
import { FILTER_UNSPECIFIED_LABEL } from '@/app/constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 텍스트가 지정된 길이를 초과하면 말줄임표(...)로 자릅니다
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이 (기본값: 20)
 * @returns 잘린 텍스트 또는 원본 텍스트
 */
export function truncateText(text, maxLength = 20) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * 초 단위 시간을 "분 초" 형식으로 변환합니다
 * @param seconds - 초 단위 시간
 * @returns "분 초" 형식의 문자열 (예: "2분 30초")
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs}초`;
}

/**
 * 초 단위 시간을 "시간 분 초" 형식으로 변환합니다
 * 1시간 미만인 경우 formatTime과 동일하게 "분 초"만 반환합니다
 * @param seconds - 초 단위 시간
 * @returns "시간 분 초" 또는 "분 초" 형식의 문자열
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${mins}분 ${secs}초`;
  }
  return formatTime(seconds);
}

export function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---- className helper (shadcn-style) ----
export function cn(...classes) {
  return classes
    .flatMap((c) => {
      if (!c) return [];
      if (Array.isArray(c)) return c;
      if (typeof c === 'object') return Object.keys(c).filter((k) => c[k]);
      return String(c).split(' ');
    })
    .filter(Boolean)
    .join(' ');
}

// ---- phone ----
export function formatPhoneNumber(input = '') {
  const digits = String(input).replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

export function validatePhoneNumber(input = '') {
  const digits = String(input).replace(/\D/g, '');
  return (
    digits.startsWith('01') && (digits.length === 10 || digits.length === 11)
  );
}

export function getPhoneErrorMessage(input = '') {
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '전화번호를 입력해주세요.';
  if (!digits.startsWith('01')) return '휴대폰 번호 형식이 올바르지 않습니다.';
  if (digits.length < 10) return '전화번호가 너무 짧습니다.';
  if (digits.length > 11) return '전화번호가 너무 깁니다.';
  return '';
}

// ---- yaml ----
export function parseYAMLToResume(yamlText = '') {
  try {
    const text = String(yamlText);
    const get = (key) =>
      text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1] ?? '';

    return {
      name: get('name'),
      position: get('position'),
      company: get('company'),
      profile: {
        email: get('email'),
        phone: get('phone'),
        github: get('github'),
      },
      education: [],
      experience: [],
      skills: [],
      projects: [],
    };
  } catch {
    return {
      name: '',
      position: '',
      company: '',
      profile: {},
      education: [],
      experience: [],
      skills: [],
      projects: [],
    };
  }
}

/**
 * 페이지네이션을 위한 페이지 번호 배열을 생성합니다
 * 모바일 최적화: 현재 페이지를 중심으로 최대 7개 페이지 번호 표시
 * @param currentPage - 현재 페이지 번호 (1-indexed)
 * @param totalPages - 전체 페이지 수
 * @returns 표시할 페이지 번호 배열 (예: [1, 'ellipsis', 5, 6, 7, 'ellipsis', 20])
 */
export function generatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    // 7페이지 이하: 모든 페이지 번호 표시
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];

export function sortInterviews(interviews = [], sortOption = 'newest') {
  const toTime = (d) => Date.parse(d) || 0;
  return [...interviews].sort((a, b) =>
    sortOption === 'oldest'
      ? toTime(a.date) - toTime(b.date)
      : toTime(b.date) - toTime(a.date)
  );
}

/**
 * YAML 문자열을 파싱하여 이력서 객체로 변환합니다
 * @param yamlContent - YAML 형식의 이력서 문자열
 * @returns 파싱된 이력서 객체 또는 null (파싱 실패 시)
 */
export function parseYAMLToResume(yamlContent) {
  try {
    const parsed = yaml.load(yamlContent);
    return parsed;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return null;
  }
}
