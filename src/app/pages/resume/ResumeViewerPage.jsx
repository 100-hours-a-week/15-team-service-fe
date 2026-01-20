import { useRef, useState, useCallback } from "react";
import { useParams, useBlocker } from "react-router-dom";
import { Save, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { TopAppBar } from "../../components/layout/TopAppBar";
import { BottomNav } from "../../components/layout/BottomNav";
import { ChatbotBottomSheet } from "../../components/features/ChatbotBottomSheet";
import { ParsedResumeViewer } from "../../components/features/ParsedResumeViewer";
import { GenericPreviewModal } from "../../components/modals/GenericPreviewModal";
import { WarningDialog } from "../../components/modals/WarningDialog";
import { useChatbot } from "@/app/hooks/useChatbot";

const SAMPLE_YAML = `name: 유저1
position: 백엔드 개발자
company: 회사1

profile:
  email: user1@example.com
  phone: 010-1234-5678
  github: https://github.com/user1

education:
  - degree: 컴퓨터공학 학사
    school: 대학교1
    period: 2019.03 - 2023.02

experience:
  - title: 백엔드 개발 인턴
    company: 회사3
    period: 2022.06 - 2022.08
    description: |
      - Node.js 기반 REST API 개발
      - MongoDB 데이터베이스 설계
      - Docker 컨테이너화 경험

skills:
  - Node.js
  - Python
  - MongoDB
  - PostgreSQL
  - Docker
  - Git

projects:
  - name: 프로젝트1
    period: 2023.01 - 2023.06
    description: |
      - Express.js 기반 백엔드 서버 구축
      - JWT 인증 시스템 구현
      - Redis 캐싱 적용
    tech_stack: Node.js, Express, MongoDB, Redis`;

/**
 * ResumeViewerPage - Resume viewer with AI chatbot and navigation blocking
 *
 * Advanced features:
 * - useBlocker hook for navigation interception when unsaved changes exist
 * - useChatbot hook for streaming YAML content updates
 * - WarningDialog for unsaved changes confirmation
 * - Fixed positioning modals to ensure visibility regardless of scroll position
 *
 * Implementation decisions:
 * - Navigation blocking: useBlocker intercepts ALL navigation types (back button, BottomNav, link clicks)
 * - State tracking: Simple boolean flag hasUnsavedChanges (no complex dirty checking needed)
 * - Save behavior: In mock environment, saving just resets the flag (extendable when backend is added)
 * - WarningDialog semantics: Primary button saves and cancels navigation, secondary button discards and proceeds
 */
export function ResumeViewerPage() {
  const { id } = useParams();
  const resumeViewerRef = useRef(null);

  // State management
  const [yamlContent, setYamlContent] = useState(SAMPLE_YAML);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  /**
   * useChatbot hook for AI-powered YAML editing
   * - onUpdate callback receives streamed content chunks
   * - Sets hasUnsavedChanges flag to true when content is modified
   * - Appends content to yamlContent state progressively
   */
  const { messages, isLoading, handleSendMessage } = useChatbot({
    onUpdate: (content) => {
      setYamlContent((prev) => prev + content);
      setHasUnsavedChanges(true);
    },
  });

  /**
   * Navigation blocker for unsaved changes
   * - Blocks navigation when hasUnsavedChanges is true and route is changing
   * - Prevents accidental data loss from back button, BottomNav, or link clicks
   * - Requires React Router v7's createBrowserRouter (data router API)
   */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  /**
   * Save handler - Persists resume changes
   * Design decision: "Soft save" in mock environment - just resets flag
   * When backend is added, this will trigger API call
   */
  const handleSave = useCallback(() => {
    setHasUnsavedChanges(false);
    toast.success("저장되었습니다");
  }, []);

  /**
   * Save and stay handler - For unsaved changes warning dialog
   * Saves changes, resets flag, and cancels navigation (blocker.reset)
   */
  const handleSaveAndStay = useCallback(() => {
    setHasUnsavedChanges(false);
    toast.success("저장되었습니다");
    if (blocker.state === 'blocked') {
      blocker.reset(); // Cancel navigation, stay on page
    }
  }, [blocker]);

  /**
   * Discard and leave handler - For unsaved changes warning dialog
   * Discards changes and allows navigation to proceed (blocker.proceed)
   */
  const handleDiscardAndLeave = useCallback(() => {
    setHasUnsavedChanges(false);
    if (blocker.state === 'blocked') {
      blocker.proceed(); // Allow navigation, discard changes
    }
  }, [blocker]);

  /**
   * Download handler - PDF export placeholder
   * Design decision: No actual PDF generation yet, just shows toast
   * When implemented, will use jsPDF + html2canvas for Korean font support
   */
  const handleDownload = useCallback(() => {
    toast("PDF 다운로드 준비 중입니다");
  }, []);

  /**
   * Confirm download handler - For preview modal
   * Opens preview modal before PDF download
   */
  const handleConfirmDownload = useCallback(async () => {
    setShowPreview(false);
    toast("PDF 다운로드 준비 중입니다");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <TopAppBar
        title={`2025-12-23_${id}`}
        showBack
        action={
          <div className="flex items-center gap-0">
            <button
              onClick={handleSave}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="이력서 저장"
            >
              <Save className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="PDF 다운로드"
            >
              <Download className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto relative">
          {/* Parsed Resume Content */}
          <ParsedResumeViewer ref={resumeViewerRef} yamlContent={yamlContent} />

          {/* Chatbot Floating Button */}
          <button
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-24 right-[calc(50%-195px+20px)] w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-10"
            aria-label="AI 챗봇 열기"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Chatbot Bottom Sheet */}
      <ChatbotBottomSheet
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />

      {/* Preview Modal */}
      <GenericPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="이력서 미리보기"
        cancelButtonText="취소"
        actionButtonText="PDF 다운로드"
        onAction={handleConfirmDownload}
      >
        <ParsedResumeViewer yamlContent={yamlContent} />
      </GenericPreviewModal>

      {/* Unsaved Changes Warning Dialog */}
      <WarningDialog
        isOpen={blocker.state === 'blocked'}
        title="아직 저장하지 않았어요."
        description="저장하지 않고 나가면 이력서가 사라질 수 있습니다."
        primaryButtonText="저장하고 나가기"
        secondaryButtonText="저장하지 않고 나가기"
        onPrimaryAction={handleSaveAndStay}
        onSecondaryAction={handleDiscardAndLeave}
      />

      <BottomNav />
    </div>
  );
}
