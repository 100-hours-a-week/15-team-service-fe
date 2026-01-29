import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '../ui/alert-dialog';
import { Input } from '../common/Input';
import { cn } from '../../lib/utils';

/**
 * Text input modal with validation
 *
 * Implementation Decision - Positioning:
 * - Uses absolute positioning scoped to app container
 * - Portal renders to #app-container (NOT document.body)
 * - Overlay covers only the app container area (absolute inset-0 bg-black/40)
 * - Max-width: max-w-[350px] for comfortable padding within mobile viewport
 * - Gray background outside app container is NOT darkened
 *
 * @typedef {Object} EditTextDialogProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {(value: string) => void} onConfirm
 * @property {string} initialValue
 * @property {string} title
 * @property {string} [label]
 * @property {string} [placeholder]
 * @property {string} [errorMessage='내용을 입력해주세요']
 * @property {string} [confirmText='수정']
 * @property {string} [cancelText='취소']
 */

/**
 * @param {EditTextDialogProps} props
 */
export function EditTextDialog({
  isOpen,
  onClose,
  onConfirm,
  initialValue,
  title,
  label,
  placeholder,
  errorMessage = '내용을 입력해주세요',
  confirmText = '수정',
  cancelText = '취소',
}) {
  const [inputValue, setInputValue] = React.useState(initialValue);
  const [error, setError] = React.useState(undefined);

  // Reset input value and error when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setError(undefined);
    }
  }, [isOpen, initialValue]);

  const handleInputChange = React.useCallback(
    (e) => {
      setInputValue(e.target.value);
      // Clear error when user starts typing
      if (error) setError(undefined);
    },
    [error]
  );

  const handleConfirm = React.useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) {
      setError(errorMessage);
      return;
    }
    onConfirm(trimmedValue);
  }, [inputValue, onConfirm, errorMessage]);

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogPortal container={document.getElementById('app-container')}>
        <AlertDialogPrimitive.Overlay
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 absolute inset-0 z-50 bg-black/40'
          )}
        />
        <AlertDialogPrimitive.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 absolute top-[50%] left-[50%] z-50 grid w-full max-w-[350px] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200'
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-2">
            <Input
              label={label}
              value={inputValue}
              onChange={handleInputChange}
              error={error}
              placeholder={placeholder}
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
