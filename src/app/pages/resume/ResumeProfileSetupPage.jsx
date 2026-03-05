import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Info } from 'lucide-react';

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
import { useResumeProfile } from '../../hooks/queries/useResumeQueries';
import { useResumeProfileMutations } from '../../hooks/mutations/useResumeMutations';
import { useUpdateMasterProfile } from '../../hooks/mutations/useMasterProfileMutations';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  mapProfileDataToForm,
  buildProfilePayload,
} from '../../lib/utils';
import { COUNTRY_CODES } from '../../constants';
import { toast } from '../../lib/toast';

export function ResumeProfileSetupPage() {
  const { id: resumeIdFromParams } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromRepoSelect = location.state?.fromRepoSelect ?? false;
  const fromSettings = location.state?.fromSettings ?? false;
  const selectedRepos = location.state?.selectedRepos ?? [];

  const isEditMode =
    resumeIdFromParams !== undefined && resumeIdFromParams !== null;
  const resumeId = isEditMode ? Number(resumeIdFromParams) : null;

  const { data: profileData, isLoading: isFetchingMaster } = useMasterProfile({
    enabled: !isEditMode,
  });
  const { data: existingResumeProfile, isLoading: isFetchingProfile } =
    useResumeProfile(resumeId, { enabled: isEditMode && !!resumeId });
  const { createMutation, updateMutation } = useResumeProfileMutations();
  const { mutate: updateMasterProfile, isPending: isUpdatingMaster } =
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
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      countryCode: '+82',
      phone: '',
      bio: '',
      techStacks: [],
      experiences: [],
      educations: [],
      activities: [],
      certifications: [],
    },
  });

  const techStacks = watch('techStacks');
  const countryCode = watch('countryCode');
  const bio = watch('bio');
  const watchedExperiences = watch('experiences');
  const watchedActivities = watch('activities');

  const isOverAnyLimit =
    (bio?.length ?? 0) > 1000 ||
    (watchedExperiences?.some((e) => (e.description?.length ?? 0) > 1000) ??
      false) ||
    (watchedActivities?.some((a) => (a.description?.length ?? 0) > 1000) ??
      false);
  const isSubmitDisabled = isOverAnyLimit || Object.keys(errors).length > 0;

  useEffect(() => {
    if (isEditMode && existingResumeProfile) {
      reset(mapProfileDataToForm(existingResumeProfile));
    } else if (!isEditMode && profileData) {
      reset(mapProfileDataToForm(profileData));
    }
  }, [isEditMode, existingResumeProfile, profileData, reset]);

  const onSubmit = (data) => {
    const profileImageUrl = isEditMode
      ? existingResumeProfile?.profileImageUrl
      : profileData?.profileImageUrl;
    const payload = buildProfilePayload(data, profileImageUrl);

    if (isEditMode) {
      updateMutation.mutate(
        { resumeId, data: payload },
        {
          onSuccess: () => navigate(`/resume/${resumeId}`),
        }
      );
    } else if (fromRepoSelect) {
      // AI 생성 플로우: 프로필 데이터를 가지고 CreateResumePage로 이동
      navigate('/create-resume', {
        state: {
          selectedRepos,
          masterProfile: payload,
          fromResumeSetup: true,
        },
      });
    } else if (fromSettings) {
      // 설정 화면에서 진입: 마스터 프로필 수정 (PUT /resumes/profile)
      updateMasterProfile(payload, {
        onSuccess: () => navigate('/settings'),
      });
    } else {
      // 회원가입 플로우에서 진입: 마스터 프로필 생성 (POST /resumes/profile)
      createMutation.mutate(payload, {
        onSuccess: (res) => navigate(`/resume/${res.resumeId}`),
      });
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
    if (tech.trim().length > 30) {
      toast.error('기술 스택 이름은 최대 30자까지 입력할 수 있습니다.');
      return;
    }
    if (techStacks.length >= 10) {
      toast.error('기술 스택은 최대 10개까지 추가할 수 있습니다.');
      return;
    }
    if (techStacks.includes(tech.trim())) {
      toast.error('이미 추가된 기술 스택입니다.');
      return;
    }
    setValue('techStacks', [...techStacks, tech.trim()], { shouldDirty: true });
    setIsAddTechDialogOpen(false);
  };

  if (isFetchingMaster || isFetchingProfile) {
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
      <style>{`
        input[type="month"] {
          position: relative;
          padding-right: 2px;
          font-size: 13px;
          background-color: white !important;
        }
        input[type="month"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">
          {isEditMode
            ? '이력서 프로필 수정'
            : fromRepoSelect
              ? 'AI 이력서 생성'
              : '이력서 수동 작성'}
        </h1>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary leading-relaxed">
          {isEditMode
            ? '수정된 정보는 이 이력서에만 반영됩니다.'
            : fromRepoSelect
              ? 'AI 이력서 생성에 사용될 프로필 정보를 확인해주세요.'
              : '직접 입력한 정보로 이력서를 생성합니다.'}
          <br />
          필수 항목(*)은 반드시 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-32">
        {/* 1. Basic Info */}
        <FormSection title="기본 정보" defaultOpen={true}>
          {/* Profile Image (display only) */}
          {(isEditMode ? existingResumeProfile : profileData)
            ?.profileImageUrl && (
            <div className="flex flex-col items-center py-2">
              <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <img
                  src={
                    (isEditMode ? existingResumeProfile : profileData)
                      .profileImageUrl
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-[2px] px-0.5">
              이름 <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="이름을 입력하세요"
              {...register('name', {
                required: '이름을 입력해주세요',
                maxLength: { value: 30, message: '최대 30자까지 가능합니다' },
              })}
              error={errors.name?.message}
              className="bg-white hover:border-gray-300 transition-colors"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-[2px] px-0.5">
              휴대폰 번호 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2 items-start">
              <Controller
                name="countryCode"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setValue('phone', '');
                    }}
                  >
                    <SelectTrigger className="w-[120px] bg-white shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(({ code, label }) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name="phone"
                control={control}
                rules={{
                  validate: (val) => {
                    if (!val) return true;
                    return (
                      validatePhoneNumber(val, countryCode) ||
                      getPhoneErrorMessage(val, countryCode)
                    );
                  },
                }}
                render={({ field }) => (
                  <Input
                    placeholder={
                      countryCode === '+82' ? '010-1234-5678' : '전화번호'
                    }
                    value={field.value}
                    onChange={(e) => {
                      const val =
                        countryCode === '+82'
                          ? formatPhoneNumber(e.target.value)
                          : e.target.value.replace(/\D/g, '');
                      field.onChange(val);
                    }}
                    error={errors.phone?.message}
                    className="flex-1 bg-white hover:border-gray-300 transition-colors"
                  />
                )}
              />
            </div>
          </div>

          <TextAreaWithCounter
            label="자기소개"
            name="bio"
            register={register}
            watch={watch}
            placeholder="자신을 소개하는 내용을 입력해주세요."
            maxLength={1000}
          />
        </FormSection>

        {/* 2. Tech Stacks */}
        <TechStackSection
          techStacks={techStacks}
          onAdd={() => setIsAddTechDialogOpen(true)}
          onDelete={removeTechStack}
          description={
            <>
              최대 10개까지 추가할 수 있습니다. <br />
              탭하여 삭제하거나 버튼을 눌러 추가할 수 있습니다.
            </>
          }
          defaultOpen={true}
        />

        {/* 3. Experience */}
        <ExperienceSection
          control={control}
          register={register}
          watch={watch}
          errors={errors}
          defaultOpen={false}
        />

        {/* 4. Education */}
        <EducationSection
          control={control}
          register={register}
          errors={errors}
          defaultOpen={false}
        />

        {/* 5. Activities & Certifications */}
        <ActivitiesCertificationsSection
          control={control}
          register={register}
          watch={watch}
          errors={errors}
          defaultOpen={false}
        />
      </form>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 p-4 z-50">
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={handleSubmit(onSubmit)}
          isLoading={
            createMutation.isPending ||
            updateMutation.isPending ||
            isUpdatingMaster
          }
          disabled={isSubmitDisabled}
          className="h-12 text-base font-bold shadow-lg shadow-primary/10"
        >
          {isEditMode ? '수정 완료' : fromRepoSelect ? '다음' : '이력서 생성'}
        </Button>
      </div>

      {/* Add Tech Stack Dialog */}
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
