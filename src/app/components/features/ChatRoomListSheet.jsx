import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Drawer } from 'vaul';
import { useChats } from '@/app/hooks/queries/useChatQueries';
import { formatKoreanTimestamp } from '@/app/lib/utils';

export function ChatRoomListSheet() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: chatRooms = [], isLoading, isError, error } = useChats();

  /**
   * Handle chat room card click
   * TODO: Implement navigation to specific chat room
   * @param {number} roomId - Chat room ID
   */
  const handleRoomClick = () => {
    setIsOpen(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} dismissible={true}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
          aria-label="채팅방 목록 열기"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col w-full max-w-[390px] mx-auto"
          style={{ height: '70vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

          {/* Header */}
          <div className="px-8 py-2">
            <Drawer.Title className="text-base font-semibold">
              채팅방 목록
            </Drawer.Title>
          </div>

          {/* Content Area with Loading/Error States */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-gray-500">채팅방 불러오는 중...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-600 mb-2">
                  채팅방을 불러올 수 없습니다
                </p>
                <p className="text-xs text-gray-500">
                  {error?.response?.status === 401
                    ? '로그인이 필요합니다'
                    : '잠시 후 다시 시도해주세요'}
                </p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-500">
                  생성된 채팅방이 없습니다
                </p>
              </div>
            ) : (
              // Room List
              <div className="space-y-3">
                {chatRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleRoomClick(room.id)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Header: Room name and timestamp */}
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-base">{room.name}</h4>
                      {room.lastUpdatedAt && (
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatKoreanTimestamp(room.lastUpdatedAt)}
                        </span>
                      )}
                    </div>

                    {/* Last message preview */}
                    <p className="text-sm text-gray-600 truncate">
                      {room.lastMessage || '첫 메시지를 보내보세요!'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
