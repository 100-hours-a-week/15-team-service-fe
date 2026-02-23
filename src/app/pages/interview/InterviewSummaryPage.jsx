import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { CheckCircle2 } from 'lucide-react';
import { InterviewScript } from '../../components/features/InterviewScript';
import { EvaluationCard } from '../../components/features/EvaluationCard';
import { formatTime } from '@/app/lib/utils';
import { useInterview } from '@/app/hooks/queries/useInterviewQueries';

export function InterviewSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    duration = 0,
    feedback: stateFeedback,
    interviewId,
  } = location.state || {};

  // Fetch interview details if interviewId is available
  const { data, isLoading } = useInterview(interviewId, {
    enabled: !!interviewId,
  });

  const interview = data?.data;
  const messages = interview?.messages || [];

  // Transform messages to script format
  const script = messages.flatMap((msg) => {
    const entries = [];

    if (msg.question) {
      entries.push({
        timestamp: formatTimestamp(msg.askedAt),
        speaker: '면접관',
        content: msg.question,
      });
    }

    if (msg.answer) {
      entries.push({
        timestamp: formatTimestamp(msg.answeredAt),
        speaker: '유저',
        content: msg.answer,
      });
    }

    return entries;
  });

  // Parse evaluation data
  const parseEvaluation = () => {
    const feedback = stateFeedback || interview?.totalFeedback;
    if (!feedback) {
      return {
        summary: '피드백을 생성 중입니다...',
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }

    if (typeof feedback === 'string') {
      return {
        summary: feedback,
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }

    return {
      summary: feedback.summary || feedback.overallSummary || '피드백이 생성되었습니다.',
      strengths: feedback.keyStrengths || feedback.strengths || [],
      improvements: feedback.keyImprovements || feedback.improvements || [],
      nextActions: feedback.nextActions || [],
    };
  };

  const evaluation = parseEvaluation();

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

          {/* Loading state for interview data */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">결과를 불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* Interview Script */}
              {script.length > 0 && <InterviewScript entries={script} />}

              {/* AI Overall Evaluation */}
              <EvaluationCard data={evaluation} />
            </>
          )}

          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            홈으로
          </Button>

          {interviewId && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/interview/detail/${interviewId}`)}
            >
              상세 보기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '0:00';
  const date = new Date(dateStr);
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
