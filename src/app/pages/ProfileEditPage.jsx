import { useState, useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Camera } from 'lucide-react';

import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  FormSection,
  TextAreaWithCounter,
  TechStackSection,
  ExperienceSection,
  EducationSection,
  ActivitiesCertificationsSection,
} from '../components/features/ProfileFormComponents';
import { WarningDialog } from '../components/modals/WarningDialog';
import { EditTextDialog } from '../components/modals/EditTextDialog';

import { useMasterProfile } from '../hooks/queries/useMasterProfileQuery';
import { useUpdateMasterProfile } from '../hooks/mutations/useMasterProfileMutations';
import { usePositions } from '../hooks/queries/usePositionsQuery';
import { useProfileImageUpload } from '../hooks/useProfileImageUpload';
import { useUploadFile } from '../hooks/mutations/useUploadMutations';
import {
  formatPhoneNumber,
  stripPhoneFormat,
  validatePhoneNumber,
  getPhoneErrorMessage,
  cn,
} from '../lib/utils';
import { validateImageFile } from '../lib/validators';
import { toast } from '../lib/toast';

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: profileData, isLoading: isFetchingProfile } =
    useMasterProfile();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: updateProfile, isPending: isSaving } =
    useUpdateMasterProfile();
  const { upload, isUploading } = useUploadFile('PROFILE_IMAGE');

  const [isAddTechDialogOpen, setIsAddTechDialogOpen] = useState(false);

  const {
    previewUrl: imagePreviewUrl,
    file: imageFile,
    fileInputRef,
    handleChange: handleImageChange,
  } = useProfileImageUpload();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty, errors },
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

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const onSubmit = async (data) => {
    try {
      let profileImageUrl = profileData?.profileImageUrl;

      if (imageFile) {
        const validation = validateImageFile(imageFile);
        if (!validation.ok) {
          toast.error(
            validation.reason === 'type'
              ? '지원하지 않는 이미지 형식입니다.'
              : '이미지 용량이 너무 큽니다. 최대 5MB까지 가능합니다.'
          );
          return;
        }
        const result = await upload(imageFile);
        profileImageUrl = result.s3Key;
      }

      await updateProfile({
        ...data,
        positionId: Number(data.positionId),
        phone: stripPhoneFormat(data.phone),
        profileImageUrl,
      });

      reset(data);
      navigate('/settings');
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
    setValue('techStacks', [...techStacks, tech.trim()], { shouldDirty: true });
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">이력서 기본 정보 설정</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-32">
        {/* 1. Basic Info */}
        <FormSection title="기본 정보">
          <div className="flex flex-col items-center py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div
              className="relative w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden cursor-pointer flex items-center justify-center group shadow-inner transition-colors hover:border-primary/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : profileData?.profileImageUrl ? (
                <img
                  src={profileData.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400 group-hover:text-gray-500 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">
              권장 600px, 5MB 이하
            </p>
          </div>

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
            errors={errors}
            placeholder="자신을 소개하는 내용을 입력해주세요."
          />
        </FormSection>

        {/* 2. Tech Stacks */}
        <TechStackSection
          techStacks={techStacks}
          onAdd={() => setIsAddTechDialogOpen(true)}
          onDelete={removeTechStack}
          description={
            <>
              이력서 데이터를 분석하여 추출된 기술 스택입니다. <br />
              탭하여 삭제하거나 버튼을 눌러 추가할 수 있습니다.
            </>
          }
        />

        {/* 3. Experience */}
        <ExperienceSection
          control={control}
          register={register}
          watch={watch}
        />

        {/* 4. Education */}
        <EducationSection control={control} register={register} />

        {/* 5. Activities & Certifications */}
        <ActivitiesCertificationsSection
          control={control}
          register={register}
          watch={watch}
        />
      </form>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 p-4 z-50">
        <Button
          type="button"
          variant="primary"
          fullWidth
          disabled={isSaving || isUploading}
          onClick={handleSubmit(onSubmit)}
          className="h-12 text-base font-bold shadow-lg shadow-primary/10"
        >
          {isSaving ? '저장 중...' : '저장하기'}
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

      {/* Navigation Blocker Dialog */}
      <WarningDialog
        isOpen={blocker.state === 'blocked'}
        title="아직 저장하지 않았어요."
        description="저장하지 않고 나가면 수정한 정보가 유실될 수 있습니다."
        primaryButtonText="저장하고 나가기"
        secondaryButtonText="저장하지 않고 나가기"
        onPrimaryAction={async () => {
          await handleSubmit(onSubmit)();
          if (blocker.state === 'blocked') blocker.reset();
        }}
        onSecondaryAction={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </div>
  );
}
