import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { cn } from '../../lib/utils';
import { useInterviewSSE } from '@/app/hooks/useInterviewSSE';
import {
  useSubmitInterviewAnswer,
  useCompleteInterview,
} from '@/app/hooks/mutations/useInterviewMutations';
import { toast } from '@/app/lib/toast';
import {
  requestUploadUrl,
  uploadToS3,
  confirmUpload,
  UPLOAD_POLICIES,
} from '@/app/api/endpoints/uploads';
import { transcribeAudio } from '@/app/api/endpoints/stt';

/**
 * @typedef {Object} Message
 * @property {'question' | 'answer'} type
 * @property {string} text
 * @property {string} timestamp
 */

export function InterviewSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewId = location.state?.interviewId;

  const [hasMic, setHasMic] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const isListening = false;
  const [messages, setMessages] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTurnNo, setCurrentTurnNo] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sseError, setSseError] = useState(false);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const messagesRef = useRef(messages);
  const feedbackRef = useRef(feedback);

  const submitAnswerMutation = useSubmitInterviewAnswer();
  const completeInterviewMutation = useCompleteInterview();

  const handleAnswer = () => {
    if (isListening || isTranscribing) return;
    if (!currentTurnNo) {
      toast.error('질문을 받은 뒤 답변할 수 있습니다.');
      return;
    }
    if (!hasMic) {
      fileInputRef.current?.click();
      return;
    }
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }
    if (!window.MediaRecorder) {
      setHasMic(false);
      fileInputRef.current?.click();
      return;
    }
    startRecording();
  };
  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    try {
      await completeInterviewMutation.mutateAsync(interviewId);
    } catch {
      setIsEnding(false);
    }
  };
  const handleTextChange = (event) => setTextInput(event.target.value);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleTextSubmit();
    }
  };
  const handleTextSubmit = async () => {
    if (!textInput.trim() || !currentTurnNo) {
      return;
    }
    const answerText = textInput.trim();
    setTextInput('');
    setMessages((prev) => [
      ...prev,
      {
        type: 'answer',
        text: answerText,
        timestamp: new Date().toISOString(),
        turnNo: currentTurnNo,
      },
    ]);

    try {
      await submitAnswerMutation.mutateAsync({
        interviewId,
        turnNo: currentTurnNo,
        answer: answerText,
        answerInputType: 'TEXT',
        audioUrl: null,
      });
    } catch {
      toast.error('답변 전송에 실패했습니다.');
    }
  };

  const processAudioFile = async (file) => {
    if (!file) return;

    if (!currentTurnNo) {
      toast.error('질문을 받은 뒤 답변할 수 있습니다.');
      return;
    }

    const policy = UPLOAD_POLICIES.INTERVIEW_AUDIO;
    if (!policy.allowedTypes.includes(file.type)) {
      toast.error('지원하지 않는 오디오 형식입니다.');
      return;
    }
    if (file.size > policy.maxSize) {
      toast.error('오디오 파일 크기가 너무 큽니다.');
      return;
    }

    setIsTranscribing(true);
    try {
      const uploadInfo = await requestUploadUrl({
        purpose: 'INTERVIEW_AUDIO',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const etag = await uploadToS3(uploadInfo.presignedUrl, file, file.type);

      const confirmed = await confirmUpload(uploadInfo.uploadId, {
        etag,
        fileSize: file.size,
      });

      const sttResult = await transcribeAudio(confirmed.s3Key, 'ko');
      if (!sttResult?.text) {
        toast.error('음성 인식에 실패했습니다.');
        return;
      }

      const answerText = sttResult.text.trim();
      setMessages((prev) => [
        ...prev,
        {
          type: 'answer',
          text: answerText,
          timestamp: new Date().toISOString(),
          turnNo: currentTurnNo,
        },
      ]);

      await submitAnswerMutation.mutateAsync({
        interviewId,
        turnNo: currentTurnNo,
        answer: answerText,
        answerInputType: 'AUDIO',
        audioUrl: confirmed.s3Key,
      });
    } catch {
      toast.error('음성 처리에 실패했습니다.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAudioSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await processAudioFile(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : undefined;
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `interview-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        stopStream();
        await processAudioFile(file);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setHasMic(false);
      toast.error('마이크 권한을 확인해주세요.');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const onQuestion = useCallback((data) => {
    setIsLoading(false);
    setHasStarted(true);
    setCurrentTurnNo(data.turnNo);
    setMessages((prev) => [
      ...prev,
      {
        type: 'question',
        text: data.question,
        timestamp: data.askedAt,
        turnNo: data.turnNo,
      },
    ]);
  }, []);

  const onFeedback = useCallback((data) => {
    if (data?.totalFeedback) {
      try {
        setFeedback(JSON.parse(data.totalFeedback));
      } catch {
        setFeedback(null);
      }
    }
  }, []);

  const onEnd = useCallback(() => {
    setHasStarted(false);
    navigate('/interview/summary', {
      state: {
        duration: elapsedTime,
        messages: messagesRef.current,
        feedback: feedbackRef.current,
      },
    });
  }, [elapsedTime, navigate]);

  useInterviewSSE(interviewId, {
    onQuestion,
    onFeedback,
    onError: () => {
      setIsLoading(false);
      setSseError(true);
    },
    onEnd,
  });

  useEffect(() => {
    if (!hasStarted) return undefined;
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted]);

  useEffect(() => {
    if (!interviewId) {
      setIsLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasMic(false);
    }
    return () => {
      if (recorderRef.current && isRecording) {
        recorderRef.current.stop();
      }
      stopStream();
    };
  }, [isRecording]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);

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

  if (sseError && messages.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-4">
          <p>면접 세션 연결에 실패했습니다.</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center space-y-4">
          <p className="mb-4">잘못된 접근입니다</p>
          <Button onClick={() => navigate('/interview/start')}>
            면접 시작
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!hasMic && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-2">
          <div className="max-w-[390px] mx-auto text-xs text-yellow-800">
            마이크를 사용할 수 없습니다. 파일 업로드로 음성을 제출하세요.
          </div>
        </div>
      )}
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
            disabled={isEnding}
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
            {isTranscribing
              ? '음성을 텍스트로 변환 중...'
              : isRecording
                ? '녹음 중...'
                : isListening
                  ? '말하는 중...'
                  : '듣는 중...'}
          </p>

          {/* 입력 행: textarea + Send 버튼 + 마이크 버튼 */}
          <div className="flex items-end gap-2">
            {/* 텍스트 입력창 */}
            <textarea
              placeholder="답변을 입력하세요..."
              value={textInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isListening || isTranscribing}
              className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              rows={1}
            />

            {/* Send 버튼 */}
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isListening || isTranscribing}
              className={cn(
                'p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0',
                textInput.trim() && !isListening && !isTranscribing
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* 마이크 버튼 (기존) */}
            <button
              onClick={handleAnswer}
              disabled={isListening || isTranscribing}
              className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" strokeWidth={1.5} />
              ) : (
                <Mic className="w-8 h-8" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/webm"
        onChange={handleAudioSelected}
        className="hidden"
      />
    </div>
  );
}
