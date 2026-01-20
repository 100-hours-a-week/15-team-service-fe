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

/**
 * 전화번호를 010-1234-5678 형식으로 자동 포맷팅합니다
 * @param value - 입력된 전화번호 (숫자만 또는 하이픈 포함)
 * @returns 포맷팅된 전화번호 문자열
 * @example
 * formatPhoneNumber('01012345678') // '010-1234-5678'
 * formatPhoneNumber('010-1234-5678') // '010-1234-5678'
 * formatPhoneNumber('0101234') // '010-1234'
 */
export function formatPhoneNumber(value) {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');

  // 빈 문자열 처리
  if (!numbers) return '';

  // 길이별 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  // 11자 초과 시 11자까지만 사용
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * 전화번호 유효성을 검증합니다
 * @param phone - 검증할 전화번호 (하이픈 포함 가능)
 * @returns 유효한 전화번호인 경우 true, 그렇지 않으면 false
 * @description
 * - 010으로 시작해야 함
 * - 하이픈 제외 총 11자리 숫자여야 함
 * - 빈 문자열은 true 반환 (선택 필드이므로)
 */
export function validatePhoneNumber(phone) {
  // 빈 값은 유효함 (선택 필드)
  if (!phone.trim()) return true;

  // 숫자만 추출
  const numbers = phone.replace(/[^\d]/g, '');

  // 010으로 시작하고 11자리인지 확인
  return numbers.startsWith('010') && numbers.length === 11;
}

/**
 * 전화번호 검증 실패 시 에러 메시지를 반환합니다
 * @param phone - 검증할 전화번호
 * @returns 에러 메시지 또는 undefined
 */
export function getPhoneErrorMessage(phone) {
  // 빈 값은 에러 없음
  if (!phone.trim()) return undefined;

  const numbers = phone.replace(/[^\d]/g, '');

  // 010으로 시작하지 않음
  if (!numbers.startsWith('010')) {
    return '010으로 시작하는 번호를 입력하세요';
  }

  // 11자리가 아님
  if (numbers.length !== 11) {
    return '11자리 전화번호를 입력하세요';
  }

  return undefined;
}

/**
 * Interview 배열에서 고유한 회사 목록을 추출합니다
 * @param interviews - Interview 배열
 * @returns 정렬된 고유 회사명 배열 (빈 문자열은 "미지정"으로 변환)
 */
export function extractUniqueCompanies(interviews) {
  const companies = new Set();

  interviews.forEach(interview => {
    const company = interview.company.trim() || FILTER_UNSPECIFIED_LABEL;
    companies.add(company);
  });

  return Array.from(companies).sort();
}

/**
 * Interview 배열을 정렬 옵션에 따라 정렬합니다
 * @param interviews - Interview 배열
 * @param sortOption - 정렬 방식 ('newest' | 'oldest' | 'name')
 * @returns 정렬된 Interview 배열
 */
export function sortInterviews(interviews, sortOption) {
  const sorted = [...interviews]; // 원본 배열 유지

  switch (sortOption) {
    case 'newest':
      return sorted.sort((a, b) => b.date.localeCompare(a.date));
    case 'oldest':
      return sorted.sort((a, b) => a.date.localeCompare(b.date));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    default:
      return sorted;
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

  // 항상 첫 페이지 표시
  pages.push(1);

  // 현재 페이지 주변 2페이지씩 표시 (총 5개)
  const startPage = Math.max(2, currentPage - 2);
  const endPage = Math.min(totalPages - 1, currentPage + 2);

  // 첫 페이지와 시작 페이지 사이에 생략 표시
  if (startPage > 2) {
    pages.push('ellipsis');
  }

  // 중간 페이지들
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // 끝 페이지와 마지막 페이지 사이에 생략 표시
  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }

  // 항상 마지막 페이지 표시
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
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
