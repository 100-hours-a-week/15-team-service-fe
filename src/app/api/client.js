import axios from 'axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 처리 (인증 실패 - 쿠키 만료 or 없음)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 토큰 갱신 시도
      try {
        await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
          {},
          { withCredentials: true }
        );

        // 갱신 성공 - 원래 요청 재시도
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 - 로그인 페이지로 리다이렉트
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    // 기타 에러 처리
    if (!originalRequest.skipErrorToast) {
      const errorMessage =
        error.response?.data?.message || '네트워크 오류가 발생했습니다.';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
