import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '@/app/lib/toast';
import { Loader2 } from 'lucide-react';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const status = searchParams.get('status');
    const onboardingCompleted = searchParams.get('onboardingCompleted');

    const processCallback = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (status === 'success') {
        if (onboardingCompleted === 'true') {
          navigate('/home', { replace: true });
        } else if (onboardingCompleted === 'false') {
          navigate('/signup', { replace: true });
        } else {
          toast.error('로그인 상태를 확인할 수 없습니다.');
          await new Promise((resolve) => setTimeout(resolve, 1500));
          navigate('/', { replace: true });
        }
      } else if (status === 'fail') {
        toast.error('GitHub 로그인에 실패했습니다');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        navigate('/', { replace: true });
      } else {
        toast.error('잘못된 접근입니다');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        navigate('/', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
