import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import yaml from 'js-yaml';
import {
  Save,
  Download,
  MessageCircle,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/app/lib/toast';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { ChatbotBottomSheet } from '../../components/features/ChatbotBottomSheet';
import { ParsedResumeViewer } from '../../components/features/ParsedResumeViewer';
import { WarningDialog } from '../../components/modals/WarningDialog';
import { Button } from '../../components/common/Button';
import { useChatbot } from '@/app/hooks/useChatbot';
import {
  useResumeDetail,
  useResumeVersion,
} from '@/app/hooks/queries/useResumeQueries';
import { useUserProfile } from '@/app/hooks/queries/useUserQuery';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import { useSaveResumeVersion } from '@/app/hooks/mutations/useResumeMutations';
import { usePdfExport } from '@/app/hooks/usePdfExport';

/**
 * Parse resume content from backend JSON and convert to YAML for viewing/parsing.
 * Backend sends: { techStack: [...], projects: [...] }
 */
function parseResumeContent(contentJson) {
  if (!contentJson || contentJson === '{}') {
    return '';
  }

  try {
    const content = JSON.parse(contentJson);
    const normalized = normalizeResumeContent(content);
    return yaml.dump(normalized, { noRefs: true, sortKeys: false });
  } catch {
    return contentJson;
  }
}

function normalizeResumeContent(content) {
  const projects = content?.projects;
  if (!Array.isArray(projects)) {
    return content;
  }

  const normalizedProjects = projects.map((project) => {
    if (!project || typeof project !== 'object') return project;
    const description = project.description;
    if (typeof description !== 'string') return project;

    const lines = description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^-\s*/, ''));

    if (lines.length === 0) return project;

    return { ...project, description: lines };
  });

  return { ...content, projects: normalizedProjects };
}

export function ResumeViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resumeId = parseInt(id, 10);
  const resumeViewerRef = useRef(null);

  const {
    data: resumeDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useResumeDetail(resumeId);

  const { data: userProfile } = useUserProfile();
  const { data: positions = [] } = usePositions();

  const currentVersionNo = resumeDetail?.currentVersionNo || 1;

  const {
    data: versionData,
    isLoading: isLoadingVersion,
    refetch: refetchVersion,
  } = useResumeVersion(resumeId, currentVersionNo, {
    enabled: !!resumeDetail,
  });

  const saveVersionMutation = useSaveResumeVersion();

  const [yamlContent, setYamlContent] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  const {
    showPDFViewer,
    pdfPage,
    pdfNumPages,
    pdfCanvasEl,
    isPdfRendering,
    pdfRenderError,
    pdfUrl,
    handleExportPDF,
    handleClosePDF,
    handleConfirmDownload,
    setPdfPage,
  } = usePdfExport({
    yamlContent,
    userProfile,
    positions,
    resumeName: resumeDetail?.name,
  });

  useEffect(() => {
    if (versionData?.content && versionData.status === 'SUCCEEDED') {
      const parsed = parseResumeContent(versionData.content);
      setYamlContent(parsed);
      setRawContent(versionData.content);
      setHasUnsavedChanges(versionData.committedAt === null);
    }
  }, [versionData]);

  // 프로젝트 요약 생성 완료 메시지 표시
  useEffect(() => {
    const message = sessionStorage.getItem('resumeCreatedMessage');
    if (message) {
      sessionStorage.removeItem('resumeCreatedMessage');
      setTimeout(() => {
        toast.success(message);
      }, 300);
    }
  }, []);

  const {
    messages,
    chatInput,
    isUpdating,
    isConnected,
    onInputChange,
    onSendMessage,
  } = useChatbot({
    resumeId,
    onUpdate: (resumeData) => {
      // Handle SSE event data (resume object)
      if (resumeData) {
        const yamlString = yaml.dump(resumeData, {
          noRefs: true,
          sortKeys: false,
        });
        setYamlContent(yamlString);
        setRawContent(JSON.stringify(resumeData));
        setHasUnsavedChanges(true);
      }
    },
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(() => {
    if (versionData?.status !== 'SUCCEEDED') {
      toast.error('이력서 생성이 완료된 후 저장할 수 있습니다');
      return;
    }

    saveVersionMutation.mutate(
      { resumeId, versionNo: currentVersionNo },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          toast.success('이력서가 저장되었습니다.');
        },
      }
    );
  }, [resumeId, currentVersionNo, versionData?.status, saveVersionMutation]);

  const handleSaveAndStay = useCallback(() => {
    setHasUnsavedChanges(false);
    toast.success('저장되었습니다.');
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  const handleDiscardAndLeave = useCallback(() => {
    setHasUnsavedChanges(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const status = versionData?.status;
  const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
  const isFailed = status === 'FAILED';

  if (isLoadingDetail || isLoadingVersion) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="이력서" showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">이력서를 불러오는 중...</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isDetailError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="이력서" showBack />
        <div className="px-5 py-9">
          <div className="max-w-[390px] mx-auto">
            <div className="flex flex-col items-center bg-white rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <p className="text-gray-500">이력서를 불러오지 못 했습니다.</p>
              <Button variant="primary" onClick={() => refetchDetail()}>
                재시도
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title={resumeDetail?.name || '이력서'} showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h3>AI가 이력서를 생성 중입니다.</h3>
              <p className="text-sm text-gray-500">
                {status === 'QUEUED' ? '대기 중...' : '분석 중...'}
              </p>
              <p className="text-xs text-gray-400">
                잠시만 기다려주세요. 페이지를 벗어나도 진행됩니다.
              </p>
              <Button variant="ghost" onClick={() => navigate('/')}>
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title={resumeDetail?.name || '이력서'} showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <h3>프로젝트 요약 생성에 실패했습니다.</h3>
              <p className="text-sm text-gray-500">
                {versionData?.errorLog || '알 수 없는 오류가 발생했습니다'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" onClick={() => navigate('/')}>
                  홈으로
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    refetchVersion();
                    refetchDetail();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <TopAppBar
        title={resumeDetail?.name || '이력서'}
        showBack
        action={
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="이력서 저장"
            >
              <Save className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="PDF 다운로드"
            >
              <Download className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      <div className="px-5 py-2">
        <div className="max-w-[390px] mx-auto relative">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`
                flex-1 min-h-[44px] px-4 py-3 font-medium text-sm transition-colors
                border-b-2
                ${
                  activeTab === 'preview'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }
              `}
            >
              미리보기
            </button>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`
                flex-1 min-h-[44px] px-4 py-3 font-medium text-sm transition-colors
                border-b-2
                ${
                  activeTab === 'yaml'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }
              `}
            >
              YAML
            </button>
          </div>

          {yamlContent ? (
            activeTab === 'preview' ? (
              <ParsedResumeViewer
                ref={resumeViewerRef}
                yamlContent={rawContent || yamlContent}
              />
            ) : (
              <div className="bg-gray-900 rounded-2xl p-4 overflow-auto max-w-[390px] mx-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {yamlContent}
                </pre>
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500">이력서 내용이 없습니다.</p>
            </div>
          )}

          <button
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-24 right-[calc(50%-195px+20px)] w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-10"
            aria-label="AI 챗봇 열기"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <ChatbotBottomSheet
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        messages={messages}
        chatInput={chatInput}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        isUpdating={isUpdating}
        isConnected={isConnected}
      />

      {showPDFViewer && pdfUrl && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClosePDF}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[320px] h-[80vh] flex flex-col shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">PDF 미리보기</h3>
                <button
                  onClick={handleClosePDF}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-4 min-h-0">
                <div className="w-full h-full overflow-y-auto">
                  {isPdfRendering && (
                    <div className="text-sm text-gray-500 text-center py-6">
                      PDF를 불러오는 중...
                    </div>
                  )}
                  {pdfRenderError && !isPdfRendering && (
                    <div className="text-sm text-red-500 text-center py-6">
                      {pdfRenderError}
                    </div>
                  )}
                  <canvas
                    ref={pdfCanvasEl}
                    className="w-full rounded-lg border border-gray-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 pb-3">
                <button
                  type="button"
                  onClick={() => setPdfPage((prev) => Math.max(1, prev - 1))}
                  disabled={pdfPage <= 1 || isPdfRendering}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    pdfPage <= 1 || isPdfRendering
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {pdfNumPages ? `${pdfPage} / ${pdfNumPages}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPdfPage((prev) =>
                      Math.min(pdfNumPages || prev, prev + 1)
                    )
                  }
                  disabled={
                    pdfNumPages === 0 ||
                    pdfPage >= pdfNumPages ||
                    isPdfRendering
                  }
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    pdfNumPages === 0 ||
                    pdfPage >= pdfNumPages ||
                    isPdfRendering
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  다음
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <Button variant="secondary" onClick={handleClosePDF}>
                  닫기
                </Button>
                <Button variant="primary" onClick={handleConfirmDownload}>
                  다운로드
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

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
