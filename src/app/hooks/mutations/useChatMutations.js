import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage } from '@/app/api/endpoints/chats';

/**
 * Send a message to a chatroom
 * @param {number} chatroomId - Chatroom ID
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSendMessage(chatroomId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => sendChatMessage(chatroomId, payload),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['chatMessages', chatroomId], (oldData) => {
        if (!oldData) return oldData;

        const updatedPages = [...oldData.pages];
        const lastPage = updatedPages[updatedPages.length - 1];

        updatedPages[updatedPages.length - 1] = {
          ...lastPage,
          chats: [...lastPage.chats, newMessage],
        };

        return { ...oldData, pages: updatedPages };
      });

      queryClient.invalidateQueries(['chats']);
    },
  });
}
