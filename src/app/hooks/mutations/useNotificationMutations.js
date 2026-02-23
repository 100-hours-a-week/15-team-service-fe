import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  patchNotificationsSeen,
  patchNotificationRead,
} from '@/app/api/endpoints/notifications';

export function useNotificationSeen() {
  return useMutation({ mutationFn: patchNotificationsSeen });
}

export function useNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchNotificationRead,
    onSuccess: (_, id) => {
      // 목록 캐시에서 해당 항목 read=true로 업데이트
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id
                ? { ...item, read: true, readAt: new Date().toISOString() }
                : item
            ),
          })),
        };
      });
    },
  });
}
