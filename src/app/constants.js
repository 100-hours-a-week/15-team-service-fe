/**
 * App-wide constants
 */

export const STORAGE_KEYS = {
  USER_PROFILE: "user_profile",
};

// SelectGrid에서 string item도 처리 가능
export const POSITIONS = ["Frontend", "Backend", "Fullstack", "Data", "ML"];

// RepoSelectPage
export const REPO_SORT_OPTIONS = {
  recent: "최근 업데이트",
  oldest: "오래된 순",
  name: "이름순",
};

// ---- interview list ----

export const ITEMS_PER_PAGE = 10;

export const FILTER_ALL_LABEL = "전체";
export const FILTER_UNSPECIFIED_LABEL = "미지정";

export const SORT_LABELS = {
  newest: "최신순",
  oldest: "오래된순",
};

export const INTERVIEW_TYPE_LABELS = {
  technical: "기술",
  personality: "인성",
};
