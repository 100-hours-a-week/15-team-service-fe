import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useBlocker } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { StepProgress } from '../../components/common/StepProgress';
import { SelectGrid } from '../../components/common/SelectGrid';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
// import { useCompanies } from '@/app/hooks/queries/useCompaniesQuery';
import { useCreateResume } from '@/app/hooks/mutations/useResumeMutations';
import { useResumeVersion } from '@/app/hooks/queries/useResumeQueries';

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000 + 30 * 1000; // 5분 30초

export function CreateResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRepos = useMemo(
    () => location.state?.selectedRepos || [],
    [location.state?.selectedRepos]
  );

  const { data: positions = [], isLoading: isLoadingPositions } =
    usePositions();
  // const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const createResumeMutation = useCreateResume();

  const [step] = useState(1);
  const [formData, setFormData] = useState({
    positionId: null,
    // companyId: null, // v1: company selection disabled
  });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [createdResumeId, setCreatedResumeId] = useState(() => {
    return sessionStorage.getItem('generatingResumeId') || null;
  });
  const [isClientTimeout, setIsClientTimeout] = useState(false);

  const handleOpenConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(true);
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);

  const { data: versionData, isError: isVersionError } = useResumeVersion(
    createdResumeId,
    1,
    {
      enabled: !!createdResumeId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === 'QUEUED' || status === 'PROCESSING') {
          return 3000;
        }
        return false;
      },
      retry: 2,
    }
  );

  const generationStatus = versionData?.status;
  const isGenerating =
    createdResumeId &&
    (!generationStatus ||
      generationStatus === 'QUEUED' ||
      generationStatus === 'PROCESSING');
  const isGenerationFailed = generationStatus === 'FAILED';
  const isGenerationSucceeded = generationStatus === 'SUCCEEDED';

  useEffect(() => {
    if (isGenerationSucceeded) {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      toast.success('이력서가 생성되었습니다');
      navigate('/home');
    }
  }, [isGenerationSucceeded, navigate]);

  useEffect(() => {
    if (isGenerationFailed) {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
    }
  }, [isGenerationFailed]);

  // API 에러 시 (이력서가 없거나 조회 실패) sessionStorage 정리
  useEffect(() => {
    if (isVersionError && createdResumeId) {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      setCreatedResumeId(null);
      toast.error('이력서 상태를 확인할 수 없습니다');
    }
  }, [isVersionError, createdResumeId]);

  useEffect(() => {
    if (!createdResumeId || !isGenerating) return;

    const startedAt = sessionStorage.getItem('generatingStartedAt');
    if (!startedAt) return;

    const elapsed = Date.now() - parseInt(startedAt, 10);
    const remaining = GENERATION_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      // 이미 타임아웃됨
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      setCreatedResumeId(null);
      setIsClientTimeout(true);
      toast.error('이력서 생성 시간이 초과되었습니다');
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.removeItem('generatingResumeId');
      sessionStorage.removeItem('generatingStartedAt');
      setCreatedResumeId(null);
      setIsClientTimeout(true);
      toast.error('이력서 생성 시간이 초과되었습니다');
    }, remaining);

    return () => clearTimeout(timer);
  }, [createdResumeId, isGenerating]);

  // 생성 중 라우터 이탈 차단
  const isBlocked = createResumeMutation.isPending || isGenerating;
  useBlocker(() => isBlocked);

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

  const handleNext = useCallback(() => {
    if (!formData.positionId) {
      toast.error('희망 포지션을 선택해주세요');
      return;
    }
    handleOpenConfirmDialog();
  }, [formData.positionId, handleOpenConfirmDialog]);

  const handleConfirmGenerate = useCallback(() => {
    setIsConfirmDialogOpen(false);

    const repoUrls = selectedRepos.map(
      (repo) => repo.htmlUrl || `https://github.com/${repo.owner}/${repo.name}`
    );

    createResumeMutation.mutate(
      {
        repoUrls,
        positionId: formData.positionId,
        // companyId: formData.companyId, // v1: company selection disabled
      },
      {
        onSuccess: (data) => {
          setCreatedResumeId(data);
          sessionStorage.setItem('generatingResumeId', data);
          sessionStorage.setItem('generatingStartedAt', Date.now().toString());
        },
      }
    );
  }, [selectedRepos, formData.positionId, createResumeMutation]);

  const handleRetryGeneration = useCallback(() => {
    setCreatedResumeId(null);
    setIsClientTimeout(false);
  }, []);

  if (createResumeMutation.isPending || isGenerating) {
    const statusMessage = !createdResumeId
      ? '요청 중...'
      : generationStatus === 'QUEUED'
        ? '대기 중...'
        : '분석 중...';

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopAppBar title="이력서 생성 중" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h3>AI가 이력서를 생성 중입니다</h3>
              <p className="text-sm text-gray-500">{statusMessage}</p>
              <p className="text-xs text-gray-400">
                생성이 완료될 때까지 잠시만 기다려주세요.
              </p>
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
          onBack={() => navigate('/home')}
          noTruncate
        />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
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
  // const companyItems = ['미지정', ...companies.map((c) => c.name)];
  // const selectedCompanyName =
  //   companies.find((c) => c.id === formData.companyId)?.name || '미지정';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopAppBar title="이력서 생성" showBack />

      <StepProgress current={step} total={1} />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          {selectedRepos.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-primary/20">
              <p className="text-xs text-primary mb-2">
                선택된 레포지토리 ({selectedRepos.length}개)
              </p>
              <div className="space-y-2">
                {selectedRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between"
                  >
                    <h4 className="text-primary font-medium">{repo.name}</h4>
                    <span className="text-xs text-primary/60">#{repo.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">희망 포지션을 선택하세요.</h2>
                <p className="text-sm text-gray-600">
                  이력서에 맞춤형 내용이 생성됩니다.
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
          )}

          {/*
            v1: company selection disabled

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">희망 기업을 선택하세요</h2>
                <p className="text-sm text-gray-600">
                  선택사항입니다. 미지정으로 진행할 수 있어요
                </p>
              </div>

              {isLoadingCompanies ? (
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
                  items={companyItems}
                  selected={selectedCompanyName}
                  onSelect={(companyName) => {
                    if (companyName === '미지정') {
                      setFormData({ ...formData, companyId: null });
                      return;
                    }
                    const company = companies.find((c) => c.name === companyName);
                    setFormData({ ...formData, companyId: company?.id || null });
                  }}
                />
              )}

              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleOpenConfirmDialog}
                >
                  AI로 이력서 생성
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setStep(1)}>
                  이전
                </Button>
              </div>
            </div>
          )}
          */}
        </div>
      </div>

      <BottomNav />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmGenerate}
        title="이력서를 생성하시겠어요?"
        description="선택한 리포지토리를 분석하여 AI가 이력서를 생성합니다."
        confirmText="생성하기"
        cancelText="취소"
      />
    </div>
  );
}
