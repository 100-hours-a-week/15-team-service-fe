import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { AnimatedTechTag } from '../../components/features/AnimatedTechTag';
import { EditTextDialog } from '../../components/modals/EditTextDialog';

import { useMasterProfile } from '../../hooks/queries/useMasterProfileQuery';
import { usePositions } from '../../hooks/queries/usePositionsQuery';
import {
  formatPhoneNumber,
  stripPhoneFormat,
  validatePhoneNumber,
  getPhoneErrorMessage,
  cn,
} from '../../lib/utils';
import { toast } from '../../lib/toast';

function FormSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border-b border-gray-100 last:border-0 overflow-hidden">
      <button
        type="button"
        className="w-full px-5 py-5 flex items-center justify-between transition-colors active:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-6 space-y-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DynamicListField({
  name,
  control,
  renderItem,
  addButtonText = '추가하기',
  emptyMessage = '정보를 추가해주세요.',
  newItemValue = {},
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {fields.length > 0 ? (
          fields.map((field, index) => (
            <motion.div
              layout
              key={field.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-4 border border-gray-100 rounded-2xl bg-gray-50/50"
            >
              <button
                type="button"
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => remove(index)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="space-y-5 pt-4">{renderItem(index, field)}</div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            {emptyMessage}
          </p>
        )}
      </AnimatePresence>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        className="bg-white border-dashed border-gray-300 h-12"
        onClick={() => append(newItemValue)}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        {addButtonText}
      </Button>
    </div>
  );
}

function TextAreaWithCounter({
  label,
  placeholder,
  name,
  register,
  watch,
  rows = 4,
  required = false,
}) {
  const value = watch(name) || '';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end px-0.5">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
        <span className="text-[11px] text-gray-400 font-normal">
          {value.length}자
        </span>
      </div>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none transition-all resize-none text-sm',
          'focus:border-primary focus:ring-2 focus:ring-primary/10',
          'hover:border-gray-300'
        )}
      />
    </div>
  );
}

function MonthPicker({
  control,
  name,
  placeholder = 'YYYY.MM',
  disabled = false,
  label,
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {label && (
            <label className="text-sm font-medium text-gray-700 px-0.5">
              {label}
            </label>
          )}
          <div className="relative h-[44px]">
            <Input
              value={field.value ? field.value.replace('-', '.') : ''}
              readOnly
              placeholder={placeholder}
              disabled={disabled}
              className="bg-white pointer-events-none absolute inset-0 z-0"
            />
            <input
              type="month"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    />
  );
}

export function ResumeProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRepos = location.state?.selectedRepos || [];

  const { data: profileData, isLoading: isFetchingProfile } =
    useMasterProfile();
  const { data: positions = [] } = usePositions();

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

  const onSubmit = (data) => {
    const masterProfile = {
      ...data,
      positionId: Number(data.positionId),
      phone: stripPhoneFormat(data.phone),
    };
    navigate('/create-resume', {
      state: { selectedRepos, masterProfile, fromResumeSetup: true },
    });
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
        <h1 className="text-lg font-bold">기본 정보 입력</h1>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary leading-relaxed">
          이 정보는 이번 이력서 생성에만 사용됩니다.
          <br />
          프로필 설정에는 저장되지 않아요.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pb-32">
        {/* 1. Basic Info */}
        <FormSection title="기본 정보" defaultOpen={true}>
          {/* Profile Image (display only) */}
          {profileData?.profileImageUrl && (
            <div className="flex flex-col items-center py-2">
              <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                <img
                  src={profileData.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

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

        {/* 2. Tech Stacks */}
        <FormSection title="기술 스택" defaultOpen={true}>
          <p className="text-[12px] text-gray-500 mb-1 px-0.5 leading-relaxed">
            이력서 데이터를 분석하여 추출된 기술 스택입니다. <br />
            탭하여 삭제하거나 버튼을 눌러 추가할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 py-2">
            <AnimatePresence>
              {techStacks.map((tech) => (
                <AnimatedTechTag
                  key={tech}
                  tag={tech}
                  onDelete={() => removeTechStack(tech)}
                />
              ))}
            </AnimatePresence>
            <button
              type="button"
              className="inline-flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-full h-8 px-4 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all group"
              onClick={() => setIsAddTechDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 text-gray-400 mr-1 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">
                추가
              </span>
            </button>
            {techStacks.length === 0 && (
              <p className="text-sm text-gray-400 py-6 w-full text-center border border-dashed rounded-2xl bg-gray-50/30">
                기술 스택 정보가 없습니다.
              </p>
            )}
          </div>
        </FormSection>

        {/* 3. Experience */}
        <FormSection title="경력" defaultOpen={false}>
          <DynamicListField
            name="experiences"
            control={control}
            addButtonText="경력 추가"
            newItemValue={{
              company: '',
              position: '',
              department: '',
              startDate: '',
              endDate: '',
              isCurrent: false,
              workType: '정규직',
              description: '',
            }}
            renderItem={(index) => (
              <>
                <Input
                  label="회사명"
                  placeholder="회사명을 입력하세요"
                  {...register(`experiences.${index}.company`)}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="직책"
                    placeholder="예: 선임 연구원"
                    {...register(`experiences.${index}.position`)}
                    className="bg-white hover:border-gray-300 transition-colors"
                  />
                  <Input
                    label="부서명"
                    placeholder="부서명"
                    {...register(`experiences.${index}.department`)}
                    className="bg-white hover:border-gray-300 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 px-0.5">
                    재직 기간
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MonthPicker
                        control={control}
                        name={`experiences.${index}.startDate`}
                      />
                      <span className="text-gray-400 flex-shrink-0">~</span>
                      <MonthPicker
                        control={control}
                        name={`experiences.${index}.endDate`}
                        disabled={watch(`experiences.${index}.isCurrent`)}
                      />
                    </div>
                    <label className="flex items-center gap-2 py-1 cursor-pointer w-fit group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary transition-all group-active:scale-90"
                        {...register(`experiences.${index}.isCurrent`)}
                      />
                      <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                        현재 재직 중
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 px-0.5">
                    근무 유형
                  </label>
                  <Controller
                    name={`experiences.${index}.workType`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="bg-white hover:border-gray-300 transition-colors">
                          <SelectValue placeholder="근무 유형 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            '정규직',
                            '계약직',
                            '인턴',
                            '개인 사업',
                            '프리랜서',
                          ].map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <TextAreaWithCounter
                  label="담당 업무"
                  name={`experiences.${index}.description`}
                  register={register}
                  watch={watch}
                  placeholder="주요 담당 업무를 구체적으로 입력하세요"
                  rows={3}
                />
              </>
            )}
          />
        </FormSection>
        {/* 5. Education */}
        <FormSection title="교육" defaultOpen={false}>
          <DynamicListField
            name="educations"
            control={control}
            addButtonText="학력 추가"
            newItemValue={{
              type: '',
              institution: '',
              major: '',
              status: '',
              startDate: '',
              endDate: '',
            }}
            renderItem={(index) => (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 px-0.5">
                      종류
                    </label>
                    <Controller
                      name={`educations.${index}.type`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white hover:border-gray-300 transition-colors">
                            <SelectValue placeholder="종류 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              '고등학교',
                              '대학교(전문학사)',
                              '대학교(학사)',
                              '대학원(석사)',
                              '대학원(박사)',
                              '사설 교육',
                            ].map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 px-0.5">
                      재학 상태
                    </label>
                    <Controller
                      name={`educations.${index}.status`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="bg-white hover:border-gray-300 transition-colors">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              '졸업',
                              '졸업 유예',
                              '재학 중',
                              '중퇴',
                              '수료',
                            ].map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <Input
                  label="소속/기관"
                  placeholder="학교명 혹은 교육 기관명을 입력하세요"
                  {...register(`educations.${index}.institution`)}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
                <Input
                  label="전공명/전공 계열"
                  placeholder="전공 혹은 교육 과정을 입력하세요"
                  {...register(`educations.${index}.major`)}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 px-0.5">
                    재학 기간
                  </label>
                  <div className="flex items-center gap-2">
                    <MonthPicker
                      control={control}
                      name={`educations.${index}.startDate`}
                    />
                    <span className="text-gray-400 flex-shrink-0">~</span>
                    <MonthPicker
                      control={control}
                      name={`educations.${index}.endDate`}
                    />
                  </div>
                </div>
              </>
            )}
          />
        </FormSection>

        {/* 6. Activities & Certifications */}
        <FormSection title="대외활동 및 자격증" defaultOpen={false}>
          <div className="space-y-10">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-primary px-0.5">
                대외활동
              </h4>
              <DynamicListField
                name="activities"
                control={control}
                addButtonText="대외활동 추가"
                newItemValue={{
                  name: '',
                  organization: '',
                  year: '',
                  description: '',
                }}
                renderItem={(index) => (
                  <>
                    <Input
                      label="활동명"
                      placeholder="활동명을 입력하세요"
                      {...register(`activities.${index}.name`)}
                      className="bg-white hover:border-gray-300 transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="소속/기관"
                        placeholder="주최 기관"
                        {...register(`activities.${index}.organization`)}
                        className="bg-white hover:border-gray-300 transition-colors"
                      />
                      <Input
                        label="활동 연도"
                        placeholder="YYYY"
                        {...register(`activities.${index}.year`)}
                        className="bg-white hover:border-gray-300 transition-colors"
                      />
                    </div>
                    <TextAreaWithCounter
                      label="활동 상세 설명"
                      name={`activities.${index}.description`}
                      register={register}
                      watch={watch}
                      placeholder="활동에 대한 간략한 설명을 입력하세요"
                      rows={2}
                    />
                  </>
                )}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-primary px-0.5">
                자격증/외국어
              </h4>
              <DynamicListField
                name="certifications"
                control={control}
                addButtonText="자격증/어학 추가"
                newItemValue={{ name: '', score: '', issuer: '', date: '' }}
                renderItem={(index) => (
                  <>
                    <Input
                      label="자격증/어학명"
                      placeholder="자격증 혹은 어학 시험명을 입력하세요"
                      {...register(`certifications.${index}.name`)}
                      className="bg-white hover:border-gray-300 transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="점수/급수"
                        placeholder="취득 점수 혹은 등급"
                        {...register(`certifications.${index}.score`)}
                        className="bg-white hover:border-gray-300 transition-colors"
                      />
                      <Input
                        label="발급 기관"
                        placeholder="인증 기관"
                        {...register(`certifications.${index}.issuer`)}
                        className="bg-white hover:border-gray-300 transition-colors"
                      />
                    </div>
                    <MonthPicker
                      label="취득월"
                      control={control}
                      name={`certifications.${index}.date`}
                    />
                  </>
                )}
              />
            </div>
          </div>
        </FormSection>
      </form>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 p-4 z-50">
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={handleSubmit(onSubmit)}
          className="h-12 text-base font-bold shadow-lg shadow-primary/10"
        >
          다음
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
