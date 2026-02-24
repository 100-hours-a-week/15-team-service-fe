import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Send, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { cn } from '../../lib/utils';
import { toast } from '@/app/lib/toast';
import { useInterviewSSE } from '@/app/hooks/useInterviewSSE';
import {
  useSubmitInterviewAnswer,
  useCompleteInterview,
} from '@/app/hooks/mutations/useInterviewMutations';

export function InterviewSessionPage() {
  const navigate = useNavigate();
  const { interviewId } = useParams();

  const [messages, setMessages] = useState([]);
  const [currentTurnNo, setCurrentTurnNo] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  const submitAnswerMutation = useSubmitInterviewAnswer();
  const endInterviewMutation = useCompleteInterview();

  const handleQuestion = useCallback((data) => {
    setMessages((prev) => [
      ...prev,
      {
        type: 'question',
        text: data.question,
        turnNo: data.turnNo,
        timestamp: data.askedAt || new Date().toISOString(),
      },
    ]);
    setCurrentTurnNo(data.turnNo);
    setIsLoading(false);
  }, []);

  const handleFeedback = useCallback((data) => {
    setFeedback(data.totalFeedback);
  }, []);

  const handleEnd = useCallback(
    (data) => {
      navigate('/interview/summary', {
        state: {
          duration: elapsedTime,
          feedback: feedback || data?.totalFeedback,
          interviewId,
        },
      });
    },
    [navigate, elapsedTime, feedback, interviewId]
  );

  const handleSSEError = useCallback((error) => {
    console.error('SSE error:', error);
    toast.error(error?.message || '서버 연결이 끊어졌습니다.');
  }, []);

  const { isConnected, connectionState, connect, disconnect, retryCount } = useInterviewSSE(interviewId, {
    onQuestion: handleQuestion,
    onFeedback: handleFeedback,
    onEnd: handleEnd,
    onError: handleSSEError,
  });

  // Connect to SSE on mount
  useEffect(() => {
    if (interviewId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [interviewId, connect, disconnect]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !currentTurnNo || isSubmitting) return;

    const answerText = textInput.trim();
    setIsSubmitting(true);

    // Add answer to local messages
    setMessages((prev) => [
      ...prev,
      {
        type: 'answer',
        text: answerText,
        timestamp: new Date().toISOString(),
      },
    ]);

    setTextInput('');

    try {
      await submitAnswerMutation.mutateAsync({
        interviewId: Number(interviewId),
        turnNo: currentTurnNo,
        answer: answerText,
        answerInputType: 'TEXT',
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = () => {
    // TODO: Implement voice recording
    setIsListening(!isListening);
  };

  const handleEndInterview = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      await endInterviewMutation.mutateAsync(Number(interviewId));
      // SSE will send 'end' event which will navigate to summary
    } catch (error) {
      console.error('Failed to end interview:', error);
      setIsEnding(false);
    }
  };

  // 연결 실패 상태
  if (connectionState === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-5">
          <WifiOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">연결이 끊어졌습니다</p>
          <p className="text-sm text-gray-500 mb-6">
            서버와의 연결에 실패했습니다. 다시 시도해주세요.
          </p>
          <div className="space-y-3">
            <Button variant="primary" onClick={connect} fullWidth>
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 연결
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} fullWidth>
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p>면접 질문을 준비 중입니다</p>
          {connectionState === 'connecting' && (
            <p className="text-sm text-gray-500 mt-2">서버에 연결 중...</p>
          )}
          {connectionState === 'reconnecting' && (
            <p className="text-sm text-orange-500 mt-2">
              재연결 중... ({retryCount}/5)
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Timer & Connection Status */}
      <div className="bg-white border-b border-gray-200 px-5 py-3">
        <div className="max-w-[390px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-red-500 animate-pulse" : "bg-orange-500"
              )} />
              <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
            </div>
            {connectionState === 'reconnecting' && (
              <span className="text-xs text-orange-500 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                재연결 중
              </span>
            )}
          </div>
          <Button
            variant="danger"
            onClick={handleEndInterview}
            disabled={isEnding || !isConnected}
            className="h-9 px-4 text-sm"
          >
            {isEnding ? '종료 중...' : '종료'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'answer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.type === 'question'
                    ? 'bg-white border border-gray-200'
                    : 'bg-primary text-white'
                }`}
              >
                <p className="text-sm mb-1 whitespace-pre-wrap">{msg.text}</p>
                <p
                  className={`text-xs ${msg.type === 'question' ? 'text-gray-500' : 'text-blue-100'}`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto flex flex-col gap-3">
          <p className="text-sm text-gray-600 text-center">
            {isSubmitting ? '답변 전송 중...' : isListening ? '말하는 중...' : '답변을 입력하세요'}
          </p>

          <div className="flex items-end gap-2">
            <textarea
              placeholder="답변을 입력하세요..."
              value={textInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isListening || isSubmitting}
              className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              rows={1}
            />

            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isListening || isSubmitting}
              className={cn(
                'p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0',
                textInput.trim() && !isListening && !isSubmitting
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={handleAnswer}
              disabled={isSubmitting}
              className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              {isListening ? (
                <MicOff className="w-8 h-8" strokeWidth={1.5} />
              ) : (
                <Mic className="w-8 h-8" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
