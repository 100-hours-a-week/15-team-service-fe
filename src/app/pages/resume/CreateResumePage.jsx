import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { StepProgress } from '../../components/common/StepProgress';
import { SelectGrid } from '../../components/common/SelectGrid';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import { useCreateResume } from '@/app/hooks/mutations/useResumeMutations';

/**
 * @typedef {import('@/app/types').Repository} Repository
 */

export function CreateResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  /** @type {Repository[]} */
  const selectedRepos = location.state?.selectedRepos || [];

  // Fetch positions from API
  const { data: positions = [], isLoading: isLoadingPositions } = usePositions();

  // Create resume mutation
  const createResumeMutation = useCreateResume();

  // State management for multi-step form
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    positionId: null,
    company: '',
  });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  /**
   * Step 1 -> Step 2 navigation
   */
  const handleNext = useCallback(() => {
    if (!formData.positionId) {
      toast.error('희망 포지션을 선택해주세요');
      return;
    }
    setStep(2);
  }, [formData.positionId]);

  /**
   * Opens confirmation dialog before starting resume generation
   */
  const handleOpenConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(true);
  }, []);

  /**
   * Closes confirmation dialog without action
   */
  const handleCloseConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);

  /**
   * Confirms resume generation and calls API
   */
  const handleConfirmGenerate = useCallback(() => {
    setIsConfirmDialogOpen(false);

    // Build repo URLs from selected repositories
    const repoUrls = selectedRepos.map(
      (repo) => repo.htmlUrl || `https://github.com/${repo.owner}/${repo.name}`
    );

    createResumeMutation.mutate(
      {
        repoUrls,
        positionId: formData.positionId,
        // companyId is optional - backend will handle company name separately if needed
      },
      {
        onSuccess: () => {
          navigate('/home');
        },
      }
    );
  }, [selectedRepos, formData.positionId, createResumeMutation, navigate]);

  // Loading state while creating resume
  if (createResumeMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <TopAppBar title="이력서 생성 중" />
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="max-w-[390px] w-full">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h3>이력서를 생성 중입니다</h3>
              <p className="text-sm text-gray-500">
                나가도 백그라운드에서 진행됩니다
              </p>
              <Button variant="ghost" onClick={() => navigate('/home')}>
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transform positions for SelectGrid (expects string array)
  const positionItems = positions.map((p) => p.name);

  // Find selected position name for display
  const selectedPositionName = positions.find(
    (p) => p.id === formData.positionId
  )?.name;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopAppBar title="이력서 생성" showBack />

      {/* Progress Bar */}
      <StepProgress current={step} total={2} />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          {/* Selected Repos Info */}
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
                <h2 className="mb-2">희망 포지션을 선택하세요</h2>
                <p className="text-sm text-gray-600">
                  이력서에 맞춤형 내용이 생성됩니다
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
                    setFormData({ ...formData, positionId: position?.id || null });
                  }}
                />
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleNext}
                disabled={!formData.positionId}
              >
                다음
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">희망 기업을 입력하세요</h2>
                <p className="text-sm text-gray-600">
                  선택사항입니다. 나중에 변경할 수 있어요
                </p>
              </div>

              <input
                type="text"
                placeholder="예: 회사1"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

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
