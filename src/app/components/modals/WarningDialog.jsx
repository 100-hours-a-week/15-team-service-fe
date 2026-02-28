import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AlertDialog, AlertDialogPortal } from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

/**
 * Generic warning modal with two action buttons
 *
 * Design Decision - Use Cases:
 * - Unsaved changes warnings
 * - Destructive action confirmations with save option
 * - Any scenario where primary action cancels/prevents something
 *
 * Implementation Decision - Positioning:
 * - Uses absolute positioning via #app-container portal
 * - Portal renders to #app-container so overlay/content are absolute within 390px container
 * - Absolute position ensures modal stays centered within the mobile viewport container
 * - Max-width: max-w-[350px] for comfortable padding within mobile viewport
 *
 * Implementation Decision - Button Semantics:
 * - Primary button (top, blue): Cancels/prevents the action
 * - Secondary button (bottom, gray): Proceeds with the action
 * - This is opposite of ConfirmDialog where confirm button proceeds
 * - autoFocus on primary button for keyboard accessibility
 *
 * @typedef {Object} WarningDialogProps
 * @property {boolean} isOpen - Modal open state
 * @property {string} title - Dialog title
 * @property {string} description - Dialog description text
 * @property {string} primaryButtonText - Primary button text (cancels/prevents action)
 * @property {string} secondaryButtonText - Secondary button text (proceeds with action)
 * @property {() => void} onPrimaryAction - Primary button callback
 * @property {() => void} onSecondaryAction - Secondary button callback
 */

/**
 * @param {WarningDialogProps} props
 */
export function WarningDialog({
  isOpen,
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
}) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogPortal container={document.getElementById('app-container')}>
        {/* Overlay - absolute within #app-container */}
        <AlertDialogPrimitive.Overlay
          className={cn(
            'absolute inset-0 z-50 bg-black/40',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Modal Content - fixed at viewport center */}
        <AlertDialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'z-50 grid w-full max-w-[350px] gap-4',
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
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-sm text-gray-600">
              {description}
            </AlertDialogPrimitive.Description>
          </div>

          {/* Action Buttons - Vertical Stack for Mobile */}
          <div className="flex flex-col gap-2">
            {/* Primary action: Cancels/prevents action */}
            <button
              onClick={onPrimaryAction}
              autoFocus
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg font-medium',
                'bg-primary text-white hover:bg-primary/90',
                'transition-colors'
              )}
            >
              {primaryButtonText}
            </button>

            {/* Secondary action: Proceeds with action */}
            <button
              onClick={onSecondaryAction}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-lg font-medium',
                'bg-white text-gray-700 border border-gray-200',
                'hover:bg-gray-50 transition-colors'
              )}
            >
              {secondaryButtonText}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
