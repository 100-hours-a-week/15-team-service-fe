const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
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
    RESUME_EDIT: (id) => `/resumes/${id}`,
    RESUME_SSE_STREAM: (id) => `/resumes/${id}/stream`,

    // Interviews
    INTERVIEWS: '/interviews',
    INTERVIEW_BY_ID: (id) => `/interviews/${id}`,
    INTERVIEW_MESSAGES: (id) => `/interviews/${id}/messages`,
    INTERVIEW_CREATE: '/interviews',
    INTERVIEW_RENAME: (id) => `/interviews/${id}/name`,
    INTERVIEW_SUBMIT_ANSWER: (interviewId) =>
      `/interviews/${interviewId}/messages`,
    INTERVIEW_COMPLETE: (interviewId) => `/interviews/${interviewId}/end`,

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

    // STT
    STT_TRANSCRIBE: '/stt/transcribe',

    // Notifications
    NOTIFICATIONS_STREAM: '/notifications/stream',
    NOTIFICATIONS: '/notifications',
    NOTIFICATIONS_BADGE: '/notifications/badge',
    NOTIFICATIONS_SEEN: '/notifications/seen',
    NOTIFICATION_READ: (id) => `/notifications/${id}/read`,
  },
  TIMEOUT: 30000,
  LONG_TIMEOUT: 120000, // 2 minutes for AI-intensive operations
  STREAMING_TIMEOUT: 300000,
};
