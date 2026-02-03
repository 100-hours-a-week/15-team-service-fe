import { useState, useCallback, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { BottomNav } from '../components/layout/BottomNav';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import {
  formatPhoneNumber,
  validatePhoneNumber,
  getPhoneErrorMessage,
  stripPhoneFormat,
  validateName,
  getNameErrorMessage,
} from '@/app/lib/utils';
import {
  useUserProfile,
  // useUserSettings,
} from '@/app/hooks/queries/useUserQuery';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import {
  useUpdateUser,
  useUpdateUserSettings,
  useWithdrawUser,
} from '@/app/hooks/mutations/useUserMutations';
import { useLogout } from '@/app/hooks/mutations/useAuthMutations';
import { useUploadFile } from '@/app/hooks/mutations/useUploadMutations';
import { validateImageFile } from '@/app/lib/validators';
import { toast } from '@/app/lib/toast';

/**
 * @typedef {import('@/app/types').UserProfile} UserProfile
 */

export function SettingsPage() {
  const { data: profileData } = useUserProfile();
  // const { data: settingsData } = useUserSettings();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: updateUserProfile, isPending: isSavingProfile } =
    useUpdateUser();
  const { mutate: updateSettings } = useUpdateUserSettings();
  const { mutateAsync: logout } = useLogout();
  const { mutateAsync: withdrawUser } = useWithdrawUser();
  const { upload, isUploading } = useUploadFile('PROFILE_IMAGE');

  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const profileFileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  /** @type {[UserProfile, React.Dispatch<React.SetStateAction<UserProfile>>]} */
  const [editData, setEditData] = useState({
    name: '',
    position: '',
    phone: '',
    profileImage: null,
  });
  const [errors, setErrors] = useState({
    name: undefined,
    position: undefined,
    phone: undefined,
    phonePolicy: undefined,
  });
  const [isPhonePolicyModalOpen, setIsPhonePolicyModalOpen] = useState(false);
  const [isPhonePolicyAgreed, setIsPhonePolicyAgreed] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [_localSettings, _setLocalSettings] = useState({
    notificationEnabled: true,
    interviewResumeDefaultsEnabled: false,
  });
  const hasProfileSynced = useRef(false);
  const settingsDebounceRef = useRef(null);
  const displayName = profileData?.name ?? '';
  const displayPosition = profileData
    ? positions.find((position) => position.id === profileData.positionId)
        ?.name || ''
    : '';
  const displayPhone = profileData?.phone
    ? formatPhoneNumber(profileData.phone)
    : '미등록';

  const shouldShowPhonePolicyAgreement =
    !!editData.phone && !profileData?.phonePolicyAgreed;

  const phoneTermsContent = `## 📄 휴대전화번호 수집·이용 동의(필수)

**[수집·이용 목적]**

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
                nextLine === '---'
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

  useEffect(() => {
    if (!profileData || hasProfileSynced.current) return;
    if (positions.length === 0) return;

    const positionName =
      positions.find((position) => position.id === profileData.positionId)
        ?.name || '';

    setEditData({
      name: profileData.name,
      position: positionName,
      phone: profileData.phone ? formatPhoneNumber(profileData.phone) : '',
      profileImage: profileData.profileImageUrl ?? null,
    });

    hasProfileSynced.current = true;
  }, [profileData, positions]);

  // useEffect(() => {
  //   if (!settingsData) return;
  //   _setLocalSettings({
  //     notificationEnabled: settingsData.notificationEnabled,
  //     interviewResumeDefaultsEnabled:
  //       settingsData.interviewResumeDefaultsEnabled,
  //   });
  // }, [settingsData]);

  useEffect(() => {
    return () => {
      if (settingsDebounceRef.current) {
        clearTimeout(settingsDebounceRef.current);
      }
    };
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

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

  const handleEdit = useCallback(() => {
    if (!profileData) return;
    const positionName =
      positions.find((position) => position.id === profileData.positionId)
        ?.name || '';

    setEditData({
      name: profileData.name,
      position: positionName,
      phone: profileData.phone ? formatPhoneNumber(profileData.phone) : '',
      profileImage: profileData.profileImageUrl ?? null,
    });
    // Reset any previously selected new file
    setProfileFile(null);
    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    setProfilePreviewUrl(null);
    setIsPhonePolicyAgreed(false);
    setErrors((prev) => ({ ...prev, phonePolicy: undefined }));
    setIsEditing(true);
  }, [profileData, positions, profilePreviewUrl]);

  const handleSave = useCallback(async () => {
    const newErrors = {};
    const trimmedName = editData.name.trim();

    // Validate name (2-10 chars, no spaces, no emoji)
    if (!validateName(trimmedName)) {
      newErrors.name = getNameErrorMessage(trimmedName);
    }

    // Validate position
    const selectedPosition = positions.find(
      (position) => position.name === editData.position
    );

    if (!selectedPosition) {
      newErrors.position = '희망 포지션을 선택해주세요';
    }

    // Validate phone format
    if (editData.phone && !validatePhoneNumber(editData.phone)) {
      newErrors.phone = getPhoneErrorMessage(editData.phone);
    }

    if (shouldShowPhonePolicyAgreement && !isPhonePolicyAgreed) {
      newErrors.phonePolicy = '전화번호 수집·이용에 동의해주세요';
    }

    // If any errors, show them inline and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Normalize phone
    const normalizedPhone = editData.phone
      ? stripPhoneFormat(editData.phone)
      : '';
    const phoneValue = normalizedPhone ? normalizedPhone : null;

    try {
      // Upload new profile image if selected
      let profileImageUrl = editData.profileImage ?? null;
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

      const updatedProfile = await updateUserProfile({
        name: trimmedName,
        positionId: selectedPosition.id,
        phone: phoneValue,
        profileImageUrl,
        privacyAgreed: true,
        phonePolicyAgreed: phoneValue
          ? profileData?.phonePolicyAgreed || isPhonePolicyAgreed
          : undefined,
      });

      const updatedPositionName =
        positions.find((position) => position.id === updatedProfile.positionId)
          ?.name || editData.position;

      setEditData({
        name: updatedProfile.name,
        position: updatedPositionName,
        phone: updatedProfile.phone
          ? formatPhoneNumber(updatedProfile.phone)
          : '',
        profileImage: updatedProfile.profileImageUrl ?? null,
      });

      // Clear new file state after successful save
      setProfileFile(null);
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
      setProfilePreviewUrl(null);

      setIsEditing(false);
      setErrors({
        name: undefined,
        position: undefined,
        phone: undefined,
        phonePolicy: undefined,
      });
    } catch (error) {
      // Handle field-specific backend errors
      const errorCode = error.response?.data?.code;

      if (errorCode === 'NAME_INVALID_INPUT') {
        setErrors((prev) => ({
          ...prev,
          name: '이름은 2~10자로 입력해주세요 (공백/이모지 불가)',
        }));
      } else if (errorCode === 'PHONE_INVALID_FORMAT') {
        setErrors((prev) => ({
          ...prev,
          phone: '올바른 전화번호 형식이 아닙니다',
        }));
      } else if (errorCode === 'POSITION_SELECTION_REQUIRED') {
        setErrors((prev) => ({
          ...prev,
          position: '희망 포지션을 선택해주세요',
        }));
      }
    }
  }, [
    editData,
    positions,
    updateUserProfile,
    profileFile,
    profilePreviewUrl,
    upload,
    isPhonePolicyAgreed,
    profileData?.phonePolicyAgreed,
    shouldShowPhonePolicyAgreement,
  ]);

  const handleCancel = useCallback(() => {
    if (profileData) {
      const positionName =
        positions.find((position) => position.id === profileData.positionId)
          ?.name || '';

      setEditData({
        name: profileData.name,
        position: positionName,
        phone: profileData.phone ? formatPhoneNumber(profileData.phone) : '',
        profileImage: profileData.profileImageUrl ?? null,
      });
    }
    // Reset profile file state on cancel
    setProfileFile(null);
    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    setProfilePreviewUrl(null);
    setIsEditing(false);
    setErrors({
      name: undefined,
      position: undefined,
      phone: undefined,
      phonePolicy: undefined,
    });
    setIsPhonePolicyAgreed(false);
  }, [profileData, positions, profilePreviewUrl]);

  const handlePhoneChange = useCallback(
    (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setEditData((prev) => ({ ...prev, phone: formatted }));
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
      if (!formatted && errors.phonePolicy) {
        setErrors((prev) => ({ ...prev, phonePolicy: undefined }));
      }
      if (!formatted) {
        setIsPhonePolicyAgreed(false);
      }
    },
    [errors.phone, errors.phonePolicy]
  );

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

  const _handleToggleSetting = useCallback(
    (field, value) => {
      _setLocalSettings((prev) => ({ ...prev, [field]: value }));

      if (settingsDebounceRef.current) {
        clearTimeout(settingsDebounceRef.current);
      }

      settingsDebounceRef.current = setTimeout(() => {
        updateSettings({ [field]: value });
      }, 500);
    },
    [updateSettings]
  );

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
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              <div
                className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={() =>
                  isEditing && profileFileInputRef.current?.click()
                }
              >
                {/* Priority: new preview > existing API image > default icon */}
                {profilePreviewUrl ? (
                  <img
                    src={profilePreviewUrl}
                    alt="프로필 사진"
                    className="w-full h-full object-cover"
                  />
                ) : editData.profileImage ? (
                  <img
                    src={editData.profileImage}
                    alt="프로필 사진"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  className="text-sm text-primary"
                  onClick={() => profileFileInputRef.current?.click()}
                >
                  프로필 사진 변경
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="이름"
                  name="name"
                  value={editData.name}
                  onChange={(e) => {
                    setEditData({ ...editData, name: e.target.value });
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  error={errors.name}
                />

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    희망 포지션
                  </label>
                  <Select
                    value={editData.position}
                    onValueChange={(value) => {
                      setEditData({ ...editData, position: value });
                      if (errors.position) {
                        setErrors((prev) => ({ ...prev, position: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="포지션을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.name}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.position && (
                    <p className="mt-1 text-sm text-danger">
                      {errors.position}
                    </p>
                  )}
                </div>

                <Input
                  label="전화번호"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={editData.phone}
                  onChange={handlePhoneChange}
                  error={errors.phone}
                />

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    shouldShowPhonePolicyAgreement
                      ? 'max-h-40 opacity-100'
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isPhonePolicyAgreed}
                        onChange={(e) => {
                          setIsPhonePolicyAgreed(e.target.checked);
                          if (errors.phonePolicy) {
                            setErrors((prev) => ({
                              ...prev,
                              phonePolicy: undefined,
                            }));
                          }
                        }}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm">
                          전화번호 수집·이용에 동의합니다.{' '}
                          <span className="text-primary">*</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsPhonePolicyModalOpen(true)}
                          className="mt-1 text-xs text-primary underline underline-offset-2"
                        >
                          자세히 보기
                        </button>
                      </div>
                    </div>
                    {errors.phonePolicy && (
                      <p className="mt-2 text-sm text-danger">
                        {errors.phonePolicy}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" fullWidth onClick={handleCancel}>
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleSave}
                    disabled={isSavingProfile || isUploading}
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">이름</span>
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">희망 포지션</span>
                  <span className="font-medium">{displayPosition}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">전화번호</span>
                  <span className="font-medium">{displayPhone}</span>
                </div>

                <Button variant="secondary" fullWidth onClick={handleEdit}>
                  수정
                </Button>
              </div>
            )}
          </div>

          {/* Interview Settings */}
          {/* <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="mb-4">알림 및 모의 면접 설정</h3>

            <label className="flex items-start justify-between py-3">
              <div className="flex-1 pr-4">
                <p className="font-medium mb-1">알림 받기</p>
                <p className="text-sm text-gray-600">
                  이력서 생성 및 수정 알림을 받을 수 있습니다.
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

            <label className="flex items-start justify-between py-3 border-t border-gray-100">
              <div className="flex-1 pr-4">
                <p className="font-medium mb-1">이력서 정보 자동 사용</p>
                <p className="text-sm text-gray-600">
                  모의 면접 시작 시 이력서 정보를 기본 값으로 사용할 수
                  있습니다.
                </p>
              </div>
              <div className="relative inline-block w-12 h-7 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={localSettings.interviewResumeDefaultsEnabled}
                  onChange={(e) =>
                    handleToggleSetting(
                      'interviewResumeDefaultsEnabled',
                      e.target.checked
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-200 peer-checked:bg-primary rounded-full peer transition-colors cursor-pointer" />
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div> */}

          {/* Account */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#EF4444]"
              onClick={handleLogout}
            >
              <span>로그아웃</span>
            </button>
            <button
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#EF4444]"
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
            <DialogTitle>휴대전화번호 수집·이용 동의</DialogTitle>
          </DialogHeader>
          <div className="mt-3 max-h-[60vh] min-h-[200px] overflow-y-auto pl-1 text-sm text-gray-700">
            {renderMarkdown(phoneTermsContent)}
          </div>
          <DialogFooter className="mt-4">
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
