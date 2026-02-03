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
  useUserSettings,
} from '@/app/hooks/queries/useUserQuery';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import {
  useUpdateUser,
  useUpdateUserSettings,
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
  const { data: settingsData } = useUserSettings();
  const { data: positions = [] } = usePositions();
  const { mutateAsync: updateUserProfile, isPending: isSavingProfile } =
    useUpdateUser();
  const { mutate: updateSettings } = useUpdateUserSettings();
  const { mutateAsync: logout } = useLogout();
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
  });
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
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

  useEffect(() => {
    if (!settingsData) return;
    _setLocalSettings({
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
        phonePolicyAgreed: phoneValue ? true : undefined,
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
      setErrors({ name: undefined, position: undefined, phone: undefined });
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
    setErrors({ name: undefined, position: undefined, phone: undefined });
  }, [profileData, positions, profilePreviewUrl]);

  const handlePhoneChange = useCallback(
    (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setEditData((prev) => ({ ...prev, phone: formatted }));
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    },
    [errors.phone]
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
    </div>
  );
}
