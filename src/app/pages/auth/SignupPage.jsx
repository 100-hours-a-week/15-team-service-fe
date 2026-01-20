import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { TopAppBar } from "../../components/layout/TopAppBar";
import { SelectGrid } from "../../components/common/SelectGrid";
import { POSITIONS } from '@/app/constants';
import { formatPhoneNumber, validatePhoneNumber, getPhoneErrorMessage } from '@/app/lib/utils';
import { useUser } from '../../hooks/useUser';

export function SignupPage() {
  const navigate = useNavigate();
  const { updateUser } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    name: undefined,
    position: undefined,
    phone: undefined,
  });

  const [agreements, setAgreements] = useState({
    privacy: false,
    phoneCollection: false,
  });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handlePhoneChange = useCallback((e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  }, [errors.phone]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요";
    }

    if (!formData.position) {
      newErrors.position = "희망 포지션을 선택해주세요";
      toast.error("희망 포지션을 선택해주세요");
    }

    if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = getPhoneErrorMessage(formData.phone);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const profile = {
      name: formData.name,
      position: formData.position,
      phone: formData.phone,
      profileImage: null,
    };
    updateUser(profile);

    toast.success("회원가입이 완료되었습니다");
    navigate("/home");
  }, [formData, navigate, updateUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopAppBar title="회원가입" showBack />

      <form onSubmit={handleSubmit} className="px-5 py-6 pb-24">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
            </div>
            <button type="button" className="text-sm text-primary">
              증명사진 업로드 (선택)
            </button>
          </div>

          {/* Form Fields */}
          <Input
            label="이름 *"
            name="name"
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">희망 포지션 *</label>
            <SelectGrid
              items={POSITIONS}
              selected={formData.position}
              onSelect={(pos) => {
                setFormData({ ...formData, position: pos });
                if (errors.position) {
                  setErrors((prev) => ({ ...prev, position: undefined }));
                }
              }}
            />
            {errors.position && <p className="mt-1 text-sm text-danger">{errors.position}</p>}
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
          <div className="space-y-3 pt-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreements.privacy}
                onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm flex-1">
                개인정보 처리방침에 동의합니다. <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreements.phoneCollection}
                onChange={(e) => setAgreements({ ...agreements, phoneCollection: e.target.checked })}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm flex-1">
                전화번호 수집·이용에 동의합니다 (선택)
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!formData.name || !formData.position || !agreements.privacy}
          >
            가입 완료
          </Button>
        </div>
      </form>
    </div>
  );
}
