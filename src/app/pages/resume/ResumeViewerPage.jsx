import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import {
  // Save,
  Download,
  // MessageCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/app/lib/toast';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
// import { ChatbotBottomSheet } from '../../components/features/ChatbotBottomSheet';
import { ParsedResumeViewer } from '../../components/features/ParsedResumeViewer';
import { PreviewSheet } from '../../components/modals/PreviewSheet';
import { WarningDialog } from '../../components/modals/WarningDialog';
import { Button } from '../../components/common/Button';
// import { useChatbot } from '@/app/hooks/useChatbot';
import {
  useResumeDetail,
  useResumeVersion,
} from '@/app/hooks/queries/useResumeQueries';
// import { useSaveResumeVersion } from '@/app/hooks/mutations/useResumeMutations';
import { useGenerateResumePDF } from '@/app/hooks/mutations/useResumeMutations';

/**
 * Parse resume content JSON from backend and return as-is for ParsedResumeViewer
 * Backend sends: { techStack: [...], projects: [...] }
 */
function parseResumeContent(contentJson) {
  if (!contentJson || contentJson === '{}') {
    return '';
  }

  try {
    const content = JSON.parse(contentJson);
    return JSON.stringify(content, null, 2);
  } catch {
    return contentJson;
  }
}

export function ResumeViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resumeId = parseInt(id, 10);
  const resumeViewerRef = useRef(null);
  const previewContentRef = useRef(null);

  const {
    data: resumeDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useResumeDetail(resumeId);

  const currentVersionNo = resumeDetail?.currentVersionNo || 1;

  const {
    data: versionData,
    isLoading: isLoadingVersion,
    refetch: refetchVersion,
  } = useResumeVersion(resumeId, currentVersionNo, {
    enabled: !!resumeDetail,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'QUEUED' || status === 'PROCESSING') {
        return 3000;
      }
      return false;
    },
  });

  // const saveVersionMutation = useSaveResumeVersion();
  const generatePDFMutation = useGenerateResumePDF();

  const [yamlContent, setYamlContent] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [showChatbot, setShowChatbot] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (versionData?.content && versionData.status === 'SUCCEEDED') {
      const parsed = parseResumeContent(versionData.content);
      setYamlContent(parsed);
    }
  }, [versionData]);

  // const {
  //   messages,
  //   chatInput,
  //   isUpdating,
  //   isPaused,
  //   onInputChange,
  //   onSendMessage,
  //   onTogglePause,
  // } = useChatbot({
  //   onUpdate: (content) => {
  //     setYamlContent((prev) => prev + content);
  //     setHasUnsavedChanges(true);
  //   },
  // });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // const handleSave = useCallback(() => {
  //   if (versionData?.status !== 'SUCCEEDED') {
  //     toast.error('이력서 생성이 완료된 후 저장할 수 있습니다');
  //     return;
  //   }
  //
  //   saveVersionMutation.mutate(
  //     { resumeId, versionNo: currentVersionNo },
  //     {
  //       onSuccess: () => {
  //         setHasUnsavedChanges(false);
  //       },
  //     }
  //   );
  // }, [resumeId, currentVersionNo, versionData?.status, saveVersionMutation]);

  const handleOpenPreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  // const handleSaveAndPreview = useCallback(() => {
  //   handleSave();
  //   setShowPreview(true);
  // }, [handleSave]);

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

  const handleConfirmDownload = useCallback(() => {
    if (!previewContentRef.current) {
      toast.error('이력서를 찾을 수 없습니다.');
      return;
    }

    generatePDFMutation.mutate(
      {
        element: previewContentRef.current,
        filename: `${resumeDetail?.name || '이력서'}.pdf`,
      },
      {
        onSettled: () => {
          setShowPreview(false);
        },
      }
    );
  }, [previewContentRef, resumeDetail?.name, generatePDFMutation]);

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
              <h3>이력서 생성에 실패했습니다.</h3>
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
            {/* <button
              onClick={handleSaveAndPreview}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="이력서 저장"
            >
              <Save className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button> */}
            <button
              onClick={handleOpenPreview}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                yamlContent={yamlContent}
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

          {/* <button
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-24 right-[calc(50%-195px+20px)] w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-10"
            aria-label="AI 챗봇 열기"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </button> */}
        </div>
      </div>

      {/* <ChatbotBottomSheet
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        messages={messages}
        chatInput={chatInput}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        isUpdating={isUpdating}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      /> */}

      <PreviewSheet
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleConfirmDownload}
        contentRef={previewContentRef}
      >
        <ParsedResumeViewer yamlContent={yamlContent} />
      </PreviewSheet>

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
