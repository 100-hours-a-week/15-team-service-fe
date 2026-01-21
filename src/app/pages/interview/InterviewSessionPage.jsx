import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, Send } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { cn } from '../../lib/utils';

/**
 * @typedef {Object} Message
 * @property {'question' | 'answer'} type
 * @property {string} text
 * @property {string} timestamp
 */

const SAMPLE_QUESTIONS = [
  '자기소개 부탁드립니다.',
  '지원 동기를 말씀해주세요.',
  '본인의 강점은 무엇인가요?',
];

export function InterviewSessionPage() {
  const navigate = useNavigate();

  const hasMic = true;
  const isListening = false;
  const messages = [
    {
      type: 'question',
      text: SAMPLE_QUESTIONS[0],
      timestamp: new Date().toISOString(),
    },
  ];
  const currentQuestion = 0;
  const elapsedTime = 0;
  const isLoading = false;
  const textInput = '';

  const addMessage = () => {};
  const handleAnswer = () => {};
  const handleEnd = () => {};
  const handleTextChange = () => {};
  const handleKeyDown = () => {};
  const handleTextSubmit = () => {};

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p>면접 질문을 준비 중입니다</p>
        </div>
      </div>
    );
  }

  if (!hasMic) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center">
          <p className="mb-4">마이크 권한이 필요합니다</p>
          <Button onClick={() => navigate('/home')}>홈으로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Timer */}
      <div className="bg-white border-b border-gray-200 px-5 py-3">
        <div className="max-w-[390px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <Button
            variant="danger"
            onClick={handleEnd}
            className="h-9 px-4 text-sm"
          >
            종료
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
                <p className="text-sm mb-1">{msg.text}</p>
                <p
                  className={`text-xs ${msg.type === 'question' ? 'text-gray-500' : 'text-blue-100'}`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto flex flex-col gap-3">
          {/* 상태 표시 텍스트 */}
          <p className="text-sm text-gray-600 text-center">
            {isListening ? '말하는 중...' : '듣는 중...'}
          </p>

          {/* 입력 행: textarea + Send 버튼 + 마이크 버튼 */}
          <div className="flex items-end gap-2">
            {/* 텍스트 입력창 */}
            <textarea
              placeholder="답변을 입력하세요..."
              value={textInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isListening}
              className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              rows={1}
            />

            {/* Send 버튼 */}
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isListening}
              className={cn(
                'p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0',
                textInput.trim() && !isListening
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* 마이크 버튼 (기존) */}
            <button
              onClick={handleAnswer}
              disabled={isListening}
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
