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

// Resume Sort Options
// ========================================

export const RESUME_SORT_OPTIONS = {
  UPDATED_DESC: 'UPDATED_DESC',
  UPDATED_ASC: 'UPDATED_ASC',
};

export const RESUME_SORT_LABELS = {
  [RESUME_SORT_OPTIONS.UPDATED_DESC]: '최근 업데이트 순',
  [RESUME_SORT_OPTIONS.UPDATED_ASC]: '오래된 순',
};

// Profile Type Maps (Korean UI ↔ Backend Enum)
// ========================================

export const EMPLOYMENT_TYPE_MAP = {
  인턴: 'INTERN',
  계약직: 'CONTRACT',
  정규직: 'FULL_TIME',
  '개인 사업': 'SOLE_PROPRIETOR',
  프리랜서: 'FREELANCE',
};

export const REVERSE_EMPLOYMENT_TYPE_MAP = Object.fromEntries(
  Object.entries(EMPLOYMENT_TYPE_MAP).map(([k, v]) => [v, k])
);

export const EDUCATION_STATUS_MAP = {
  졸업: 'GRADUATED',
  '졸업 유예': 'GRADUATION_POSTPONED',
  '재학 중': 'ENROLLING',
  중퇴: 'DROPPED_OUT',
  수료: 'COMPLETED',
};

export const REVERSE_EDUCATION_STATUS_MAP = Object.fromEntries(
  Object.entries(EDUCATION_STATUS_MAP).map(([k, v]) => [v, k])
);

export const EDUCATION_TYPE_MAP = {
  고등학교: 'HIGH_SCHOOL',
  '대학교(전문학사)': 'ASSOCIATE',
  '대학교(학사)': 'BACHELOR',
  '대학원(석사)': 'MASTER',
  '대학원(박사)': 'DOCTOR',
  '사설 교육': 'PRIVATE_INSTITUTE',
};

export const REVERSE_EDUCATION_TYPE_MAP = Object.fromEntries(
  Object.entries(EDUCATION_TYPE_MAP).map(([k, v]) => [v, k])
);

// Country Code Constants
// ========================================

export const COUNTRY_CODES = [
  { code: '+82', label: '대한민국 +82' },
  { code: '+1', label: '미국/캐나다 +1' },
  { code: '+81', label: '일본 +81' },
  { code: '+86', label: '중국 +86' },
  { code: '+852', label: '홍콩 +852' },
  { code: '+65', label: '싱가포르 +65' },
  { code: '+44', label: '영국 +44' },
  { code: '+49', label: '독일 +49' },
  { code: '+33', label: '프랑스 +33' },
  { code: '+61', label: '호주 +61' },
];

// Upload Constants
// ========================================

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
export const ALLOWED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];
