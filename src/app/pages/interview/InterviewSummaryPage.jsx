import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { CheckCircle2 } from 'lucide-react';
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

export function InterviewSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    interviewId = null,
    duration = 150,
    messages = null,
    feedback = null,
  } = location.state || {};
  const [liveFeedback, setLiveFeedback] = useState(null);

  const interviewQuery = useInterview(interviewId, {
    enabled: !!interviewId,
  });
  const messagesQuery = useInterviewMessages(interviewId, {
    enabled: !!interviewId && (!messages || messages.length === 0),
  });

  const resolvedFeedback = useMemo(() => {
    if (liveFeedback?.overallFeedback) return liveFeedback;
    if (feedback?.overallFeedback) return feedback;
    const totalFeedback = interviewQuery.data?.totalFeedback;
    if (!totalFeedback) return null;
    try {
      return JSON.parse(totalFeedback);
    } catch {
      return null;
    }
  }, [liveFeedback, feedback, interviewQuery.data?.totalFeedback]);

  const resolvedMessages = useMemo(() => {
    if (messages && messages.length > 0) return messages;
    if (messagesQuery.data && messagesQuery.data.length > 0) {
      return messagesQuery.data.map((item) => ({
        type: 'question',
        text: item.question,
        timestamp: item.askedAt,
        turnNo: item.turnNo,
        answer: item.answer,
        answeredAt: item.answeredAt,
      }));
    }
    return [];
  }, [messages, messagesQuery.data]);

  const scriptEntries = useMemo(() => {
    if (!resolvedMessages || resolvedMessages.length === 0) return [];
    const questionByTurn = new Map();
    const answerByTurn = new Map();
    const order = [];

    resolvedMessages.forEach((msg) => {
      const turnNo = msg.turnNo;
      if (turnNo == null) return;

      if (msg.type === 'question' || msg.question) {
        if (!questionByTurn.has(turnNo)) {
          questionByTurn.set(turnNo, {
            timestamp: msg.timestamp || msg.askedAt,
            text: msg.text || msg.question,
          });
          order.push(turnNo);
        }
      }

      const answerText =
        msg.answer || (msg.type === 'answer' ? msg.text : null);
      if (answerText) {
        answerByTurn.set(turnNo, {
          timestamp: msg.answeredAt || msg.timestamp,
          text: answerText,
        });
        if (!questionByTurn.has(turnNo)) {
          order.push(turnNo);
        }
      }
    });

    const entries = [];
    order.forEach((turnNo) => {
      const question = questionByTurn.get(turnNo);
      const answer = answerByTurn.get(turnNo);
      if (!question || !answer) return;
      entries.push({
        timestamp: question.timestamp,
        speaker: '면접관',
        content: question.text,
      });
      entries.push({
        timestamp: answer.timestamp,
        speaker: '유저',
        content: answer.text,
      });
    });

    return entries;
  }, [resolvedMessages]);

  const evaluationData = useMemo(() => {
    if (!resolvedFeedback?.overallFeedback) {
      return {
        summary: '피드백을 생성 중입니다.',
        strengths: [],
        improvements: [],
        nextActions: [],
      };
    }
    const overall = resolvedFeedback.overallFeedback;
    return {
      summary: overall.summary || '피드백이 생성되었습니다.',
      strengths: overall.keyStrengths || [],
      improvements: overall.keyImprovements || [],
      nextActions: [],
    };
  }, [resolvedFeedback]);

  const interviewMetaLabel = useMemo(() => {
    const interview = interviewQuery.data;
    if (!interview?.positionName || !interview?.interviewType) return null;
    const typeLabel = interview.interviewType === 'TECHNICAL' ? '기술' : '인성';
    return `${interview.positionName} - ${typeLabel}`;
  }, [interviewQuery.data]);

  useInterviewSSE(resolvedFeedback?.overallFeedback ? null : interviewId, {
    onFeedback: (data) => {
      if (!data?.totalFeedback) return;
      try {
        setLiveFeedback(JSON.parse(data.totalFeedback));
      } catch {
        setLiveFeedback(null);
      }
    },
  });

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
          {scriptEntries.length > 0 ? (
            <InterviewScript entries={scriptEntries} />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center text-sm text-gray-600">
              면접 대화 내역을 불러오는 중입니다.
            </div>
          )}

          {/* AI Overall Evaluation */}
          {resolvedFeedback?.overallFeedback ? (
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

          <Button variant="primary" fullWidth onClick={() => navigate('/')}>
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
