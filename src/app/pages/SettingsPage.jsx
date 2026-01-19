import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { BottomNav } from "../components/layout/BottomNav";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { POSITIONS } from "@/app/constants";

export function SettingsPage() {
  const navigate = useNavigate();

  const userData = {
    name: "예지",
    position: "백엔드",
    phone: "010-1234-5678",
    profileImage: null,
  };

  const useResumeData = true;
  const isEditing = false;

  const handleSave = () => {};
  const handlePhoneChange = () => {};
  const handleLogout = () => {};

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto">
          <h1>설정</h1>
        </div>
      </header>

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="mb-4">프로필</h3>

            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <button className="text-sm text-primary">프로필 사진 변경</button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="이름"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">희망 포지션</label>
                  <select
                    className="min-h-[44px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={userData.position}
                    onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="전화번호"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={userData.phone}
                  onChange={handlePhoneChange}
                  error={phoneError}
                />

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" fullWidth onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button variant="primary" fullWidth onClick={handleSave}>
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">이름</span>
                  <span className="font-medium">{userData.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">희망 포지션</span>
                  <span className="font-medium">{userData.position}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">전화번호</span>
                  <span className="font-medium">{userData.phone || '미등록'}</span>
                </div>

                <Button variant="secondary" fullWidth onClick={() => setIsEditing(true)}>
                  수정
                </Button>
              </div>
            )}
          </div>

          {/* Interview Settings */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="mb-4">모의면접 설정</h3>

            <label className="flex items-start justify-between py-3">
              <div className="flex-1 pr-4">
                <p className="font-medium mb-1">이력서 정보 자동 사용</p>
                <p className="text-sm text-gray-600">모의 면접 시작 시 이력서 정보를 기본값으로 사용합니다</p>
              </div>
              <div className="relative inline-block w-12 h-7 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={useResumeData}
                  onChange={(e) => setUseResumeData(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-200 peer-checked:bg-primary rounded-full peer transition-colors cursor-pointer" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#EF4444]"
              onClick={handleLogout}
            >
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
