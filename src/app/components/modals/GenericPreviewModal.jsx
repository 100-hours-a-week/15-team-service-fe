import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../common/Button';

/**
 * Generic preview modal using Sheet (bottom drawer)
 * @typedef {Object} GenericPreviewModalProps
 * @property {boolean} isOpen - Modal open state
 * @property {() => void} onClose - Close callback (also called when clicking overlay)
 * @property {string} title - Sheet header title
 * @property {string} cancelButtonText - Cancel button text
 * @property {string} actionButtonText - Primary action button text
 * @property {() => void} onAction - Primary action callback
 * @property {React.ReactNode} children - Scrollable content
 */

/**
 * @param {GenericPreviewModalProps} props
 */
export function GenericPreviewModal({
  isOpen,
  onClose,
  title,
  cancelButtonText,
  actionButtonText,
  onAction,
  children,
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4">{children}</div>

        <SheetFooter className="border-t border-gray-200 pt-4">
          <div className="flex gap-3 w-full max-w-[390px] mx-auto">
            <Button variant="secondary" fullWidth onClick={onClose}>
              {cancelButtonText}
            </Button>
            <Button variant="primary" fullWidth onClick={onAction}>
              {actionButtonText}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
