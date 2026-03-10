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

const PRIVACY_TERMS_JSX = (
  <>
    <p className="mt-3 text-base font-semibold">
      📄 개인정보 수집·이용 동의(필수)
    </p>
    <p className="mt-3">
      <strong>[수집·이용 목적]</strong>
    </p>
    <p className="mt-2">
      Commit-me 서비스는 회원가입, 본인 인증, 서비스 제공, 고객 상담, 부정 이용
      방지, 서비스 이용 기록 분석 및 보안 강화 등을 위하여 개인정보를
      수집·이용합니다.
    </p>
    <p className="mt-3">
      <strong>[수집 항목]</strong>
    </p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>
        필수정보: 이름, 이메일 주소, 비밀번호, 서비스 이용 기록, 접속 로그,
        쿠키, 접속 IP
      </li>
      <li>선택정보: 프로필 이미지, 성별, 생년월일(선택 입력 시)</li>
    </ul>
    <p className="mt-3">
      <strong>[보유·이용 기간]</strong>
    </p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>회원 탈퇴 시 즉시 파기</li>
      <li>
        관계 법령에 따라 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관
      </li>
      <ul className="mt-1 list-disc pl-5">
        <li>
          전자상거래법: 5년(결제·계약 기록), 3년(소비자 불만 처리), 1년(웹사이트
          방문 기록)
        </li>
      </ul>
    </ul>
    <p className="mt-3">
      <strong>[동의 거부 시 불이익 안내]</strong>
    </p>
    <p className="mt-2">
      필수정보 제공에 동의하지 않을 경우 회원가입 및 기본 서비스 이용이
      제한됩니다.
    </p>

    <hr className="my-4 border-gray-200" />

    <p className="text-base font-semibold">📄 개인정보 처리방침(전문)</p>
    <p className="mt-2">
      Commit-me 서비스는 「개인정보보호법」 등 관련 법령에 따라 이용자의
      개인정보를 보호하고 원활한 서비스 제공을 위해 다음과 같이 개인정보
      처리방침을 수립·공개합니다.
    </p>

    <p className="mt-4 font-semibold">제1조(수집하는 개인정보 항목)</p>
    <p className="mt-1">회사는 아래의 개인정보를 수집합니다.</p>
    <ol className="mt-2 list-decimal space-y-1 pl-5">
      <li>
        <strong>회원가입 시</strong>
        <ul className="mt-1 list-disc pl-5">
          <li>필수: 이름, 이메일, 비밀번호</li>
          <li>선택: 생년월일, 성별, 프로필 이미지</li>
        </ul>
      </li>
      <li>
        <strong>서비스 이용 시 자동 수집</strong>
        <ul className="mt-1 list-disc pl-5">
          <li>
            IP 주소, 기기 정보, 접속 로그, 쿠키, 서비스 이용 기록, 브라우저 정보
          </li>
        </ul>
      </li>
      <li>
        <strong>고객센터 이용 시</strong>
        <ul className="mt-1 list-disc pl-5">
          <li>문의 내용, 상담 기록, 첨부파일</li>
        </ul>
      </li>
    </ol>

    <p className="mt-4 font-semibold">제2조(개인정보의 수집·이용 목적)</p>
    <p className="mt-1">회사는 다음 목적을 위하여 개인정보를 처리합니다.</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>회원 본인 인증 및 가입 관리</li>
      <li>서비스 제공 및 기능 운영</li>
      <li>부정 이용 방지, 보안 모니터링, 접근 기록 관리</li>
      <li>신규 기능 개발, 통계 분석, 서비스 품질 개선</li>
      <li>법령 의무 준수</li>
    </ul>

    <p className="mt-4 font-semibold">제3조(개인정보의 보유 및 이용 기간)</p>
    <ol className="mt-2 list-decimal space-y-1 pl-5">
      <li>원칙적으로 회원 탈퇴 시 즉시 파기</li>
      <li>
        단, 아래는 해당 기간 동안 보관
        <ul className="mt-1 list-disc pl-5">
          <li>
            전자상거래법
            <ul className="mt-1 list-disc pl-5">
              <li>계약 및 결제 기록: 5년</li>
              <li>소비자 불만/분쟁 처리: 3년</li>
              <li>광고/표시 기록: 6개월</li>
            </ul>
          </li>
          <li>통신비밀보호법: 접속 기록 1년</li>
        </ul>
      </li>
    </ol>

    <p className="mt-4 font-semibold">제4조(개인정보의 제3자 제공)</p>
    <p className="mt-1">
      회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
    </p>
    <p className="mt-1">
      제공이 필요한 경우 제공받는 자·목적·항목을 명시하여 별도 동의를 받습니다.
    </p>

    <p className="mt-4 font-semibold">제5조(개인정보 처리의 위탁)</p>
    <p className="mt-1">
      서비스 운영에 필요한 경우 업무 일부를 외부에 위탁할 수 있습니다.
    </p>
    <p className="mt-1">
      위탁 시 위탁업체명, 위탁 내용, 보유 기간을 고지합니다.
    </p>

    <p className="mt-4 font-semibold">제6조(개인정보 파기 절차 및 방법)</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>전자적 파일: 복구 불가 방식으로 영구 삭제</li>
      <li>문서: 파쇄 또는 소각</li>
    </ul>

    <p className="mt-4 font-semibold">제7조(이용자의 권리와 행사 방법)</p>
    <p className="mt-1">이용자는 언제든지 다음을 요청할 수 있습니다.</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>개인정보 조회·수정</li>
      <li>처리 정지</li>
      <li>삭제</li>
      <li>동의 철회</li>
    </ul>

    <p className="mt-4 font-semibold">
      제8조(개인정보 자동수집 장치의 설치·운영 및 거부)
    </p>
    <p className="mt-1">
      쿠키 및 분석 도구를 사용할 수 있으며, 사용자는 브라우저 설정을 통해 거부할
      수 있습니다.
    </p>

    <p className="mt-4 font-semibold">제9조(개인정보 보호책임자)</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>이름: 홍대의</li>
      <li>이메일: tot0328@naver.com</li>
      <li>전화번호: 010-8465-6639</li>
    </ul>
  </>
);

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
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-50 pb-24">
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
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="w-full flex items-center justify-between py-1 hover:opacity-70 transition-opacity text-left"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">
                  개인정보 수집 및 이용 동의
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-green-50 text-success rounded-full font-medium border border-green-100">
                {profileData?.privacyAgreed ? '동의함' : '미동의'}
              </span>
            </button>
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
      <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
        <DialogContent
          hideClose
          container={document.getElementById('app-container')}
          overlayClassName="absolute inset-0"
          className="w-[calc(100%-8px)] max-w-[382px] sm:max-w-[382px]"
        >
          <DialogHeader>
            <DialogTitle>개인정보 수집·이용 동의 (필수)</DialogTitle>
          </DialogHeader>
          <div className="mt-1 max-h-[50vh] min-h-[200px] overflow-y-auto pr-4 text-sm text-gray-700">
            {PRIVACY_TERMS_JSX}
          </div>
          <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
            필수 동의 항목입니다. 동의를 철회하려면 회원탈퇴를 진행해 주세요.
          </p>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPrivacyModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
