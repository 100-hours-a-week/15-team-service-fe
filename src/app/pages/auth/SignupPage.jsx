import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { TopAppBar } from "../../components/layout/TopAppBar";
import { POSITIONS } from '@/app/constants';

export function SignupPage() {
  const navigate = useNavigate();

  const formData = {
    name: '',
    position: '',
    phone: '',
  };

  const agreements = {
    privacy: false,
    phoneCollection: false,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handlePhoneChange = () => {};

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
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">희망 포지션 *</label>
            <select
              className="min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            >
              <option value="">포지션을 선택하세요</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <Input
            label="전화번호 (선택)"
            type="tel"
            placeholder="010-1234-5678"
            value={formData.phone}
            onChange={handlePhoneChange}
            error={phoneError}
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
