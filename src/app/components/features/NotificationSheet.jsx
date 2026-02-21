import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { useNotificationSSE } from '@/app/hooks/useNotificationSSE';
import { useNotifications } from '@/app/hooks/queries/useNotificationQueries';
import {
  useNotificationSeen,
  useNotificationRead,
} from '@/app/hooks/mutations/useNotificationMutations';
import { formatKoreanTimestamp } from '@/app/lib/utils';

/**
 * Bell icon trigger + notification list sheet.
 * - SSE로 실시간 hasNew 뱃지 표시
 * - sheet 열릴 때 GET /notifications infinite scroll 목록 로드
 * - 첫 페이지 latestId 기준으로 PATCH /notifications/seen 1회 호출
 * - 알림 클릭 시 PATCH /notifications/{id}/read 호출
 * - sheet 닫힐 때 캐시 제거, 다음 열 때 항상 fresh
 */
export function NotificationSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { hasNew, clearBadge } = useNotificationSSE();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useNotifications(isOpen);
  const seenMutation = useNotificationSeen();
  const readMutation = useNotificationRead();

  // seenMutation.mutate는 stable ref이지만 seenMutation 객체는 렌더마다 새로 생성
  // ref로 고정해서 effect dep에서 제외
  const seenMutateRef = useRef(seenMutation.mutate);
  useEffect(() => {
    seenMutateRef.current = seenMutation.mutate;
  });

  // seen API는 sheet를 열 때 latestId 확인 후 1회만 호출
  const didCallSeenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const latestId = data?.pages[0]?.latestId;
    if (latestId && !didCallSeenRef.current) {
      didCallSeenRef.current = true;
      seenMutateRef.current(latestId, {
        onSuccess: () => clearBadge(),
      });
    }
  }, [isOpen, data?.pages, clearBadge]);

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  // hasNextPage, isFetchingNextPage를 ref로 유지해서 observer 재등록 없이 최신값 참조
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;

  // 인피니티 스크롤 observer
  // notifications.length 변화 시에만 재등록 (sentinel div가 처음 렌더링될 때)
  const observerRef = useRef(null);
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, notifications.length]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      didCallSeenRef.current = false;
      queryClient.removeQueries({ queryKey: ['notifications'] });
    }
  };

  const handleNotificationClick = (item) => {
    readMutation.mutate(item.id);
    setIsOpen(false);
    if (item.type === 'RESUME' && item.payload?.link) {
      navigate(item.payload.link);
    } else if (item.type === 'CHAT') {
      window.dispatchEvent(new CustomEvent('open-chat-sheet'));
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      dismissible={true}
    >
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center relative"
          aria-label="알림 열기"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col w-full max-w-[390px] mx-auto"
          style={{ height: '70vh' }}
          aria-describedby={undefined}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

          {/* Header */}
          <div className="px-5 py-2 flex items-center justify-between">
            <Drawer.Title className="text-base font-semibold">
              알림
            </Drawer.Title>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500">알림이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      item.read === false ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-1 shrink-0 mr-2">
                      {item.type === 'RESUME' ? (
                        <FileText
                          className="w-6 h-6 text-primary"
                          strokeWidth={1.5}
                        />
                      ) : (
                        <MessageSquare
                          className="w-6 h-6 text-primary"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {item.payload?.title ??
                          (item.type === 'RESUME'
                            ? '이력서 알림'
                            : '채팅 알림')}
                      </p>
                      {item.payload?.body && (
                        <p className="text-sm text-gray-500 truncate">
                          {item.payload.body}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatKoreanTimestamp(item.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}

                {/* 인피니티 스크롤 트리거 */}
                <div ref={observerRef} className="h-1" />

                {isFetchingNextPage && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
