import { X, Paperclip, Send, Loader2 } from 'lucide-react';
import { toast } from '@/app/lib/toast';

const isSafePreviewUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    return new URL(url).protocol === 'blob:';
  } catch {
    return false;
  }
};

const getSafeImageSrc = (url) => {
  if (!isSafePreviewUrl(url)) return '';
  return encodeURI(url);
};

/**
 * Chat message input area: file attachment hidden input, image preview,
 * textarea, attach button, and send button.
 *
 * @param {{
 *   inputText: string,
 *   onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
 *   attachedImage: { file: File, previewUrl: string } | null,
 *   attachFileInputRef: React.RefObject,
 *   onAttachChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   onRemoveAttachment: () => void,
 *   onSend: () => void,
 *   onKeyDown: (e: React.KeyboardEvent) => void,
 *   isSending: boolean,
 *   isUploading: boolean,
 *   isConnected: boolean,
 *   maxLength: number,
 *   textareaRef: React.RefObject,
 *   mentionQuery: string | null,
 *   participants: Array<{ userId: number, label: string }>,
 *   onMentionSelect: (participant: { userId: number, label: string }) => void,
 * }} props
 */
export function ChatMessageInput({
  inputText,
  onInputChange,
  attachedImage,
  attachFileInputRef,
  onAttachChange,
  onRemoveAttachment,
  onSend,
  onKeyDown,
  isSending,
  isUploading,
  isConnected,
  maxLength,
  textareaRef,
  mentionQuery,
  participants,
  onMentionSelect,
}) {
  const filteredParticipants =
    mentionQuery === null
      ? []
      : participants.filter(
          (p) =>
            mentionQuery === '' ||
            p.label.includes(mentionQuery) ||
            p.label.replace('익명', '').startsWith(mentionQuery)
        );

  return (
    <div className="border-t border-gray-200 px-5 py-4 relative">
      <input
        ref={attachFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={onAttachChange}
      />

      {attachedImage && isSafePreviewUrl(attachedImage.previewUrl) && (
        <div className="relative w-24 aspect-square mx-2 mb-3">
          <img
            src={getSafeImageSrc(attachedImage.previewUrl)}
            alt="첨부 이미지"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <button
            type="button"
            onClick={onRemoveAttachment}
            className="absolute top-1 right-1 bg-black/40 rounded-full p-0.5"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Mention Dropdown */}
      {filteredParticipants.length > 0 && (
        <div className="absolute bottom-full left-5 right-5 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto z-10">
          {filteredParticipants.map((p) => (
            <button
              key={p.userId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onMentionSelect(p);
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              @{p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => {
            if (e.target.value.length > maxLength) {
              toast.error('메시지 글자 수 제한을 초과했습니다.');
              return;
            }
            onInputChange(e);
          }}
          onKeyDown={onKeyDown}
          placeholder={isConnected ? '메시지를 입력하세요...' : '연결 중...'}
          disabled={!isConnected}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          rows={1}
          maxLength={maxLength}
        />
        <button
          type="button"
          onClick={() => attachFileInputRef.current?.click()}
          disabled={!!attachedImage || isSending || isUploading || !isConnected}
          className="p-2 text-gray-500 hover:text-primary disabled:opacity-40 transition-colors"
          aria-label="이미지 첨부"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={
            (!inputText.trim() && !attachedImage) ||
            isSending ||
            isUploading ||
            !isConnected
          }
          className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSending || isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
