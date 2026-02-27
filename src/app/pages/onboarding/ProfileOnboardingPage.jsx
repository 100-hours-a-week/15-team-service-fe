import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  FormSection,
  TextAreaWithCounter,
  TechStackSection,
  ExperienceSection,
  EducationSection,
  ActivitiesCertificationsSection,
} from '../../components/features/ProfileFormComponents';
import { EditTextDialog } from '../../components/modals/EditTextDialog';

import { useMasterProfile } from '../../hooks/queries/useMasterProfileQuery';
import { useUpdateMasterProfile } from '../../hooks/mutations/useMasterProfileMutations';
import { usePositions } from '../../hooks/queries/usePositionsQuery';
import {
  formatPhoneNumber,
  stripPhoneFormat,
  validatePhoneNumber,
  getPhoneErrorMessage,
  cn,
} from '../../lib/utils';
import { toast } from '../../lib/toast';

export function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: isFetchingProfile } =
    useMasterProfile();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateMasterProfile();

  const [isAddTechDialogOpen, setIsAddTechDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      positionId: '',
      bio: '',
      techStacks: [],
      experiences: [],
      projects: [],
      educations: [],
      activities: [],
      certifications: [],
    },
  });

  const techStacks = watch('techStacks');

  useEffect(() => {
    if (profileData) {
      reset({
        ...profileData,
        phone: profileData.phone ? formatPhoneNumber(profileData.phone) : '',
        positionId: String(profileData.positionId),
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (data) => {
    try {
      await updateProfile({
        ...data,
        positionId: Number(data.positionId),
        phone: stripPhoneFormat(data.phone),
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const removeTechStack = (tech) => {
    setValue(
      'techStacks',
      techStacks.filter((t) => t !== tech),
      { shouldDirty: true }
    );
  };

  const addTechStack = (tech) => {
    if (!tech.trim()) return;
    if (techStacks.includes(tech.trim())) {
      toast.error('이미 추가된 기술 스택입니다.');
      return;
    }
    setValue('techStacks', [...techStacks, tech.trim()], {
      shouldDirty: true,
    });
    setIsAddTechDialogOpen(false);
  };

  if (isFetchingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-gray-500 animate-pulse">
          정보를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300">
      {/* Header — no back button, forward-only flow */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">프로필 설정</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            이력서 생성에 사용되는 기본 정보를 입력해주세요
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          onClick={() => navigate('/')}
        >
          나중에 하기
        </button>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-32">
        {/* 1. Basic Info — open by default */}
        <FormSection title="기본 정보" defaultOpen={true}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-[2px] px-0.5">
                이름 <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="이름을 입력하세요"
                {...register('name', { required: '이름을 입력해주세요' })}
                error={errors.name?.message}
                className="bg-white hover:border-gray-300 transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-[2px] px-0.5">
                희망 포지션 <span className="text-danger">*</span>
              </label>
              <Controller
                name="positionId"
                control={control}
                rules={{ required: '포지션을 선택해주세요' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={cn(
                        'bg-white hover:border-gray-300 transition-colors',
                        errors.positionId && 'border-danger'
                      )}
                    >
                      <SelectValue placeholder="포지션 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={String(pos.id)}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.positionId && (
                <p className="text-xs text-danger mt-1.5 px-0.5">
                  {errors.positionId.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-[2px] px-0.5">
              휴대폰 번호
            </label>
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (val) => {
                  if (!val) return true;
                  return validatePhoneNumber(val) || getPhoneErrorMessage(val);
                },
              }}
              render={({ field }) => (
                <Input
                  placeholder="010-1234-5678"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(formatPhoneNumber(e.target.value))
                  }
                  error={errors.phone?.message}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
              )}
            />
          </div>

          <TextAreaWithCounter
            label="자기소개"
            name="bio"
            register={register}
            watch={watch}
            placeholder="자신을 소개하는 내용을 입력해주세요."
          />
        </FormSection>

        {/* 2. Tech Stacks — open by default */}
        <TechStackSection
          techStacks={techStacks}
          onAdd={() => setIsAddTechDialogOpen(true)}
          onDelete={removeTechStack}
          description="탭하여 삭제하거나 버튼을 눌러 추가할 수 있습니다."
          defaultOpen={true}
        />

        {/* 3. Experience — closed by default */}
        <ExperienceSection
          control={control}
          register={register}
          watch={watch}
          defaultOpen={false}
        />

        {/* 4. Education — closed by default */}
        <EducationSection
          control={control}
          register={register}
          defaultOpen={false}
        />

        {/* 5. Activities & Certifications — closed by default */}
        <ActivitiesCertificationsSection
          control={control}
          register={register}
          watch={watch}
          defaultOpen={false}
        />
      </form>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 p-4 z-50">
        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={isSaving}
          onClick={handleSubmit(onSubmit)}
          className="h-12 text-base font-bold shadow-lg shadow-primary/10"
        >
          {isSaving ? '저장 중...' : '완료하고 시작하기'}
        </Button>
      </div>

      <EditTextDialog
        isOpen={isAddTechDialogOpen}
        onClose={() => setIsAddTechDialogOpen(false)}
        onConfirm={addTechStack}
        title="기술 스택 추가"
        placeholder="예: React, Python, AWS"
        initialValue=""
      />
    </div>
  );
}
