import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/sheet';
import { Button } from '../common/Button';

/**
 * @deprecated Use GenericPreviewModal instead
 * This component is kept for backward compatibility and will be removed in a future version.
 *
 * Migration Guide:
 * 1. Replace import:
 *    ```javascript
 *    // Old:
 *    import { PreviewModal } from '../components/PreviewModal';
 *    // New:
 *    import { GenericPreviewModal } from '../components/GenericPreviewModal';
 *    ```
 *
 * 2. Update component usage:
 *    ```jsx
 *    // Old:
 *    <PreviewModal isOpen={...} onClose={...} onDownload={...}>
 *      {children}
 *    </PreviewModal>
 *
 *    // New:
 *    <GenericPreviewModal
 *      isOpen={...}
 *      onClose={...}
 *      title="이력서 미리보기"
 *      cancelButtonText="취소"
 *      actionButtonText="PDF 다운로드"
 *      onAction={...}  // Renamed from onDownload
 *    >
 *      {children}
 *    </GenericPreviewModal>
 *    ```
 *
 * @typedef {Object} PreviewModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {() => void} onDownload
 * @property {React.ReactNode} children
 */

/**
 * @param {PreviewModalProps} props
 */
export function PreviewModal({ isOpen, onClose, onDownload, children }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>이력서 미리보기</SheetTitle>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4">{children}</div>

        <SheetFooter className="border-t border-gray-200 pt-4">
          <div className="flex gap-3 w-full max-w-[390px] mx-auto">
            <Button variant="secondary" fullWidth onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" fullWidth onClick={onDownload}>
              PDF 다운로드
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
