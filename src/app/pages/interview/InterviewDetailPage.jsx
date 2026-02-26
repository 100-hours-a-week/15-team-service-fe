import { useMemo, useState } from 'react';
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
import { useInterviewSSE } from '@/app/hooks/useInterviewSSE';

/**
 * @typedef {import('@/app/types').ScriptEntry} ScriptEntry
 * @typedef {import('@/app/types').EvaluationData} EvaluationData
 */

/** @type {ScriptEntry[]} */
const EMPTY_SCRIPT = [];

export function InterviewDetailPage() {
  const { id } = useParams();
  const interviewId = Number(id);
  const [liveFeedback, setLiveFeedback] = useState(null);
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
    if (liveFeedback?.overallFeedback) return liveFeedback;
    if (!interview?.totalFeedback) return null;
    try {
      return JSON.parse(interview.totalFeedback);
    } catch {
      return null;
    }
  }, [liveFeedback, interview]);

  const evaluationData = useMemo(() => {
    if (!parsedFeedback?.overallFeedback) {
      return {
        summary: '피드백을 생성 중입니다.',
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }
    const overall = parsedFeedback.overallFeedback;
    return {
      summary: overall.summary || '피드백이 생성되었습니다.',
      strengths: overall.keyStrengths || [],
      improvements: overall.keyImprovements || [],
      nextActions: [],
    };
  }, [parsedFeedback]);

  const interviewMetaLabel = useMemo(() => {
    if (!interview?.positionName || !interview?.interviewType) return null;
    const typeLabel = interview.interviewType === 'TECHNICAL' ? '기술' : '인성';
    return `${interview.positionName} - ${typeLabel}`;
  }, [interview]);

  useInterviewSSE(parsedFeedback?.overallFeedback ? null : interviewId, {
    onFeedback: (data) => {
      if (!data?.totalFeedback) return;
      try {
        setLiveFeedback(JSON.parse(data.totalFeedback));
      } catch {
        setLiveFeedback(null);
      }
    },
  });

  const scriptEntries = useMemo(() => {
    if (!messages || messages.length === 0) return EMPTY_SCRIPT;
    const entries = [];
    messages.forEach((msg) => {
      if (!msg.answer) return;
      if (!msg.question) return;
      entries.push({
        timestamp: msg.askedAt || '',
        speaker: '면접관',
        content: msg.question,
      });
      entries.push({
        timestamp: msg.answeredAt || '',
        speaker: '유저',
        content: msg.answer,
      });
    });
    return entries.length > 0 ? entries : EMPTY_SCRIPT;
  }, [messages]);

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
          {parsedFeedback?.overallFeedback ? (
            <EvaluationCard
              data={evaluationData}
              metaLabel={interviewMetaLabel}
            />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <p className="text-sm text-gray-700">
                  AI 피드백을 생성 중입니다. 잠시만 기다려주세요.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
