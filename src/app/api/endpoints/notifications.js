import apiClient from '../client';
import { API_CONFIG } from '../config';

/**
 * 알림 목록 조회 (커서 기반, 최신순)
 * @param {number | undefined} pageParam - 커서 ID, undefined면 최신부터
 * @returns {Promise<{ latestId: number, items: Array, nextCursor: number | null, hasNext: boolean }>}
 */
export const fetchNotifications = async (pageParam) => {
  const params = { size: 20 };
  if (pageParam != null) params.next = pageParam;
  const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS, {
    params,
  });
  return response.data.data;
};

/**
 * 뱃지 상태 조회 (SSE 실패 복구용)
 * @returns {Promise<{ hasNew: boolean, latestId: number }>}
 */
export const fetchNotificationBadge = async () => {
  const response = await apiClient.get(
    API_CONFIG.ENDPOINTS.NOTIFICATIONS_BADGE
  );
  return response.data.data;
};

/**
 * seen 처리 (벨 클릭 후 첫 페이지 latestId 기준)
 * @param {number} upToId - 읽음 처리할 최신 알림 ID
 */
export const patchNotificationsSeen = async (upToId) => {
  await apiClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATIONS_SEEN, { upToId });
};

/**
 * 개별 읽음 처리 (알림 클릭 시)
 * @param {number} id - 알림 ID
 */
export const patchNotificationRead = async (id) => {
  await apiClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATION_READ(id));
};
