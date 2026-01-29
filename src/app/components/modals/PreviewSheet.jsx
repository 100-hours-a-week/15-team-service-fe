import { Drawer } from 'vaul';
import { Button } from '../common/Button';

/**
 * @typedef {Object} PreviewSheetProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {() => void} onDownload
 * @property {import('react').ReactNode} children
 */

/**
 * @param {PreviewSheetProps} props
 */
export function PreviewSheet({ isOpen, onClose, onDownload, children }) {
  const handleOpenChange = (open) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col w-full max-w-[390px] mx-auto"
          style={{ height: '90vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

          <div className="px-5 pb-4 border-b border-gray-200">
            <Drawer.Title className="text-base font-semibold">
              이력서 미리보기
            </Drawer.Title>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

          <div className="border-t border-gray-200 px-5 pt-4 pb-5">
            <div className="flex gap-3 w-full max-w-[390px] mx-auto">
              <Button variant="secondary" fullWidth onClick={onClose}>
                취소
              </Button>
              <Button variant="primary" fullWidth onClick={onDownload}>
                PDF 다운로드
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
