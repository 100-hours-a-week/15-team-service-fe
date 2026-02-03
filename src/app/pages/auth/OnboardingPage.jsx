import { useState } from 'react';
import { Github } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useGetGithubLoginUrl } from '@/app/hooks/mutations/useAuthMutations';

export function OnboardingPage() {
  const { mutate: requestGithubLogin, isPending } = useGetGithubLoginUrl();
  const [isLoginRequested, setIsLoginRequested] = useState(false);

  const handleGithubLogin = () => {
    if (isLoginRequested || isPending) return;
    setIsLoginRequested(true);
    requestGithubLogin(undefined, {
      onError: () => {
        setIsLoginRequested(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[390px] flex flex-col items-center">
        {/* Logo / Title */}
        <div className="mb-12 text-center">
          <h1 className="mb-3">CommitMe</h1>
          <p className="text-gray-600">
            깃허브 연동만으로 간편하게 취업을 준비하세요!
          </p>
        </div>

        {/* Login Button */}
        <Button
          onClick={handleGithubLogin}
          variant="primary"
          fullWidth
          className="mb-3"
          disabled={isPending || isLoginRequested}
        >
          <Github className="w-5 h-5" strokeWidth={1.5} />
          GitHub로 로그인
        </Button>

        {/* Caption */}
        <p className="text-xs text-gray-500 text-center">
          Repository 접근 권한을 요청할 거예요.
        </p>
      </div>
    </div>
  );
}
