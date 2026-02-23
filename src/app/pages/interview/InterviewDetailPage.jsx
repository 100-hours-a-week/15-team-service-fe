import { useParams } from 'react-router-dom';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { InterviewScript } from '../../components/features/InterviewScript';
import { EvaluationCard } from '../../components/features/EvaluationCard';
import { formatTime } from '@/app/lib/utils';
import { useInterview } from '@/app/hooks/queries/useInterviewQueries';

export function InterviewDetailPage() {
  const { id } = useParams();
  const { data, isLoading, error } = useInterview(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="면접 상세" showBack />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="면접 상세" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">면접 정보를 불러오는데 실패했습니다.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const interview = data?.data;
  const messages = interview?.messages || [];

  // Calculate duration from startedAt to endedAt
  const calculateDuration = () => {
    if (!interview?.startedAt || !interview?.endedAt) return 0;
    const start = new Date(interview.startedAt);
    const end = new Date(interview.endedAt);
    return Math.floor((end - start) / 1000);
  };

  const duration = calculateDuration();

  // Transform messages to script format
  const script = messages.flatMap((msg, index) => {
    const entries = [];

    // Question entry
    if (msg.question) {
      entries.push({
        timestamp: formatTimestamp(msg.askedAt),
        speaker: '면접관',
        content: msg.question,
      });
    }

    // Answer entry
    if (msg.answer) {
      entries.push({
        timestamp: formatTimestamp(msg.answeredAt),
        speaker: '유저',
        content: msg.answer,
      });
    }

    return entries;
  });

  // Parse evaluation data from totalFeedback
  const parseEvaluation = () => {
    const feedback = interview?.totalFeedback;
    if (!feedback) {
      return {
        summary: '피드백이 아직 생성되지 않았습니다.',
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }

    // If feedback is a string, return as summary
    if (typeof feedback === 'string') {
      return {
        summary: feedback,
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }

    // If feedback is an object with structure
    return {
      summary: feedback.summary || feedback.overallSummary || '피드백이 생성되었습니다.',
      strengths: feedback.keyStrengths || feedback.strengths || [],
      improvements: feedback.keyImprovements || feedback.improvements || [],
      nextActions: feedback.nextActions || [],
    };
  };

  const evaluation = parseEvaluation();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopAppBar title={interview?.name || '면접 상세'} showBack />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-6">
          {/* Duration Info Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">진행 시간</span>
              <span className="font-medium text-gray-900">
                {formatTime(duration)}
              </span>
            </div>
            {interview?.interviewType && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">면접 유형</span>
                <span className="font-medium text-gray-900">
                  {interview.interviewType === 'TECHNICAL' ? '기술면접' : '인성면접'}
                </span>
              </div>
            )}
            {interview?.positionName && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">포지션</span>
                <span className="font-medium text-gray-900">
                  {interview.positionName}
                </span>
              </div>
            )}
          </div>

          {/* Interview Script */}
          {script.length > 0 ? (
            <InterviewScript entries={script} />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
              <p className="text-gray-500">면접 내용이 없습니다.</p>
            </div>
          )}

          {/* AI Overall Evaluation */}
          <EvaluationCard data={evaluation} />
        </div>
      </div>

      <BottomNav />
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
