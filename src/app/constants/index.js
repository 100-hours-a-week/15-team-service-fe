// ========================================
// Centralized Constants
// ========================================

// Color Constants
// ========================================

export const COLORS = {
  PRIMARY: '#2F6BFF',
  SUCCESS: '#16A34A',
  DANGER: '#EF4444',
  GRAY_50: '#F9FAFB',
  GRAY_200: '#E5E7EB',
  GRAY_500: '#6B7280',
  GRAY_700: '#374151',
  GRAY_900: '#111827',
  BLUE_50: '#EFF6FF',
  BLUE_600: '#2563EB',
  GREEN_50: '#F0FDF4',
  GREEN_600: '#16A34A',
  GREEN_700: '#15803D',
  PURPLE_50: '#FAF5FF',
  PURPLE_700: '#7E22CE',
};

// Position Constants
// ========================================

export const POSITIONS = [
  '백엔드',
  '프론트엔드',
  '풀스택',
  '데이터',
  '모바일',
  'DevOps',
  '보안',
  'AI',
];

// Interview Type Constants
// ========================================

export const INTERVIEW_TYPES = {
  PERSONALITY: 'personality',
  TECHNICAL: 'technical',
};

export const INTERVIEW_TYPE_LABELS = {
  [INTERVIEW_TYPES.PERSONALITY]: '인성',
  [INTERVIEW_TYPES.TECHNICAL]: '기술',
};

// UI Constants
// ========================================

export const MIN_TOUCH_TARGET = 44; // px - minimum touch target size for accessibility
export const MAX_MOBILE_WIDTH = 390; // px - maximum mobile viewport width

// LocalStorage Keys
// ========================================

export const STORAGE_KEYS = {
  USER_PROFILE: 'commitme_user_profile',
};

// Sort Options
// ========================================

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  NAME: 'name',
};

export const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: '최신순',
  [SORT_OPTIONS.OLDEST]: '오래된순',
  [SORT_OPTIONS.NAME]: '이름순',
};

// Pagination Constants
// ========================================

export const ITEMS_PER_PAGE = 10;

// Filter Labels
// ========================================

export const FILTER_ALL_LABEL = '전체';
export const FILTER_UNSPECIFIED_LABEL = '미지정';

// Repository Sorting
// ========================================

export const REPO_SORT_OPTIONS = {
  recent: '최근 업데이트 순',
  name: '이름 순',
};
