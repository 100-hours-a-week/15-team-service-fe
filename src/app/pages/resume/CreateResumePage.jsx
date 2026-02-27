import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/app/lib/toast';
import { AlertCircle, RefreshCw } from 'lucide-react';
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

export function CreateResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRepos = location.state?.selectedRepos || [];
  const masterProfile = location.state?.masterProfile || null;

  useEffect(() => {
    if (location.state?.fromResumeSetup) {
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [createdResumeId, setCreatedResumeId] = useState(() => {
    // ResumeProfileSetupPage에서 네비게이션했을 때만 sessionStorage 무시
    const fromResumeSetup = location.state?.fromResumeSetup;
    if (fromResumeSetup) {
      return null;
    }
    // 브라우저 새로고침 - sessionStorage에서 복구
    return sessionStorage.getItem('generatingResumeId') || null;
  });
  const [isClientTimeout, setIsClientTimeout] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

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
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      sessionStorage.setItem(
        'resumeCreatedMessage',
        '프로젝트 요약이 생성되었습니다'
      );
      setTimeout(() => {
        window.location.href = `/resume/${createdResumeId}`;
      }, 500);
    }
  }, [isGenerationSucceeded, isRedirecting, createdResumeId]);

  useEffect(() => {
    if (isGenerationFailed) {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
    }
  }, [isGenerationFailed]);

  useEffect(() => {
    if (isVersionError && createdResumeId) {
      toast.error('프로젝트 요약 상태를 확인할 수 없습니다');
    }
  }, [isVersionError, createdResumeId]);

  useEffect(() => {
    if (!createdResumeId || !isGenerating) return;

    const startedAt = sessionStorage.getItem('generatingStartedAt');
    if (!startedAt) return;

    const elapsed = Date.now() - parseInt(startedAt, 10);
    const remaining = GENERATION_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      setCreatedResumeId(null);
      setIsClientTimeout(true);
      toast.error('프로젝트 요약 생성 시간이 초과되었습니다');
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      setCreatedResumeId(null);
      setIsClientTimeout(true);
      toast.error('프로젝트 요약 생성 시간이 초과되었습니다');
    }, remaining);

    return () => clearTimeout(timer);
  }, [createdResumeId, isGenerating]);

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

  // 컴포넌트 unmount 시 sessionStorage 정리 (뒤로가기 등)
  useEffect(() => {
    return () => {
      if (!isGenerating && !createResumeMutation.isPending) {
        sessionStorage.removeItem('generatingResumeId');
        sessionStorage.removeItem('generatingStartedAt');
      }
    };
  }, [isGenerating, createResumeMutation.isPending]);

  const handleNext = useCallback(() => {
    if (!formData.positionId) {
      toast.error('희망 포지션을 선택해주세요');
      return;
    }
    setIsConfirmDialogOpen(true);
  }, [formData.positionId]);

  const handleConfirmGenerate = useCallback(() => {
    setIsConfirmDialogOpen(false);

    const repoUrls = selectedRepos.map(
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
          setCreatedResumeId(data);
          sessionStorage.setItem('generatingResumeId', data);
          sessionStorage.setItem('generatingStartedAt', Date.now().toString());
        },
      }
    );
  }, [selectedRepos, formData.positionId, createResumeMutation, masterProfile]);

  const handleRetryGeneration = useCallback(() => {
    setCreatedResumeId(null);
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
        <TopAppBar title="프로젝트 요약 생성 중" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h3>AI가 프로젝트 요약을 생성 중입니다</h3>
              <p className="text-sm text-gray-500">{statusMessage}</p>
              <p className="text-xs text-gray-400">
                생성이 완료될 때까지 잠시만 기다려주세요.
              </p>
              <p className="text-xs text-gray-400">
                최대 5분이 소요될 수 있습니다.
              </p>
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
      ? '프로젝트 요약 생성 시간이 초과되었습니다'
      : versionData?.errorLog || '알 수 없는 오류가 발생했습니다';

    return (
      <div className="min-h-screen flex flex-col">
        <TopAppBar
          title="프로젝트 요약 생성 실패"
          showBack
          onBack={() => navigate('/')}
          noTruncate
        />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <h3>프로젝트 요약 생성에 실패했습니다.</h3>
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
      <TopAppBar title="프로젝트 요약 생성" showBack />

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
              AI로 프로젝트 요약 생성
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmGenerate}
        title="프로젝트 요약을 생성하시겠어요?"
        description="선택한 리포지토리를 분석하여 AI가 프로젝트 요약을 생성합니다."
        confirmText="생성하기"
        cancelText="취소"
      />
    </div>
  );
}
