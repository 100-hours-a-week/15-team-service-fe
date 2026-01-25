import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { TopAppBar } from '../../components/layout/TopAppBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  stripPhoneFormat,
  validateName,
  getNameErrorMessage,
} from '@/app/lib/utils';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import { useCompleteOnboarding } from '@/app/hooks/mutations/useAuthMutations';

export function SignupPage() {
  const navigate = useNavigate();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: completeOnboarding, isPending } =
    useCompleteOnboarding();

  const [formData, setFormData] = useState({
    name: '',
    positionId: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    name: undefined,
    position: undefined,
    phone: undefined,
    privacy: undefined,
    phoneCollection: undefined,
  });

  const [agreements, setAgreements] = useState({
    privacy: false,
    phoneCollection: false,
  });

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handlePhoneChange = useCallback(
    (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setFormData((prev) => ({ ...prev, phone: formatted }));

      if (errors.phone || errors.phoneCollection) {
        setErrors((prev) => ({
          ...prev,
          phone: undefined,
          phoneCollection: undefined,
        }));
      }

      if (!formatted && agreements.phoneCollection) {
        setAgreements((prev) => ({ ...prev, phoneCollection: false }));
      }
    },
    [errors.phone, errors.phoneCollection, agreements.phoneCollection]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const newErrors = {};

      // Validate name (2-10 chars, no spaces, no emoji)
      const trimmedName = formData.name.trim();
      if (!validateName(trimmedName)) {
        newErrors.name = getNameErrorMessage(trimmedName);
      }

      // Validate position
      if (!formData.positionId) {
        newErrors.position = '희망 포지션을 선택해주세요';
      }

      // Validate phone format
      if (formData.phone && !validatePhoneNumber(formData.phone)) {
        newErrors.phone = getPhoneErrorMessage(formData.phone);
      }

      // Validate privacy agreement (required)
      if (!agreements.privacy) {
        newErrors.privacy = '개인정보 처리방침에 동의해주세요';
      }

      // Validate phone policy agreement (required if phone is provided)
      const normalizedPhone = formData.phone
        ? stripPhoneFormat(formData.phone)
        : null;

      if (normalizedPhone && !agreements.phoneCollection) {
        newErrors.phoneCollection = '전화번호 수집·이용에 동의해주세요';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Submit onboarding
      try {
        await completeOnboarding({
          profileImageUrl: null,
          name: trimmedName,
          positionId: formData.positionId,
          phone: normalizedPhone,
          privacyAgreed: true,
          phonePolicyAgreed: normalizedPhone ? true : undefined,
        });
      } catch (error) {
        const errorCode = error.response?.data?.code;

        if (errorCode === 'NAME_INVALID_INPUT') {
          setErrors((prev) => ({
            ...prev,
            name: '이름은 공백과 이모티콘을 제외한 2~10자로 입력해주세요.',
          }));
        } else if (errorCode === 'PHONE_INVALID_FORMAT') {
          setErrors((prev) => ({
            ...prev,
            phone: '올바른 전화번호 형식이 아닙니다.',
          }));
        } else if (errorCode === 'POSITION_SELECTION_REQUIRED') {
          setErrors((prev) => ({
            ...prev,
            position: '희망 포지션을 선택해주세요.',
          }));
        }

        return;
      }

      navigate('/home');
    },
    [
      agreements.phoneCollection,
      agreements.privacy,
      completeOnboarding,
      formData.name,
      formData.phone,
      formData.positionId,
      navigate,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopAppBar title="회원가입" />

      <form onSubmit={handleSubmit} className="px-5 py-6 pb-24">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
            </div>
            <button type="button" className="text-sm text-primary">
              프로필 사진 업로드 (선택)
            </button>
          </div>

          {/* Form Fields */}
          <Input
            label="이름 *"
            name="name"
            placeholder="이름을 입력하세요."
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              희망 포지션 *
            </label>
            <Select
              value={formData.positionId ? String(formData.positionId) : ''}
              onValueChange={(value) => {
                setFormData({ ...formData, positionId: Number(value) });
                if (errors.position) {
                  setErrors((prev) => ({ ...prev, position: undefined }));
                }
              }}
            >
              <SelectTrigger className="w-full min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent data-[placeholder]:text-gray-400">
                <SelectValue placeholder="포지션을 선택하세요." />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={String(position.id)}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.position && (
              <p className="mt-1 text-sm text-danger">{errors.position}</p>
            )}
          </div>

          <Input
            label="전화번호 (선택)"
            type="tel"
            placeholder="010-1234-5678"
            value={formData.phone}
            onChange={handlePhoneChange}
            error={errors.phone}
          />

          {/* Agreements */}
          <div className="space-y-4 pt-4">
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={(e) => {
                    setAgreements({ ...agreements, privacy: e.target.checked });
                    if (errors.privacy) {
                      setErrors((prev) => ({ ...prev, privacy: undefined }));
                    }
                  }}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm flex-1 relative top-[2px]">
                  개인정보 처리방침에 동의합니다.{' '}
                  <span className="text-primary">*</span>
                </span>
              </label>
              {errors.privacy && (
                <p className="mt-1 ml-8 text-sm text-destructive">
                  {errors.privacy}
                </p>
              )}
            </div>

            {/* Phone collection agreement - only show when phone is entered */}
            {formData.phone && (
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.phoneCollection}
                    onChange={(e) => {
                      setAgreements({
                        ...agreements,
                        phoneCollection: e.target.checked,
                      });
                      if (errors.phoneCollection) {
                        setErrors((prev) => ({
                          ...prev,
                          phoneCollection: undefined,
                        }));
                      }
                    }}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm flex-1 relative top-[2px]">
                    전화번호 수집·이용에 동의합니다.{' '}
                    <span className="text-primary">*</span>
                  </span>
                </label>
                {errors.phoneCollection && (
                  <p className="mt-1 ml-8 text-sm text-danger">
                    {errors.phoneCollection}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={
              isPending ||
              !formData.name ||
              !formData.positionId ||
              !agreements.privacy
            }
          >
            가입 완료
          </Button>
        </div>
      </form>
    </div>
  );
}
