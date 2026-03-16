import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

/**
 * Resume generation cross-page state, persisted to sessionStorage.
 *
 * Replaces ad-hoc sessionStorage calls scattered across CreateResumePage
 * and ResumeViewerPage.
 *
 * @example
 * // Start generation (in mutation onSuccess)
 * useResumeCreationStore.getState().startGeneration(resumeId)
 *
 * // Read in render
 * const createdResumeId = useResumeCreationStore(s => s.generatingResumeId)
 *
 * // On success redirect
 * useResumeCreationStore.getState().completeGeneration('이력서가 생성되었습니다')
 *
 * // Read and clear message (in ResumeViewerPage)
 * const message = useResumeCreationStore(s => s.resumeCreatedMessage)
 * useResumeCreationStore.getState().clearMessage()
 */
export const useResumeCreationStore = create(
  devtools(
    persist(
      (set) => ({
        /** @type {string | null} */
        generatingResumeId: null,
        /** @type {number | null} Unix ms timestamp */
        generatingStartedAt: null,
        /** @type {string | null} One-time toast message shown in ResumeViewerPage after redirect */
        resumeCreatedMessage: null,

        /** Called when the backend accepts the generation request. */
        startGeneration: (resumeId) =>
          set(
            { generatingResumeId: resumeId, generatingStartedAt: Date.now() },
            false,
            'startGeneration'
          ),

        /**
         * Called on successful generation before hard-redirect to ResumeViewerPage.
         * Clears in-progress fields and stores the one-time success toast message.
         */
        completeGeneration: (message) =>
          set(
            {
              generatingResumeId: null,
              generatingStartedAt: null,
              resumeCreatedMessage: message,
            },
            false,
            'completeGeneration'
          ),

        /** Clears in-progress state only. Does NOT clear resumeCreatedMessage. */
        cancelGeneration: () =>
          set(
            { generatingResumeId: null, generatingStartedAt: null },
            false,
            'cancelGeneration'
          ),

        /** Called by ResumeViewerPage immediately after displaying the message. */
        clearMessage: () =>
          set({ resumeCreatedMessage: null }, false, 'clearMessage'),
      }),
      {
        name: 'resume-creation',
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    { name: 'resume-creation-store' }
  )
);
