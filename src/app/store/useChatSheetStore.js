import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useChatSheetStore = create(
  devtools(
    (set) => ({
      isOpen: false,
      viewMode: 'list', // 'list' | 'messages'
      selectedRoomId: null,
      selectedRoomName: null,

      /** Open the sheet. Pass roomId/roomName to go directly to a room's messages. */
      openSheet: (roomId = null, roomName = null) =>
        set(
          {
            isOpen: true,
            viewMode: roomId ? 'messages' : 'list',
            selectedRoomId: roomId,
            selectedRoomName: roomName,
          },
          false,
          'openSheet'
        ),

      /** Close the sheet and reset all navigation state. */
      closeSheet: () =>
        set(
          {
            isOpen: false,
            viewMode: 'list',
            selectedRoomId: null,
            selectedRoomName: null,
          },
          false,
          'closeSheet'
        ),

      /** Navigate to a specific room inside the sheet (internal use). */
      goToRoom: (roomId, roomName) =>
        set(
          {
            viewMode: 'messages',
            selectedRoomId: roomId,
            selectedRoomName: roomName,
          },
          false,
          'goToRoom'
        ),

      /** Navigate back to the chat room list (internal use). */
      backToList: () =>
        set(
          { viewMode: 'list', selectedRoomId: null, selectedRoomName: null },
          false,
          'backToList'
        ),
    }),
    { name: 'chat-sheet-store' }
  )
);
