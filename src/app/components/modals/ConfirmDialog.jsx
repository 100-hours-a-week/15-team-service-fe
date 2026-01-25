import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

/**
 * Generic confirmation modal with cancel + confirm buttons
 *
 * Implementation Decision - Positioning:
 * - Uses absolute positioning scoped to app container
 * - Portal renders to #app-container (NOT document.body)
 * - Overlay covers only the app container area (absolute inset-0 bg-black/40)
 * - Max-width: max-w-[350px] for comfortable padding within mobile viewport
 * - Gray background outside app container is NOT darkened
 *
 * @typedef {Object} ConfirmDialogProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {() => void} onConfirm
 * @property {string} title
 * @property {string} description
 * @property {string} confirmText
 * @property {string} [cancelText='취소']
 */

/**
 * @param {ConfirmDialogProps} props
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = '취소',
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
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
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onClose}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
