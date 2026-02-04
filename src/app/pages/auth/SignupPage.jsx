import { useState, useCallback, useRef, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
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
import { useUploadFile } from '@/app/hooks/mutations/useUploadMutations';
import { validateImageFile } from '@/app/lib/validators';
import { toast } from '@/app/lib/toast';

export function SignupPage() {
  const navigate = useNavigate();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: completeOnboarding, isPending } =
    useCompleteOnboarding();
  const { upload, isUploading } = useUploadFile('PROFILE_IMAGE');

  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const profileFileInputRef = useRef(null);

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
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const privacyTermsContent = `**[수집·이용 목적]**

Commit-me 서비스는 회원가입, 본인 인증, 서비스 제공, 고객 상담, 부정 이용 방지, 서비스 이용 기록 분석 및 보안 강화 등을 위하여 개인정보를 수집·이용합니다.

**[수집 항목]**

- 필수정보: 이름, 이메일 주소, 비밀번호, 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP
- 선택정보: 프로필 이미지, 성별, 생년월일(선택 입력 시)

**[보유·이용 기간]**

- 회원 탈퇴 시 즉시 파기
- 관계 법령에 따라 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관
    - 전자상거래법: 5년(결제·계약 기록), 3년(소비자 불만 처리), 1년(웹사이트 방문 기록)

**[동의 거부 시 불이익 안내]**

필수정보 제공에 동의하지 않을 경우 회원가입 및 기본 서비스 이용이 제한됩니다.

## 개인정보 처리방침(전문)

Commit-me 서비스는 「개인정보보호법」 등 관련 법령에 따라 이용자의 개인정보를 보호하고 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.

---

### **제1조(수집하는 개인정보 항목)**

회사는 아래의 개인정보를 수집합니다.

1. **회원가입 시**
     - 필수: 이름, 이메일, 비밀번호
     - 선택: 생년월일, 성별, 프로필 이미지
2. **서비스 이용 시 자동 수집**
     - IP 주소, 기기 정보, 접속 로그, 쿠키, 서비스 이용 기록, 브라우저 정보
3. **고객센터 이용 시**
     - 문의 내용, 상담 기록, 첨부파일

---

### **제2조(개인정보의 수집·이용 목적)**

회사는 다음 목적을 위하여 개인정보를 처리합니다.

- 회원 본인 인증 및 가입 관리
- 서비스 제공 및 기능 운영
- 부정 이용 방지, 보안 모니터링, 접근 기록 관리
- 신규 기능 개발, 통계 분석, 서비스 품질 개선
- 법령 의무 준수

---

### **제3조(개인정보의 보유 및 이용 기간)**

1. 원칙적으로 회원 탈퇴 시 즉시 파기
2. 단, 아래는 해당 기간 동안 보관
    - 전자상거래법
        - 계약 및 결제 기록: 5년
        - 소비자 불만/분쟁 처리: 3년
        - 광고/표시 기록: 6개월
    - 통신비밀보호법: 접속 기록 1년

---

### **제4조(개인정보의 제3자 제공)**

회사는 이용자의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.

제공이 필요한 경우 제공받는 자·목적·항목을 명시하여 별도 동의를 받습니다.

---

### **제5조(개인정보 처리의 위탁)**

서비스 운영에 필요한 경우 업무 일부를 외부에 위탁할 수 있습니다.

위탁 시 위탁업체명, 위탁 내용, 보유 기간을 고지합니다.

---

### **제6조(개인정보 파기 절차 및 방법)**

- 전자적 파일: 복구 불가 방식으로 영구 삭제
- 문서: 파쇄 또는 소각

---

### **제7조(이용자의 권리와 행사 방법)**

이용자는 언제든지 다음을 요청할 수 있습니다.

- 개인정보 조회·수정
- 처리 정지
- 삭제
- 동의 철회

---

### **제8조(개인정보 자동수집 장치의 설치·운영 및 거부)**

쿠키 및 분석 도구를 사용할 수 있으며, 사용자는 브라우저 설정을 통해 거부할 수 있습니다.

---

### **제9조(개인정보 보호책임자)**

- 이름: 홍대의
- 이메일: tot0328@naver.com
- 전화번호: 010-8465-6639`;
  const phoneTermsContent = `**[수집·이용 목적]**

회사는 다음 목적을 위하여 이용자의 휴대전화번호를 수집·이용합니다.

1. 본인 인증 및 계정 보호
2. 비밀번호 찾기 및 계정 복구
3. 서비스 관련 주요 안내(정책 변경, 보안 알림 등)
4. 부정 이용 방지 및 보안 강화
5. 이용자 식별 및 주요 기능 제공 (이력서 인적사항 정보 추가)

**[수집 항목]**

- 휴대전화번호(선택)

**[보유·이용 기간]**

- 회원 탈퇴 시 즉시 파기
- 관계 법령에 따라 필요한 경우 법정 보관 기간 준수

**[수신 동의 안내]**

- 서비스 운영 관련 필수 안내는 동의 철회와 무관하게 발송될 수 있습니다.
- 마케팅 문자 수신은 별도 선택 동의를 받으며 언제든지 철회 가능합니다.

**[동의 거부 시 불이익]**

휴대전화번호 제공을 거부할 경우 본인 인증이 불가하여 비밀번호 찾기 등의 서비스 이용이 제한될 수 있으나, 이력서 생성 등의 주요 기능은 전화번호 없이 생성 가능합니다.`;

  const renderInlineMarkdown = useCallback((text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`md-bold-${index}`}>{part.slice(2, -2)}</strong>;
      }
      return <span key={`md-text-${index}`}>{part}</span>;
    });
  }, []);

  const renderMarkdown = useCallback(
    (content) => {
      const lines = content.split('\n');
      const blocks = [];
      let index = 0;

      while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (!trimmed) {
          index += 1;
          continue;
        }

        if (trimmed === '---') {
          blocks.push(<hr key={`md-hr-${index}`} className="my-4" />);
          index += 1;
          continue;
        }

        if (trimmed.startsWith('## ')) {
          blocks.push(
            <h2 key={`md-h2-${index}`} className="mt-5 text-base font-semibold">
              {renderInlineMarkdown(trimmed.replace('## ', ''))}
            </h2>
          );
          index += 1;
          continue;
        }

        if (trimmed.startsWith('### ')) {
          blocks.push(
            <h3 key={`md-h3-${index}`} className="mt-4 text-sm font-semibold">
              {renderInlineMarkdown(trimmed.replace('### ', ''))}
            </h3>
          );
          index += 1;
          continue;
        }

        if (trimmed.startsWith('- ')) {
          const items = [];
          while (index < lines.length && lines[index].trim().startsWith('- ')) {
            items.push(lines[index].trim().replace('- ', ''));
            index += 1;
          }
          blocks.push(
            <ul
              key={`md-ul-${index}`}
              className="mt-2 list-disc space-y-1 pl-5"
            >
              {items.map((item, itemIndex) => (
                <li key={`md-ul-item-${index}-${itemIndex}`}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          continue;
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const items = [];
          while (index < lines.length) {
            const currentLine = lines[index].trim();
            if (!currentLine) {
              index += 1;
              continue;
            }
            if (!/^\d+\.\s/.test(currentLine)) {
              break;
            }

            const item = {
              title: currentLine.replace(/^\d+\.\s/, ''),
              subItems: [],
              extra: [],
            };
            index += 1;

            while (index < lines.length) {
              const nextLine = lines[index].trim();
              if (!nextLine) {
                index += 1;
                continue;
              }
              if (/^\d+\.\s/.test(nextLine)) {
                break;
              }
              if (nextLine.startsWith('- ')) {
                item.subItems.push(nextLine.replace('- ', ''));
                index += 1;
                continue;
              }
              if (
                nextLine.startsWith('## ') ||
                nextLine.startsWith('### ') ||
                nextLine === '---' ||
                nextLine.startsWith('**[')
              ) {
                break;
              }
              item.extra.push(nextLine);
              index += 1;
            }

            items.push(item);

            if (index >= lines.length) {
              break;
            }
            if (!/^\d+\.\s/.test(lines[index].trim())) {
              break;
            }
          }

          blocks.push(
            <ol
              key={`md-ol-${index}`}
              className="mt-2 list-decimal space-y-1 pl-5"
            >
              {items.map((item, itemIndex) => (
                <li key={`md-ol-item-${index}-${itemIndex}`} className="mt-2">
                  <div>{renderInlineMarkdown(item.title)}</div>
                  {item.extra.length > 0 &&
                    item.extra.map((line, lineIndex) => (
                      <p
                        key={`md-ol-extra-${index}-${itemIndex}-${lineIndex}`}
                        className="mt-2"
                      >
                        {renderInlineMarkdown(line)}
                      </p>
                    ))}
                  {item.subItems.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={`md-ol-sub-${index}-${itemIndex}-${subIndex}`}>
                          {renderInlineMarkdown(subItem)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          );
          continue;
        }

        blocks.push(
          <p key={`md-p-${index}`} className="mt-3">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
        index += 1;
      }

      return blocks;
    },
    [renderInlineMarkdown]
  );

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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleProfileImageChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateImageFile(file);
      if (!validation.ok) {
        if (validation.reason === 'type') {
          toast.error('지원하지 않는 이미지 형식입니다.');
        } else if (validation.reason === 'size') {
          toast.error('이미지 용량이 너무 큽니다. 최대 5MB까지 가능합니다.');
        }
        e.target.value = '';
        return;
      }

      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);

      const previewUrl = URL.createObjectURL(file);
      setProfileFile(file);
      setProfilePreviewUrl(previewUrl);

      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [profilePreviewUrl]
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

      // Upload profile image if selected
      let profileImageUrl = null;
      if (profileFile) {
        const validation = validateImageFile(profileFile);
        if (!validation.ok) {
          if (validation.reason === 'type') {
            toast.error('지원하지 않는 이미지 형식입니다.');
          } else if (validation.reason === 'size') {
            toast.error('이미지 용량이 너무 큽니다. 최대 5MB까지 가능합니다.');
          }
          return;
        }
        const result = await upload(profileFile);
        profileImageUrl = result.s3Key;
      }

      // Submit onboarding
      try {
        await completeOnboarding({
          profileImageUrl,
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

      navigate('/');
    },
    [
      agreements.phoneCollection,
      agreements.privacy,
      completeOnboarding,
      formData.name,
      formData.phone,
      formData.positionId,
      navigate,
      profileFile,
      upload,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopAppBar title="회원가입" />

      <form onSubmit={handleSubmit} className="px-5 py-6 pb-24">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={profileFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handleProfileImageChange}
            />
            <div
              className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => profileFileInputRef.current?.click()}
            >
              {profilePreviewUrl ? (
                <img
                  src={profilePreviewUrl}
                  alt="프로필 사진"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              )}
            </div>
            <button
              type="button"
              className="text-sm text-primary"
              onClick={() => profileFileInputRef.current?.click()}
            >
              사진 업로드 (선택)
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
              <div className="flex items-start gap-3">
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
                <div className="flex-1">
                  <p className="text-sm relative top-[2px]">
                    개인정보 처리방침에 동의합니다.{' '}
                    <span className="text-primary">*</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="mt-1 text-xs text-primary underline underline-offset-2"
                  >
                    자세히 보기
                  </button>
                </div>
              </div>
              {errors.privacy && (
                <p className="mt-1 ml-8 text-sm text-destructive">
                  {errors.privacy}
                </p>
              )}
            </div>

            {/* Phone collection agreement - only show when phone is entered */}
            {formData.phone && (
              <div>
                <div className="flex items-start gap-3">
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
                  <div className="flex-1">
                    <p className="text-sm relative top-[2px]">
                      전화번호 수집·이용에 동의합니다.{' '}
                      <span className="text-primary">*</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPhoneModalOpen(true)}
                      className="mt-1 text-xs text-primary underline underline-offset-2"
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
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
              isUploading ||
              !formData.name ||
              !formData.positionId ||
              !agreements.privacy
            }
          >
            가입 완료
          </Button>
        </div>
      </form>

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
            {renderMarkdown(privacyTermsContent)}
          </div>
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

      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent
          hideClose
          container={document.getElementById('app-container')}
          overlayClassName="absolute inset-0"
          className="w-[calc(100%-8px)] max-w-[382px] sm:max-w-[382px]"
        >
          <DialogHeader>
            <DialogTitle>휴대전화번호 수집·이용 동의 (필수)</DialogTitle>
          </DialogHeader>
          <div className="mt-1 max-h-[50vh] min-h-[200px] overflow-y-auto pr-4 text-sm text-gray-700">
            {renderMarkdown(phoneTermsContent)}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPhoneModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
