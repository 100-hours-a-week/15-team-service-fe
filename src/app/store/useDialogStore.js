import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Global dialog/modal state store.
 *
 * Replaces scattered [isOpen, setIsOpen] useState pairs across components.
 * Use getState() in event handlers to avoid store subscriptions in callbacks.
 *
 * @example
 * // Open (in event handler)
 * useDialogStore.getState().openDialog('logout')
 *
 * // Open with data (for dialogs that need a target)
 * useDialogStore.getState().openDialog('resumeEdit', { id: 1, name: 'foo' })
 *
 * // Read in render (selector pattern)
 * const isOpen = useDialogStore(s => s.openDialogs['logout'])
 * const editTarget = useDialogStore(s => s.dialogData['resumeEdit'])
 *
 * // Close (in event handler or mutation callback)
 * useDialogStore.getState().closeDialog('logout')
 */
export const useDialogStore = create(
  devtools(
    (set) => ({
      /** @type {Record<string, boolean>} */
      openDialogs: {},
      /** @type {Record<string, unknown>} */
      dialogData: {},

      /**
       * @param {string} id - Dialog identifier
       * @param {unknown} [data] - Optional data associated with the dialog (e.g. edit target)
       */
      openDialog: (id, data = null) =>
        set(
          (s) => ({
            openDialogs: { ...s.openDialogs, [id]: true },
            dialogData: { ...s.dialogData, [id]: data },
          }),
          false,
          `openDialog/${id}`
        ),

      /** @param {string} id - Dialog identifier */
      closeDialog: (id) =>
        set(
          (s) => ({
            openDialogs: { ...s.openDialogs, [id]: false },
          }),
          false,
          `closeDialog/${id}`
        ),
    }),
    { name: 'dialog-store' }
  )
);
