import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { CheckCircle2 } from 'lucide-react';
import { InterviewScript } from '../../components/features/InterviewScript';
import { EvaluationCard } from '../../components/features/EvaluationCard';
import { formatTime } from '@/app/lib/utils';

/**
 * @typedef {import('@/app/types').ScriptEntry} ScriptEntry
 * @typedef {import('@/app/types').EvaluationData} EvaluationData
 */

/** @type {ScriptEntry[]} */
const MOCK_SCRIPT = [
  {
    timestamp: '0:00',
    speaker: '면접관',
    content: '안녕하세요. 자기소개 부탁드립니다.',
  },
  {
    timestamp: '0:05',
    speaker: '유저',
    content:
      '아, 저, 그... 안녕하세요. 저는 백엔드 개발자를 희망하는 예지입니다.',
  },
  {
    timestamp: '0:15',
    speaker: 'AI',
    content:
      '모범답변: "안녕하세요. 저는 Node.js와 Python을 활용한 백엔드 개발 경험이 있는 예지입니다. 특히 RESTful API 설계와 데이터베이스 최적화에 관심이 많습니다."',
  },
  {
    timestamp: '0:35',
    speaker: '면접관',
    content: '가장 기억에 남는 프로젝트에 대해 말씀해주세요.',
  },
  {
    timestamp: '0:40',
    speaker: '유저',
    content:
      '커뮤니티 플랫폼을 만들었는데요, Express.js로 백엔드 서버를 구축했고 JWT 인증 시스템을 구현했습니다.',
  },
  {
    timestamp: '1:05',
    speaker: 'AI',
    content:
      '모범답변: "커뮤니티 플랫폼 프로젝트에서 Express.js 기반 백엔드 서버를 구축했습니다. 특히 JWT 인증 시스템 구현과 Redis 캐싱을 통해 응답 속도를 30% 향상시켰습니다. 이 과정에서 보안과 성능 최적화의 중요성을 배웠습니다."',
  },
  {
    timestamp: '1:35',
    speaker: '면접관',
    content: '팀 프로젝트에서 갈등이 있었던 경험이 있나요?',
  },
  {
    timestamp: '1:42',
    speaker: '유저',
    content:
      '네, 있었습니다. 코드 스타일 차이로 의견이 맞지 않았는데, 팀 미팅을 통해 코딩 컨벤션을 정하고 해결했습니다.',
  },
  {
    timestamp: '2:10',
    speaker: 'AI',
    content:
      '모범답변: "팀원 간 코드 스타일 차이로 갈등이 있었습니다. 이를 해결하기 위해 팀 미팅을 제안하여 공통 코딩 컨벤션을 수립하고, ESLint와 Prettier를 도입하여 자동화했습니다. 이 경험을 통해 의사소통과 표준화의 중요성을 배웠습니다."',
  },
];

/** @type {EvaluationData} */
const MOCK_EVALUATION = {
  summary:
    '전반적으로 기술적인 역량과 경험을 잘 전달하셨습니다. 다만, 답변의 구체성을 높이고 STAR 기법을 활용하면 더욱 설득력 있는 면접이 될 것입니다.',
  strengths: [
    '프로젝트 경험을 구체적으로 설명하여 실무 능력을 잘 어필했습니다',
    '기술 스택에 대한 이해도가 높아 보였습니다',
    '갈등 해결 경험을 통해 협업 능력을 잘 보여주었습니다',
  ],
  improvements: [
    '자기소개 시 더 자신감 있는 목소리와 명확한 발음이 필요합니다',
    '프로젝트 성과를 수치화하여 표현하면 더 설득력이 있습니다',
    '답변이 다소 짧아 보일 수 있으니 좀 더 풍부한 내용 전달이 필요합니다',
  ],
  nextActions: [
    'STAR 기법(상황-과제-행동-결과)을 활용한 답변 연습',
    '프로젝트 성과를 구체적인 수치로 정리하기',
  ],
};

export function InterviewSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { duration = 150 } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopAppBar title="면접 종료" />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Success Message */}
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
            <CheckCircle2
              className="w-16 h-16 text-[#16A34A] mx-auto mb-4"
              strokeWidth={1.5}
            />
            <h2 className="mb-2">면접이 종료되었습니다</h2>
            <p className="text-gray-600">진행 시간: {formatTime(duration)}</p>
          </div>

          {/* Interview Script */}
          <InterviewScript entries={MOCK_SCRIPT} />

          {/* AI Overall Evaluation */}
          <EvaluationCard data={MOCK_EVALUATION} />

          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
