import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck, UserCircle } from 'lucide-react';
import { BottomNav } from '../components/layout/BottomNav';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  useUserProfile,
  useUserSettings,
} from '@/app/hooks/queries/useUserQuery';
import {
  useUpdateUserSettings,
  useUpdatePhonePolicyAgreement,
  useWithdrawUser,
} from '@/app/hooks/mutations/useUserMutations';
import { useLogout } from '@/app/hooks/mutations/useAuthMutations';

const PHONE_TERMS_JSX = (
  <>
    <p className="mt-3">
      <strong>[수집·이용 목적]</strong>
    </p>
    <p className="mt-3">
      회사는 다음 목적을 위하여 이용자의 휴대전화번호를 수집·이용합니다.
    </p>
    <ol className="mt-2 list-decimal space-y-1 pl-5">
      <li className="mt-2">
        <div>본인 인증 및 계정 보호</div>
      </li>
      <li className="mt-2">
        <div>비밀번호 찾기 및 계정 복구</div>
      </li>
      <li className="mt-2">
        <div>서비스 관련 주요 안내(정책 변경, 보안 알림 등)</div>
      </li>
      <li className="mt-2">
        <div>부정 이용 방지 및 보안 강화</div>
      </li>
      <li className="mt-2">
        <div>이용자 식별 및 주요 기능 제공 (이력서 인적사항 정보 추가)</div>
      </li>
    </ol>
    <p className="mt-3">
      <strong>[수집 항목]</strong>
    </p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>휴대전화번호(선택)</li>
    </ul>
    <p className="mt-3">
      <strong>[보유·이용 기간]</strong>
    </p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>회원 탈퇴 시 즉시 파기</li>
      <li>관계 법령에 따라 필요한 경우 법정 보관 기간 준수</li>
    </ul>
    <p className="mt-3">
      <strong>[수신 동의 안내]</strong>
    </p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>
        서비스 운영 관련 필수 안내는 동의 철회와 무관하게 발송될 수 있습니다.
      </li>
      <li>
        마케팅 문자 수신은 별도 선택 동의를 받으며 언제든지 철회 가능합니다.
      </li>
    </ul>
    <p className="mt-3">
      <strong>[동의 거부 시 불이익]</strong>
    </p>
    <p className="mt-3">
      휴대전화번호 제공을 거부할 경우 본인 인증이 불가하여 비밀번호 찾기 등의
      서비스 이용이 제한될 수 있으나, 이력서 생성 등의 주요 기능은 전화번호 없이
      생성 가능합니다.
    </p>
  </>
);

export function SettingsPage() {
  const navigate = useNavigate();
  const { data: profileData } = useUserProfile();
  const { data: settingsData } = useUserSettings();
  const { mutate: updateSettings } = useUpdateUserSettings();
  const { mutate: updatePhonePolicyAgreement } =
    useUpdatePhonePolicyAgreement();
  const { mutateAsync: logout } = useLogout();
  const { mutateAsync: withdrawUser } = useWithdrawUser();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isPhonePolicyModalOpen, setIsPhonePolicyModalOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    notificationEnabled: true,
    interviewResumeDefaultsEnabled: false,
  });
  const settingsDebounceRef = useRef(null);

  useEffect(() => {
    if (!settingsData) return;
    setLocalSettings({
      notificationEnabled: settingsData.notificationEnabled,
      interviewResumeDefaultsEnabled:
        settingsData.interviewResumeDefaultsEnabled,
    });
  }, [settingsData]);

  useEffect(() => {
    return () => {
      if (settingsDebounceRef.current) {
        clearTimeout(settingsDebounceRef.current);
      }
    };
  }, []);

  const handleLogout = useCallback(() => {
    setIsLogoutDialogOpen(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    logout().finally(() => {
      setIsLogoutDialogOpen(false);
    });
  }, [logout]);

  const handleCancelLogout = useCallback(() => {
    setIsLogoutDialogOpen(false);
  }, []);

  const handleWithdraw = useCallback(() => {
    setIsWithdrawDialogOpen(true);
  }, []);

  const handleConfirmWithdraw = useCallback(() => {
    withdrawUser().finally(() => {
      setIsWithdrawDialogOpen(false);
    });
  }, [withdrawUser]);

  const handleCancelWithdraw = useCallback(() => {
    setIsWithdrawDialogOpen(false);
  }, []);

  const handleToggleSetting = useCallback(
    (field, value) => {
      setLocalSettings((prev) => ({ ...prev, [field]: value }));

      if (settingsDebounceRef.current) {
        clearTimeout(settingsDebounceRef.current);
      }

      settingsDebounceRef.current = setTimeout(() => {
        updateSettings({ [field]: value });
      }, 500);
    },
    [updateSettings]
  );

  const handlePhonePolicyToggle = useCallback(() => {
    if (profileData?.phonePolicyAgreed) {
      updatePhonePolicyAgreement(false);
    } else {
      setIsPhonePolicyModalOpen(true);
    }
  }, [profileData?.phonePolicyAgreed, updatePhonePolicyAgreement]);

  const handleConfirmPhonePolicyAgreement = useCallback(() => {
    setIsPhonePolicyModalOpen(false);
    updatePhonePolicyAgreement(true);
  }, [updatePhonePolicyAgreement]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto">
          <h1>설정</h1>
        </div>
      </header>

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Resume Profile Link Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => navigate('/settings/profile')}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  {profileData?.profileImageUrl ? (
                    <img
                      src={profileData.profileImageUrl}
                      alt="프로필"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle
                      className="w-7 h-7 text-primary"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {profileData?.name || '사용자'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    이력서 기본 정보 및 기술 스택 관리
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Privacy Status Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="mb-4 text-sm font-medium text-gray-500">
              개인정보 보호
            </h3>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">
                  개인정보 수집 및 이용 동의
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-50 text-success rounded-full font-medium border border-green-100">
                {profileData?.privacyAgreed ? '동의함' : '미동의'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 mt-2">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className={`w-5 h-5 ${profileData?.phonePolicyAgreed ? 'text-success' : 'text-gray-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setIsPhonePolicyModalOpen(true)}
                  className="text-sm font-medium text-left hover:underline"
                >
                  전화번호 수집/이용 동의
                </button>
              </div>
              <button
                type="button"
                onClick={handlePhonePolicyToggle}
                className={`text-xs px-2 py-1 rounded-full font-medium border ${
                  profileData?.phonePolicyAgreed
                    ? 'bg-green-50 text-success border-green-100'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {profileData?.phonePolicyAgreed ? '동의함' : '미동의'}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
              사용자의 소중한 개인정보는 서비스 제공 목적 이외에는 사용되지
              않으며, 암호화되어 안전하게 보관됩니다.
            </p>
          </div>

          {/* Interview Settings */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="mb-4 text-sm font-medium text-gray-500">앱 설정</h3>

            <label className="flex items-start justify-between py-3">
              <div className="flex-1 pr-4">
                <p className="font-medium text-sm mb-1">알림 받기</p>
                <p className="text-xs text-gray-600">
                  프로젝트 요약 생성 및 수정 알림을 받을 수 있습니다.
                </p>
              </div>
              <div className="relative inline-block w-12 h-7 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={localSettings.notificationEnabled}
                  onChange={(e) =>
                    handleToggleSetting('notificationEnabled', e.target.checked)
                  }
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
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#EF4444] text-sm font-medium"
              onClick={handleLogout}
            >
              <span>로그아웃</span>
            </button>
            <button
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-gray-400 text-[13px]"
              onClick={handleWithdraw}
            >
              <span>회원탈퇴</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        title="로그아웃"
        description="정말 로그아웃하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
      />
      <ConfirmDialog
        isOpen={isWithdrawDialogOpen}
        onClose={handleCancelWithdraw}
        onConfirm={handleConfirmWithdraw}
        title="회원탈퇴"
        description="정말 탈퇴하시겠습니까?"
        confirmText="탈퇴"
        cancelText="취소"
      />
      <Dialog
        open={isPhonePolicyModalOpen}
        onOpenChange={setIsPhonePolicyModalOpen}
      >
        <DialogContent
          hideClose
          container={document.getElementById('app-container')}
          overlayClassName="absolute inset-0"
          className="w-[calc(100%-8px)] max-w-[382px] sm:max-w-[382px]"
        >
          <DialogHeader>
            <DialogTitle>휴대전화번호 수집·이용 동의 (선택)</DialogTitle>
          </DialogHeader>
          <div className="mt-1 max-h-[50vh] min-h-[200px] overflow-y-auto pr-4 text-sm text-gray-700">
            {PHONE_TERMS_JSX}
          </div>
          <DialogFooter className="mt-4">
            {!profileData?.phonePolicyAgreed && (
              <Button type="button" onClick={handleConfirmPhonePolicyAgreement}>
                동의
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPhonePolicyModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
