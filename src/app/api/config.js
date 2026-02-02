const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const API_CONFIG = {
  BASE_URL,
  WS_URL:
    BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws',
  ENDPOINTS: {
    // Auth
    GITHUB_LOGIN_URL: '/auth/github/loginUrl',
    GITHUB_CALLBACK: '/auth/github',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/token',
    USER_PROFILE: '/users/profile',
    ONBOARDING: '/user/onboarding',

    // User Management
    USER_INFO: '/user',
    USER_SETTINGS: '/user/settings',

    // Resumes
    RESUMES: '/resumes',
    RESUME_BY_ID: (id) => `/resumes/${id}`,
    RESUME_RENAME: (id) => `/resumes/${id}/name`,
    RESUME_VERSION: (id, versionNo) => `/resumes/${id}/versions/${versionNo}`,
    RESUME_AI_CHAT: (id) => `/resumes/${id}/chat`,

    // Interviews
    INTERVIEWS: '/interviews',
    INTERVIEW_BY_ID: (id) => `/interviews/${id}`,
    INTERVIEW_SESSION: '/interviews/session',
    INTERVIEW_SUBMIT_ANSWER: (sessionId) =>
      `/interviews/session/${sessionId}/answer`,
    INTERVIEW_COMPLETE: (sessionId) =>
      `/interviews/session/${sessionId}/complete`,

    // Repositories
    REPOSITORIES: '/repositories',

    // Positions
    POSITIONS: '/positions',
    COMPANIES: '/companies',

    // Chats
    CHATS: '/chats',
    CHAT_MESSAGES: (roomId) => `/chats/${roomId}`,

    // Uploads
    UPLOADS: '/uploads',
    UPLOAD_BY_ID: (id) => `/uploads/${id}`,
  },
  TIMEOUT: 30000,
  STREAMING_TIMEOUT: 300000,
};
