import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertDialog, AlertDialogPortal } from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {() => void} props.onSaveAndStay - "저장하고 나가기" callback (cancels navigation)
 * @param {() => void} props.onDiscardAndLeave - "저장하지 않고 나가기" callback (proceeds)
 */
export function UnsavedChangesDialog({
  isOpen,
  onSaveAndStay,
  onDiscardAndLeave,
}) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogPortal>
        {/* Overlay - fixed positioning to cover entire viewport */}
        <AlertDialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Modal Content - fixed positioning for viewport center */}
        <AlertDialogPrimitive.Content
          className={cn(
            'fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]',
            'z-50 grid w-full max-w-[calc(100%-2rem)] gap-4',
            'rounded-lg border p-6 shadow-lg bg-white',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <AlertDialogPrimitive.Title className="text-lg font-semibold">
              아직 저장하지 않았어요.
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-gray-600">
              저장하지 않고 나가면 이력서가 사라질 수 있습니다.
            </AlertDialogPrimitive.Description>
          </div>

          {/* Action Buttons - Vertical Stack for Mobile */}
          <div className="flex flex-col gap-2">
            {/* Primary action: Save and stay (cancels navigation) */}
            <button
              onClick={onSaveAndStay}
              autoFocus
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg font-medium',
                'bg-primary text-white hover:bg-primary/90',
                'transition-colors'
              )}
            >
              저장하고 나가기
            </button>

            {/* Secondary action: Discard and leave (proceeds with navigation) */}
            <button
              onClick={onDiscardAndLeave}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg font-medium',
                'bg-white text-gray-700 border border-gray-200',
                'hover:bg-gray-50 transition-colors'
              )}
            >
              저장하지 않고 나가기
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
