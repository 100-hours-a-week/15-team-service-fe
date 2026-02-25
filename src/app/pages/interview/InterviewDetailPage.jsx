import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { InterviewScript } from '../../components/features/InterviewScript';
import { EvaluationCard } from '../../components/features/EvaluationCard';
import { formatTime } from '@/app/lib/utils';
import {
  useInterview,
  useInterviewMessages,
} from '@/app/hooks/queries/useInterviewQueries';

/**
 * @typedef {import('@/app/types').ScriptEntry} ScriptEntry
 * @typedef {import('@/app/types').EvaluationData} EvaluationData
 */

/** @type {ScriptEntry[]} */
const EMPTY_SCRIPT = [];

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

export function InterviewDetailPage() {
  const { id } = useParams();
  const interviewId = Number(id);
  const { data: interview, isLoading, isError } = useInterview(interviewId);
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isError: isMessagesError,
  } = useInterviewMessages(interviewId);

  const duration = useMemo(() => {
    if (!interview?.startedAt || !interview?.endedAt) return null;
    const start = new Date(interview.startedAt).getTime();
    const end = new Date(interview.endedAt).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
  }, [interview]);

  const parsedFeedback = useMemo(() => {
    if (!interview?.totalFeedback) return null;
    try {
      return JSON.parse(interview.totalFeedback);
    } catch {
      return null;
    }
  }, [interview]);

  const evaluationData = useMemo(() => {
    if (!parsedFeedback?.overallFeedback) return MOCK_EVALUATION;
    const overall = parsedFeedback.overallFeedback;
    return {
      summary: overall.summary || '피드백이 생성되었습니다.',
      strengths: overall.keyStrengths || [],
      improvements: overall.keyImprovements || [],
      nextActions: [],
    };
  }, [parsedFeedback]);

  const feedbackMap = useMemo(() => {
    if (!parsedFeedback?.feedbacks) return new Map();
    return new Map(
      parsedFeedback.feedbacks.map((item) => [item.turnNo, item.modelAnswer])
    );
  }, [parsedFeedback]);

  const scriptEntries = useMemo(() => {
    if (!messages || messages.length === 0) return EMPTY_SCRIPT;
    const entries = [];
    messages.forEach((msg) => {
      if (msg.question) {
        entries.push({
          timestamp: msg.askedAt || '',
          speaker: '면접관',
          content: msg.question,
        });
      }
      if (msg.answer) {
        entries.push({
          timestamp: msg.answeredAt || '',
          speaker: '유저',
          content: msg.answer,
        });
        const modelAnswer = feedbackMap.get(msg.turnNo);
        if (modelAnswer) {
          entries.push({
            timestamp: msg.answeredAt || '',
            speaker: 'AI',
            content: `모범답변: "${modelAnswer}"`,
          });
        }
      }
    });
    return entries.length > 0 ? entries : EMPTY_SCRIPT;
  }, [messages, feedbackMap]);

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
                {duration !== null ? formatTime(duration) : '-'}
              </span>
            </div>
          </div>

          {/* Interview Script */}
          {isLoading || isLoadingMessages ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm text-gray-500">
                면접 정보를 불러오는 중입니다.
              </p>
            </div>
          ) : isError || isMessagesError ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm text-gray-500">
                면접 정보를 불러오지 못했습니다.
              </p>
            </div>
          ) : scriptEntries.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
              <p className="text-sm text-gray-500">
                현재는 면접 스크립트를 제공하지 않습니다.
              </p>
            </div>
          ) : (
            <InterviewScript entries={scriptEntries} />
          )}

          {/* AI Overall Evaluation */}
          <EvaluationCard data={evaluationData} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
