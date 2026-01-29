import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { StepProgress } from '../../components/common/StepProgress';
import { SelectGrid } from '../../components/common/SelectGrid';
import { POSITIONS } from '@/app/constants';

export function InterviewStartPage() {
  const showModal = false;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    position: '',
    company: '',
  });

  const handleUseResumeData = () => {};
  const handleManualInput = () => {};
  const handleNext = () => {};
  const handleStart = () => {};

  return (
    <div className="min-h-screen bg-gray-50">
      <TopAppBar title="모의 면접 시작" showBack />

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center px-5">
            <div className="bg-white rounded-2xl p-6 max-w-[340px] w-full space-y-4">
              <h3 className="text-center">이력서 정보를 사용할까요?</h3>
              <p className="text-sm text-gray-600 text-center">
                이력서 기반으로 희망 포지션/희망 기업을 설정하시겠습니까?
              </p>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleUseResumeData}
                >
                  사용하기
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleManualInput}
                >
                  직접 입력
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Progress Bar */}
      {step > 0 && <StepProgress current={step} total={3} />}

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">면접 유형을 선택하세요.</h2>
                <p className="text-sm text-gray-600">
                  면접 질문이 유형에 맞게 준비됩니다.
                </p>
              </div>

              <div className="flex bg-white rounded-xl border-2 border-gray-200 p-1">
                <button
                  onClick={() =>
                    setFormData({ ...formData, type: 'personality' })
                  }
                  className={`flex-1 px-4 py-3 rounded-lg transition-all min-h-[56px] ${
                    formData.type === 'personality'
                      ? 'bg-primary text-white'
                      : 'text-gray-600'
                  }`}
                >
                  인성면접
                </button>
                <button
                  onClick={() =>
                    setFormData({ ...formData, type: 'technical' })
                  }
                  className={`flex-1 px-4 py-3 rounded-lg transition-all min-h-[56px] ${
                    formData.type === 'technical'
                      ? 'bg-primary text-white'
                      : 'text-gray-600'
                  }`}
                >
                  기술면접
                </button>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleNext}
                disabled={!formData.type}
              >
                다음
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">희망 포지션을 선택하세요.</h2>
                <p className="text-sm text-gray-600">
                  면접 질문이 맞춤형으로 준비됩니다.
                </p>
              </div>

              <SelectGrid
                items={POSITIONS}
                selected={formData.position}
                onSelect={(pos) => setFormData({ ...formData, position: pos })}
              />

              <Button
                variant="primary"
                fullWidth
                onClick={handleNext}
                disabled={!formData.position}
              >
                다음
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2">희망 기업을 입력하세요.</h2>
                <p className="text-sm text-gray-600">선택사항입니다.</p>
              </div>

              <input
                type="text"
                placeholder="예: 한화시스템"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="mb-2">면접 정보</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600">유형:</span>{' '}
                    {formData.type === 'personality' ? '인성면접' : '기술면접'}
                  </p>
                  <p>
                    <span className="text-gray-600">포지션:</span>{' '}
                    {formData.position}
                  </p>
                  <p>
                    <span className="text-gray-600">기업:</span>{' '}
                    {formData.company || '미지정'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="primary" fullWidth onClick={handleStart}>
                  면접 시작
                </Button>
                <Button variant="ghost" fullWidth onClick={() => setStep(2)}>
                  이전
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
