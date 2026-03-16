import { useState } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AnimatedTechTag } from './AnimatedTechTag';
import { cn } from '../../lib/utils';

const WORK_TYPES = ['정규직', '계약직', '인턴', '개인 사업', '프리랜서'];
const EDUCATION_TYPES = [
  '고등학교',
  '대학교(전문학사)',
  '대학교(학사)',
  '대학원(석사)',
  '대학원(박사)',
  '사설 교육',
];
const EDUCATION_STATUSES = ['졸업', '졸업 유예', '재학 중', '중퇴', '수료'];

export function FormSection({ title, children, defaultOpen = true }) {
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

export function DynamicListField({
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

export function TextAreaWithCounter({
  label,
  placeholder,
  name,
  register,
  watch,
  errors,
  rows = 4,
  required = false,
  maxLength,
}) {
  const value = watch(name) || '';
  const isOverLimit = maxLength != null && value.length > maxLength;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end px-0.5">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
        <span
          className={cn(
            'text-[11px] font-normal',
            isOverLimit ? 'text-danger' : 'text-gray-400'
          )}
        >
          {maxLength != null
            ? `${value.length}/${maxLength}자`
            : `${value.length}자`}
        </span>
      </div>
      <textarea
        {...register(
          name,
          maxLength != null
            ? {
                maxLength: {
                  value: maxLength,
                  message: `최대 ${maxLength}자까지 입력 가능합니다`,
                },
              }
            : {}
        )}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none transition-all resize-none text-sm',
          'focus:border-primary focus:ring-2 focus:ring-primary/10',
          isOverLimit || (errors && errors[name])
            ? 'border-danger ring-2 ring-danger/10'
            : 'hover:border-gray-300'
        )}
      />
      {isOverLimit && (
        <p className="text-xs text-danger">
          최대 {maxLength}자까지 입력 가능합니다
        </p>
      )}
    </div>
  );
}

/**
 * Month picker input with optional validation rules and error display.
 * Error text is rendered outside the `relative h-[44px]` container to avoid
 * clipping issues with the absolutely-positioned overlay input.
 */
export function MonthPicker({
  control,
  name,
  placeholder = 'YYYY.MM',
  disabled = false,
  label,
  rules,
  error,
}) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
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
              className={cn(
                'bg-white pointer-events-none absolute inset-0 z-0',
                error && 'border-[#EF4444]'
              )}
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
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        </div>
      )}
    />
  );
}

/**
 * Tech stack tag list with add/delete controls.
 * @param {Object} props
 * @param {string[]} props.techStacks
 * @param {function} props.onAdd - called when add button clicked
 * @param {function(string)} props.onDelete - called with tag name to delete
 * @param {React.ReactNode} [props.description] - descriptive text shown above tags
 * @param {boolean} [props.defaultOpen=true]
 */
export function TechStackSection({
  techStacks,
  onAdd,
  onDelete,
  description,
  defaultOpen = true,
}) {
  return (
    <FormSection title="기술 스택" defaultOpen={defaultOpen}>
      {description && (
        <p className="text-[12px] text-gray-500 mb-1 px-0.5 leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 py-2">
        <AnimatePresence>
          {techStacks.map((tech) => (
            <AnimatedTechTag
              key={tech}
              tag={tech}
              onDelete={() => onDelete(tech)}
            />
          ))}
        </AnimatePresence>
        <button
          type="button"
          className="inline-flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-full h-8 px-4 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all group"
          onClick={onAdd}
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
  );
}

/**
 * @param {Object} props
 * @param {object} props.control
 * @param {function} props.register
 * @param {function} props.watch
 * @param {object} [props.errors]
 * @param {boolean} [props.defaultOpen=true]
 */
export function ExperienceSection({
  control,
  register,
  watch,
  errors,
  defaultOpen = true,
}) {
  return (
    <FormSection title="경력" defaultOpen={defaultOpen}>
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
              {...register(`experiences.${index}.company`, {
                validate: (val, formValues) => {
                  const item = formValues.experiences?.[index];
                  if (!item?.company && !item?.startDate) return true;
                  return !!val || '회사명을 입력해주세요';
                },
                maxLength: {
                  value: 50,
                  message: '최대 50자까지 입력 가능합니다',
                },
              })}
              error={errors?.experiences?.[index]?.company?.message}
              className="bg-white hover:border-gray-300 transition-colors"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="직책"
                placeholder="예: 선임 연구원"
                {...register(`experiences.${index}.position`, {
                  maxLength: {
                    value: 30,
                    message: '최대 30자까지 입력 가능합니다',
                  },
                })}
                error={errors?.experiences?.[index]?.position?.message}
                className="bg-white hover:border-gray-300 transition-colors"
              />
              <Input
                label="부서명"
                placeholder="부서명"
                {...register(`experiences.${index}.department`, {
                  maxLength: {
                    value: 30,
                    message: '최대 30자까지 입력 가능합니다',
                  },
                })}
                error={errors?.experiences?.[index]?.department?.message}
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
                    rules={{
                      validate: (val, formValues) => {
                        const item = formValues.experiences?.[index];
                        if (!item?.company && !item?.startDate) return true;
                        return !!val || '재직 시작일을 선택해주세요';
                      },
                    }}
                    error={errors?.experiences?.[index]?.startDate?.message}
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-white hover:border-gray-300 transition-colors">
                      <SelectValue placeholder="근무 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map((type) => (
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
              maxLength={1000}
            />
          </>
        )}
      />
    </FormSection>
  );
}

/**
 * @param {Object} props
 * @param {object} props.control
 * @param {function} props.register
 * @param {object} [props.errors]
 * @param {boolean} [props.defaultOpen=true]
 */
export function EducationSection({
  control,
  register,
  errors,
  defaultOpen = true,
}) {
  return (
    <FormSection title="교육" defaultOpen={defaultOpen}>
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
                  rules={{
                    validate: (val, formValues) => {
                      const item = formValues.educations?.[index];
                      if (!item?.institution && !item?.startDate) return true;
                      return !!val || '교육 종류를 선택해주세요';
                    },
                  }}
                  render={({ field }) => (
                    <div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={cn(
                            'bg-white hover:border-gray-300 transition-colors',
                            errors?.educations?.[index]?.type &&
                              'border-[#EF4444]'
                          )}
                          onBlur={field.onBlur}
                        >
                          <SelectValue placeholder="종류 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors?.educations?.[index]?.type?.message && (
                        <p className="text-sm text-[#EF4444] mt-1">
                          {errors.educations[index].type.message}
                        </p>
                      )}
                    </div>
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
                  rules={{
                    validate: (val, formValues) => {
                      const item = formValues.educations?.[index];
                      if (!item?.institution && !item?.startDate) return true;
                      return !!val || '재학 상태를 선택해주세요';
                    },
                  }}
                  render={({ field }) => (
                    <div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={cn(
                            'bg-white hover:border-gray-300 transition-colors',
                            errors?.educations?.[index]?.status &&
                              'border-[#EF4444]'
                          )}
                          onBlur={field.onBlur}
                        >
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors?.educations?.[index]?.status?.message && (
                        <p className="text-sm text-[#EF4444] mt-1">
                          {errors.educations[index].status.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
            <Input
              label="소속/기관"
              placeholder="학교명 혹은 교육 기관명을 입력하세요"
              {...register(`educations.${index}.institution`, {
                validate: (val, formValues) => {
                  const item = formValues.educations?.[index];
                  if (!item?.institution && !item?.startDate) return true;
                  return !!val || '소속/기관명을 입력해주세요';
                },
                maxLength: {
                  value: 50,
                  message: '최대 50자까지 입력 가능합니다',
                },
              })}
              error={errors?.educations?.[index]?.institution?.message}
              className="bg-white hover:border-gray-300 transition-colors"
            />
            <Input
              label="전공명/전공 계열"
              placeholder="전공 혹은 교육 과정을 입력하세요"
              {...register(`educations.${index}.major`, {
                maxLength: {
                  value: 50,
                  message: '최대 50자까지 입력 가능합니다',
                },
              })}
              error={errors?.educations?.[index]?.major?.message}
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
                  rules={{
                    validate: (val, formValues) => {
                      const item = formValues.educations?.[index];
                      if (!item?.institution && !item?.startDate) return true;
                      return !!val || '재학 시작일을 선택해주세요';
                    },
                  }}
                  error={errors?.educations?.[index]?.startDate?.message}
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
  );
}

/**
 * @param {Object} props
 * @param {object} props.control
 * @param {function} props.register
 * @param {function} props.watch
 * @param {object} [props.errors]
 * @param {boolean} [props.defaultOpen=true]
 */
export function ActivitiesCertificationsSection({
  control,
  register,
  watch,
  errors,
  defaultOpen = true,
}) {
  return (
    <FormSection title="대외활동 및 자격증" defaultOpen={defaultOpen}>
      <div className="space-y-10">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-primary px-0.5">대외활동</h4>
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
                  {...register(`activities.${index}.name`, {
                    validate: (val, formValues) => {
                      const item = formValues.activities?.[index];
                      if (!item?.name && !item?.year) return true;
                      return !!val || '활동명을 입력해주세요';
                    },
                    maxLength: {
                      value: 50,
                      message: '최대 50자까지 입력 가능합니다',
                    },
                  })}
                  error={errors?.activities?.[index]?.name?.message}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="소속/기관"
                    placeholder="주최 기관"
                    {...register(`activities.${index}.organization`, {
                      maxLength: {
                        value: 50,
                        message: '최대 50자까지 입력 가능합니다',
                      },
                    })}
                    error={errors?.activities?.[index]?.organization?.message}
                    className="bg-white hover:border-gray-300 transition-colors"
                  />
                  <Input
                    label="활동 연도"
                    placeholder="YYYY"
                    {...register(`activities.${index}.year`, {
                      validate: (val, formValues) => {
                        const item = formValues.activities?.[index];
                        if (!item?.name && !item?.year) return true;
                        return !!val || '활동 연도를 입력해주세요';
                      },
                      maxLength: {
                        value: 4,
                        message: '연도는 4자리로 입력해주세요',
                      },
                    })}
                    error={errors?.activities?.[index]?.year?.message}
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
                  maxLength={1000}
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
                  {...register(`certifications.${index}.name`, {
                    validate: (val) => !!val || '자격증명을 입력해주세요',
                    maxLength: {
                      value: 50,
                      message: '최대 50자까지 입력 가능합니다',
                    },
                  })}
                  error={errors?.certifications?.[index]?.name?.message}
                  className="bg-white hover:border-gray-300 transition-colors"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="점수/급수"
                    placeholder="취득 점수 혹은 등급"
                    {...register(`certifications.${index}.score`, {
                      validate: (val, formValues) => {
                        const item = formValues.certifications?.[index];
                        if (!item?.name) return true;
                        return !!val || '점수/급수를 입력해주세요';
                      },
                      maxLength: {
                        value: 20,
                        message: '최대 20자까지 입력 가능합니다',
                      },
                    })}
                    error={errors?.certifications?.[index]?.score?.message}
                    className="bg-white hover:border-gray-300 transition-colors"
                  />
                  <Input
                    label="발급 기관"
                    placeholder="인증 기관"
                    {...register(`certifications.${index}.issuer`, {
                      maxLength: {
                        value: 50,
                        message: '최대 50자까지 입력 가능합니다',
                      },
                    })}
                    error={errors?.certifications?.[index]?.issuer?.message}
                    className="bg-white hover:border-gray-300 transition-colors"
                  />
                </div>
                <MonthPicker
                  label="취득월"
                  control={control}
                  name={`certifications.${index}.date`}
                  rules={{
                    validate: (val, formValues) => {
                      const item = formValues.certifications?.[index];
                      if (!item?.name) return true;
                      return !!val || '취득월을 선택해주세요';
                    },
                  }}
                  error={errors?.certifications?.[index]?.date?.message}
                />
              </>
            )}
          />
        </div>
      </div>
    </FormSection>
  );
}
