import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import yaml from 'js-yaml';
import {
  Save,
  Download,
  MessageCircle,
  AlertCircle,
  X,
  RefreshCw,
  History,
} from 'lucide-react';
import { Drawer } from 'vaul';
import { toast } from '@/app/lib/toast';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { ChatbotBottomSheet } from '../../components/features/ChatbotBottomSheet';
import { ParsedResumeViewer } from '../../components/features/ParsedResumeViewer';
import { UnsavedChangesDialog } from '../../components/modals/UnsavedChangesDialog';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
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

function formatVersionDate(isoStr) {
  const diffDays = Math.floor(
    (Date.now() - new Date(isoStr)) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${diffDays}일 전`;
}

const MOCK_VERSIONS = [
  {
    versionNo: 5,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    yamlContent:
      'techStack:\n  - React\n  - TypeScript\n  - Tailwind CSS v4\nprojects:\n  - name: CommitMe\n    description:\n      - 이력서 관리 및 면접 준비 플랫폼 개발\n      - React Query로 서버 상태 관리\n    techStack: React, Node.js, PostgreSQL',
  },
  {
    versionNo: 4,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    yamlContent:
      'techStack:\n  - React\n  - TypeScript\n  - Tailwind CSS\nprojects:\n  - name: CommitMe\n    description:\n      - 이력서 관리 플랫폼 개발\n      - Zustand로 상태 관리\n    techStack: React, Node.js',
  },
  {
    versionNo: 3,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    yamlContent:
      'techStack:\n  - React\n  - JavaScript\n  - CSS\nprojects:\n  - name: CommitMe\n    description:\n      - 이력서 관리 플랫폼 초기 개발\n    techStack: React, Express',
  },
  {
    versionNo: 2,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    yamlContent:
      'techStack:\n  - React\n  - JavaScript\nprojects:\n  - name: Portfolio\n    description:\n      - 포트폴리오 사이트 제작\n    techStack: React',
  },
  {
    versionNo: 1,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    yamlContent:
      'techStack:\n  - HTML\n  - CSS\n  - JavaScript\nprojects:\n  - name: Portfolio\n    description:\n      - 최초 포트폴리오 사이트 제작\n    techStack: Vanilla JS',
  },
];

/**
 * Line-by-line diff between two YAML content strings.
 * Returns array of { type: 'added'|'removed'|'same', line, key }
 * Compares selectedVersion (old) vs current yamlContent (new).
 */
function computeDiff(oldContent, newContent) {
  const oldLines = (oldContent || '').split('\n');
  const newLines = (newContent || '').split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const result = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) {
      result.push({ type: 'added', line: newLine, key: `a-${i}` });
    } else if (newLine === undefined) {
      result.push({ type: 'removed', line: oldLine, key: `r-${i}` });
    } else if (oldLine !== newLine) {
      result.push({ type: 'removed', line: oldLine, key: `r-${i}` });
      result.push({ type: 'added', line: newLine, key: `ad-${i}` });
    } else {
      result.push({ type: 'same', line: oldLine, key: `s-${i}` });
    }
  }

  return result;
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
    error: detailError,
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiffMode, setShowDiffMode] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  // Tracks which version was already initialized so refetch after save
  // doesn't override hasUnsavedChanges back to true
  const initializedVersionRef = useRef(null);

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

      const versionKey = `${resumeId}-${currentVersionNo}`;
      if (initializedVersionRef.current !== versionKey) {
        initializedVersionRef.current = versionKey;
        setHasUnsavedChanges(versionData.committedAt === null);
      }
    }
  }, [versionData, resumeId, currentVersionNo]);

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

  const isEditing = resumeDetail?.isEditing ?? false;

  // SSE resume-refresh-required 이벤트를 직접 감지해 최신 데이터로 즉시 갱신
  useEffect(() => {
    const handler = (e) => {
      if (Number(e.detail.resumeId) !== resumeId) return;
      refetchDetail();
      refetchVersion();
    };
    window.addEventListener('sse:resume-refresh-required', handler);
    return () =>
      window.removeEventListener('sse:resume-refresh-required', handler);
  }, [resumeId, refetchDetail, refetchVersion]);

  const {
    messages,
    chatInput,
    isUpdating,
    isConnected,
    onInputChange,
    onSendMessage,
  } = useChatbot({ resumeId, isEditing });

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

  const handleSaveAndLeave = useCallback(() => {
    saveVersionMutation.mutate(
      { resumeId, versionNo: currentVersionNo },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          if (blocker.state === 'blocked') {
            blocker.proceed();
          }
        },
      }
    );
  }, [resumeId, currentVersionNo, saveVersionMutation, blocker]);

  const handleDiscardAndLeave = useCallback(() => {
    setHasUnsavedChanges(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setShowDiffMode(false);
  };

  const diffLines = useMemo(
    () => computeDiff(selectedVersion?.yamlContent || '', yamlContent),
    [selectedVersion?.yamlContent, yamlContent]
  );

  const handleRestoreVersion = () => {
    saveVersionMutation.mutate(
      { resumeId, versionNo: selectedVersion.versionNo },
      {
        onSuccess: () => {
          toast.success('선택한 버전을 최신으로 지정했습니다');
          setShowRestoreModal(false);
          setSelectedVersion(null);
          setShowVersionHistory(false);
          setShowDiffMode(false);
        },
      }
    );
  };

  const status = versionData?.status;
  const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
  const isFailed = status === 'FAILED';

  if (isLoadingDetail || isLoadingVersion) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
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
    const is404 = detailError?.response?.status === 404;
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopAppBar title="이력서" showBack />
        <div className="px-5 py-9">
          <div className="max-w-[390px] mx-auto">
            <div className="flex flex-col items-center bg-white rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              {is404 ? (
                <>
                  <p className="text-gray-500">존재하지 않는 이력서입니다.</p>
                  <Button variant="primary" onClick={() => navigate('/')}>
                    홈으로 이동
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500">
                    이력서를 불러오지 못 했습니다.
                  </p>
                  <Button variant="primary" onClick={() => refetchDetail()}>
                    재시도
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
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
      <div className="min-h-screen bg-gray-50 pb-24">
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
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <TopAppBar
        title={resumeDetail?.name || '이력서'}
        showBack
        action={
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => setShowVersionHistory(true)}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="버전 기록"
            >
              <History className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
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
        isEditing={isEditing}
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

      {/* Version History List Sheet */}
      <Drawer.Root
        open={showVersionHistory && !selectedVersion}
        onOpenChange={(open) => {
          if (!open) setShowVersionHistory(false);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col max-w-[390px] mx-auto w-full max-h-[75vh]">
            {/* Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <Drawer.Title className="text-base font-semibold">
                버전 기록
              </Drawer.Title>
              <button
                type="button"
                onClick={() => setShowVersionHistory(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Version list */}
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {MOCK_VERSIONS.map((version) => {
                const isCurrent = version.versionNo === currentVersionNo;
                return (
                  <button
                    key={version.versionNo}
                    type="button"
                    onClick={() => handleVersionSelect(version)}
                    className="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          버전 {version.versionNo}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                            현재
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatVersionDate(version.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Version Detail Sheet */}
      <Drawer.Root
        open={showVersionHistory && !!selectedVersion}
        onOpenChange={(open) => {
          if (!open) setSelectedVersion(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col max-w-[390px] mx-auto w-full max-h-[80vh]">
            {/* Handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVersion(null)}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors mr-1"
                  aria-label="목록으로"
                >
                  <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                </button>
                <Drawer.Title className="text-base font-semibold">
                  버전 {selectedVersion?.versionNo}
                </Drawer.Title>
                {selectedVersion?.versionNo === currentVersionNo && (
                  <span className="text-xs font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                    현재
                  </span>
                )}
              </div>

              {/* Diff toggle */}
              <button
                type="button"
                onClick={() => setShowDiffMode((prev) => !prev)}
                className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors min-h-[36px] ${
                  showDiffMode
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                변경점 표시
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0">
              {showDiffMode ? (
                <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs">
                  {diffLines.map(({ type, line, key }) => (
                    <div
                      key={key}
                      className={`whitespace-pre-wrap ${
                        type === 'added'
                          ? 'text-green-400 bg-green-900/20'
                          : type === 'removed'
                            ? 'text-red-400 bg-red-900/20'
                            : 'text-gray-400'
                      }`}
                    >
                      {type === 'added'
                        ? '+ '
                        : type === 'removed'
                          ? '- '
                          : '  '}
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl p-4">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {selectedVersion?.yamlContent}
                  </pre>
                </div>
              )}
            </div>

            {/* CTA */}
            {selectedVersion?.versionNo !== currentVersionNo && (
              <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowRestoreModal(true)}
                >
                  이 버전을 최신으로 지정
                </Button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestoreVersion}
        title="이 버전을 최신으로 지정할까요?"
        description="선택한 과거 버전을 기준으로 현재 이력서가 최신 상태로 저장돼요."
        confirmText="지정하기"
      />

      <UnsavedChangesDialog
        isOpen={blocker.state === 'blocked'}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscardAndLeave={handleDiscardAndLeave}
      />

      <BottomNav />
    </div>
  );
}
