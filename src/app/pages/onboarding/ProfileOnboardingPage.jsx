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
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  mapProfileDataToForm,
  buildProfilePayload,
} from '../../lib/utils';
import { COUNTRY_CODES } from '../../constants';
import { toast } from '../../lib/toast';

export function ProfileOnboardingPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: isFetchingProfile } =
    useMasterProfile();
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
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      countryCode: '+82',
      phone: '',
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
  const countryCode = watch('countryCode');

  useEffect(() => {
    if (profileData) {
      reset(mapProfileDataToForm(profileData));
    }
  }, [profileData, reset]);

  const onSubmit = async (data) => {
    try {
      await updateProfile(
        buildProfilePayload(data, profileData?.profileImageUrl)
      );
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
              휴대폰 번호
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
          errors={errors}
          defaultOpen={false}
        />

        {/* 4. Education — closed by default */}
        <EducationSection
          control={control}
          register={register}
          errors={errors}
          defaultOpen={false}
        />

        {/* 5. Activities & Certifications — closed by default */}
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
