import { useState, useCallback, useEffect } from 'react';
import { useDialogStore } from '@/app/store/useDialogStore';
import { useResumeCreationStore } from '@/app/store/useResumeCreationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/app/lib/toast';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { StepProgress } from '../../components/common/StepProgress';
import { SelectGrid } from '../../components/common/SelectGrid';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import { useCreateResume } from '@/app/hooks/mutations/useResumeMutations';
import { useResumeVersion } from '@/app/hooks/queries/useResumeQueries';

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000 + 30 * 1000; // 5분 30초

function StageStep({ label, isActive, isDone }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
          isDone
            ? 'bg-green-400'
            : isActive
              ? 'bg-primary animate-pulse'
              : 'bg-gray-200'
        }`}
      />
      <span
        className={`text-[10px] transition-colors duration-300 ${
          isDone
            ? 'text-green-500'
            : isActive
              ? 'text-primary font-medium'
              : 'text-gray-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function CreateResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRepos = location.state?.selectedRepos || [];
  const masterProfile = location.state?.masterProfile || null;

  useEffect(() => {
    if (location.state?.fromResumeSetup) {
      // Coming from ResumeProfileSetupPage — discard any persisted generation state
      useResumeCreationStore.getState().cancelGeneration();
      navigate(location.pathname, {
        replace: true,
        state: { selectedRepos, masterProfile },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: positions = [], isLoading: isLoadingPositions } =
    usePositions();
  const createResumeMutation = useCreateResume();

  const [formData, setFormData] = useState({ positionId: null });
  const [progressValue, setProgressValue] = useState(0);
  const isConfirmDialogOpen = useDialogStore(
    (s) => s.openDialogs['resumeCreateConfirm']
  );
  // Restored from sessionStorage on browser refresh via Zustand persist
  const createdResumeId = useResumeCreationStore((s) => s.generatingResumeId);
  const generatingStartedAt = useResumeCreationStore(
    (s) => s.generatingStartedAt
  );
  const [isClientTimeout, setIsClientTimeout] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Manage progress bar value based on generation status
  useEffect(() => {
    if (createResumeMutation.isPending && !createdResumeId) {
      setProgressValue(10);
      return;
    }
    if (isRedirecting) {
      setProgressValue(100);
      return;
    }
    if (!normalizedStatus) {
      setProgressValue(15);
      return;
    }
    if (normalizedStatus === 'QUEUED') {
      setProgressValue(20);
      return;
    }
    if (normalizedStatus === 'PROCESSING') {
      setProgressValue((prev) => Math.max(prev, 35));
      const id = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 85) return prev;
          return prev + 0.4;
        });
      }, 3000);
      return () => clearInterval(id);
    }
  }, [
    createResumeMutation.isPending,
    createdResumeId,
    isRedirecting,
    normalizedStatus,
  ]);

  useEffect(() => {
    return () => {
      useDialogStore.getState().closeDialog('resumeCreateConfirm');
    };
  }, []);

  const handleOpenConfirmDialog = useCallback(() => {
    useDialogStore.getState().openDialog('resumeCreateConfirm');
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    useDialogStore.getState().closeDialog('resumeCreateConfirm');
  }, []);

  const { data: versionData, isError: isVersionError } = useResumeVersion(
    createdResumeId,
    1,
    {
      enabled: !!createdResumeId,
      refetchInterval: (query) => {
        const status = query.state.data?.status?.toUpperCase();
        if (!status || status === 'QUEUED' || status === 'PROCESSING') {
          return 3000;
        }
        return false;
      },
      retry: 2,
    }
  );
  const normalizedStatus = versionData?.status?.toUpperCase();

  const generationStatus = versionData?.status;
  const normalizedStatus = generationStatus?.toUpperCase();
  const isGenerating =
    createdResumeId &&
    (!normalizedStatus ||
      normalizedStatus === 'QUEUED' ||
      normalizedStatus === 'PROCESSING');
  const isGenerationFailed = normalizedStatus === 'FAILED';
  const isGenerationSucceeded =
    !!normalizedStatus &&
    !['QUEUED', 'PROCESSING', 'FAILED'].includes(normalizedStatus);

  useEffect(() => {
    if (isGenerationSucceeded && !isRedirecting) {
      setIsRedirecting(true);
      useResumeCreationStore
        .getState()
        .completeGeneration('프로젝트 요약이 생성되었습니다');
      setTimeout(() => {
        window.location.href = `/resume/${createdResumeId}`;
      }, 500);
    }
  }, [isGenerationSucceeded, isRedirecting, createdResumeId]);

  useEffect(() => {
    if (isGenerationFailed) {
      useResumeCreationStore.getState().cancelGeneration();
    }
  }, [isGenerationFailed]);

  useEffect(() => {
    if (isVersionError && createdResumeId) {
      toast.error('이력서 상태를 확인할 수 없습니다');
    }
  }, [isVersionError, createdResumeId]);

  useEffect(() => {
    if (!createdResumeId || !isGenerating) return;
    if (!generatingStartedAt) return;

    const elapsed = Date.now() - generatingStartedAt;
    const remaining = GENERATION_TIMEOUT_MS - elapsed;

    const timeout = () => {
      useResumeCreationStore.getState().cancelGeneration();
      setIsClientTimeout(true);
      toast.error('이력서 생성 시간이 초과되었습니다');
    };

    if (remaining <= 0) {
      timeout();
      return;
    }

    const timer = setTimeout(timeout, remaining);
    return () => clearTimeout(timer);
  }, [createdResumeId, isGenerating, generatingStartedAt]);

  // 생성 중 브라우저 새로고침/탭 닫기 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (createResumeMutation.isPending || isGenerating) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [createResumeMutation.isPending, isGenerating]);

  // 컴포넌트 unmount 시 진행 중 상태 정리 (뒤로가기 등)
  useEffect(() => {
    return () => {
      if (!isGenerating && !createResumeMutation.isPending) {
        useResumeCreationStore.getState().cancelGeneration();
      }
    };
  }, [isGenerating, createResumeMutation.isPending]);

  const handleNext = useCallback(() => {
    if (!formData.positionId) {
      toast.error('희망 포지션을 선택해주세요');
      return;
    }
    handleOpenConfirmDialog();
  }, [formData.positionId, handleOpenConfirmDialog]);

  const handleConfirmGenerate = useCallback(() => {
    handleCloseConfirmDialog();

    const repoUrls = (location.state?.selectedRepos || []).map(
      (repo) => repo.htmlUrl || `https://github.com/${repo.owner}/${repo.name}`
    );

    createResumeMutation.mutate(
      {
        repoUrls,
        positionId: formData.positionId,
        masterProfile,
      },
      {
        onSuccess: (data) => {
          useResumeCreationStore.getState().startGeneration(data);
        },
      }
    );
  }, [
    location.state?.selectedRepos,
    formData.positionId,
    createResumeMutation,
    masterProfile,
    handleCloseConfirmDialog,
  ]);

  const handleRetryGeneration = useCallback(() => {
    useResumeCreationStore.getState().cancelGeneration();
    setIsClientTimeout(false);
  }, []);

  if (createResumeMutation.isPending || isGenerating || isRedirecting) {
    const statusMessage = !createdResumeId
      ? '요청 중...'
      : isRedirecting
        ? '완료!'
        : normalizedStatus === 'QUEUED'
          ? '대기 중...'
          : '분석 중...';

    return (
      <div className="min-h-screen flex flex-col">
        <TopAppBar title="이력서 생성 중" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="bg-white rounded-2xl p-8 text-center space-y-6">
              {/* Animated icon */}
              {isRedirecting ? (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              )}

              <h3>
                {isRedirecting
                  ? '생성이 완료되었습니다!'
                  : 'AI가 프로젝트 요약을 생성 중입니다'}
              </h3>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{statusMessage}</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isRedirecting ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>

              {/* Stage indicators */}
              <div className="flex items-center justify-center gap-1">
                <StageStep
                  label="요청"
                  isActive={!createdResumeId && createResumeMutation.isPending}
                  isDone={!!createdResumeId}
                />
                <div className="w-6 h-px bg-gray-200" />
                <StageStep
                  label="대기"
                  isActive={normalizedStatus === 'QUEUED'}
                  isDone={normalizedStatus === 'PROCESSING' || isRedirecting}
                />
                <div className="w-6 h-px bg-gray-200" />
                <StageStep
                  label="분석"
                  isActive={normalizedStatus === 'PROCESSING'}
                  isDone={isRedirecting}
                />
                <div className="w-6 h-px bg-gray-200" />
                <StageStep
                  label="완료"
                  isActive={isRedirecting}
                  isDone={false}
                />
              </div>

              {!isRedirecting && (
                <p className="text-xs text-gray-400">
                  최대 5분이 소요될 수 있습니다.
                </p>
              )}

              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                className="mx-auto w-fit"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerationFailed || isClientTimeout) {
    const errorMessage = isClientTimeout
      ? '이력서 생성 시간이 초과되었습니다'
      : versionData?.errorLog || '알 수 없는 오류가 발생했습니다';

    return (
      <div className="min-h-screen flex flex-col">
        <TopAppBar
          title="이력서 생성 실패"
          showBack
          onBack={() => navigate('/')}
          noTruncate
        />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <h3>이력서 생성에 실패했습니다.</h3>
              <p className="text-sm text-gray-500">{errorMessage}</p>
              <div className="flex justify-center">
                <Button variant="primary" onClick={handleRetryGeneration}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  다시 시도
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const positionItems = positions.map((p) => p.name);
  const selectedPositionName = positions.find(
    (p) => p.id === formData.positionId
  )?.name;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopAppBar title="이력서 생성" showBack />

      <StepProgress current={1} total={1} />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          {selectedRepos.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-primary/20">
              <p className="text-xs text-primary mb-2">
                선택된 레포지토리 ({selectedRepos.length}개)
              </p>
              <div className="space-y-2">
                {selectedRepos.map((repo) => (
                  <div key={repo.id}>
                    <h4 className="text-primary font-medium">{repo.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="mb-2">희망 포지션을 선택하세요.</h2>
              <p className="text-sm text-gray-600">
                프로젝트 요약에 맞춤형 내용이 생성됩니다.
              </p>
            </div>

            {isLoadingPositions ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <SelectGrid
                items={positionItems}
                selected={selectedPositionName || ''}
                onSelect={(posName) => {
                  const position = positions.find((p) => p.name === posName);
                  setFormData({
                    ...formData,
                    positionId: position?.id || null,
                  });
                }}
              />
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={handleNext}
              disabled={!formData.positionId}
            >
              AI로 이력서 생성
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmGenerate}
        title="프로젝트 요약을 생성하시겠어요?"
        description="선택한 리포지토리를 분석하여 AI가 프로젝트 요약을 생성합니다."
        confirmText="생성하기"
        cancelText="취소"
      />
    </div>
  );
}
