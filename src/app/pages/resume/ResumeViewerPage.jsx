import { useRef } from "react";
import { useParams } from "react-router-dom";
import { Save, Download, MessageCircle } from "lucide-react";
import { TopAppBar } from "../../components/layout/TopAppBar";
import { BottomNav } from "../../components/layout/BottomNav";
import { ChatbotBottomSheet } from "../../components/features/ChatbotBottomSheet";
import { ParsedResumeViewer } from "../../components/features/ParsedResumeViewer";
import { GenericPreviewModal } from "../../components/modals/GenericPreviewModal";

const SAMPLE_YAML = `name: 예지
position: 백엔드 개발자
company: 한화시스템

profile:
  email: yezi@example.com
  phone: 010-1234-5678
  github: https://github.com/yezi

education:
  - degree: 컴퓨터공학 학사
    school: 한국대학교
    period: 2019.03 - 2023.02

experience:
  - title: 백엔드 개발 인턴
    company: ABC 기술
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
  - name: 커뮤니티 플랫폼
    period: 2023.01 - 2023.06
    description: |
      - Express.js 기반 백엔드 서버 구축
      - JWT 인증 시스템 구현
      - Redis 캐싱 적용
    tech_stack: Node.js, Express, MongoDB, Redis`;

export function ResumeViewerPage() {
  const { id } = useParams();
  const resumeViewerRef = useRef(null);

  const yamlContent = SAMPLE_YAML;
  const showChatbot = false;
  const showPreview = false;

  const messages = [];
  const chatInput = "";
  const isUpdating = false;
  const isPaused = false;

  const handleSave = () => {};
  const handleDownload = () => {};
  const handleConfirmDownload = async () => {};

  const handleSaveAndStay = () => {};
  const handleDiscardAndLeave = () => {};
  const handleSendMessage = () => {};
  const setChatInput = () => {};
  const setIsPaused = () => {};

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
            onClick={() => {}}
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
        onClose={() => {}}
        messages={messages}
        chatInput={chatInput}
        onInputChange={setChatInput}
        onSendMessage={handleSendMessage}
        isUpdating={isUpdating}
        isPaused={isPaused}
        onTogglePause={() => {}}
      />

      {/* Preview Modal */}
      <GenericPreviewModal
        isOpen={showPreview}
        onClose={() => {}}
        title="이력서 미리보기"
        cancelButtonText="취소"
        actionButtonText="PDF 다운로드"
        onAction={handleConfirmDownload}
      >
        <ParsedResumeViewer yamlContent={yamlContent} />
      </GenericPreviewModal>

      <BottomNav />
    </div>
  );
}
