import { Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../../components/common/Button";

export function OnboardingPage() {
  const navigate = useNavigate();

  const handleGithubLogin = () => {
    // 신규 유저로 가정하여 회원가입 페이지로 이동
    navigate('/signup');

    // 실제로는 GitHub OAuth 처리 후
    // 기존 유저면 /home으로, 신규 유저면 /signup으로 이동
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[390px] flex flex-col items-center">
        {/* Logo / Title */}
        <div className="mb-12 text-center">
          <h1 className="mb-3">CommitMe</h1>
          <p className="text-gray-600">취업 준비를 커밋처럼 관리하세요</p>
        </div>

        {/* Login Button */}
        <Button
          onClick={handleGithubLogin}
          variant="primary"
          fullWidth
          className="mb-3"
        >
          <Github className="w-5 h-5" strokeWidth={1.5} />
          GitHub로 로그인
        </Button>

        {/* Caption */}
        <p className="text-xs text-gray-500 text-center">
          필요 시 프라이빗 레포지토리 접근 권한을 요청할 수 있어요.
        </p>
      </div>
    </div>
  );
}
