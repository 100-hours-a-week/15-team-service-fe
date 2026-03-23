import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useDialogStore } from '@/app/store/useDialogStore';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { cn, formatKoreanTimestamp } from '../../lib/utils';
import { useInterviewSSE } from '@/app/hooks/useInterviewSSE';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import {
  useSubmitInterviewAnswer,
  useCompleteInterview,
} from '@/app/hooks/mutations/useInterviewMutations';
import { fetchInterviewMessages } from '@/app/api/endpoints/interviews';
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

const initialState = {
  hasMic: true,
  isRecording: false,
  messages: [],
  elapsedTime: 0,
  isLoading: true,
  textInput: '',
  hasStarted: false,
  currentTurnNo: null,
  feedback: null,
  isEnding: false,
  isTranscribing: false,
  sseError: false,
};

function interviewReducer(state, action) {
  switch (action.type) {
    case 'QUESTION_RECEIVED': {
      const { turnNo, question, askedAt } = action.payload;
      const exists = state.messages.some(
        (msg) => msg.type === 'question' && msg.turnNo === turnNo
      );
      return {
        ...state,
        isLoading: false,
        hasStarted: true,
        currentTurnNo: turnNo,
        messages: exists
          ? state.messages
          : [
              ...state.messages,
              { type: 'question', text: question, timestamp: askedAt, turnNo },
            ],
      };
    }
    case 'FEEDBACK_RECEIVED':
      return { ...state, feedback: action.payload };
    case 'SESSION_ENDED':
      return { ...state, hasStarted: false };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SUBMIT_TEXT_ANSWER':
      return {
        ...state,
        textInput: '',
        messages: [...state.messages, action.payload],
      };
    case 'SET_TEXT_INPUT':
      return { ...state, textInput: action.payload };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_TRANSCRIBING':
      return { ...state, isTranscribing: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_HAS_MIC':
      return { ...state, hasMic: action.payload };
    case 'SET_ENDING':
      return { ...state, isEnding: action.payload };
    case 'SET_SSE_ERROR':
      return { ...state, sseError: true, isLoading: false };
    case 'TICK':
      return { ...state, elapsedTime: state.elapsedTime + 1 };
    default:
      return state;
  }
}

export function InterviewSessionPage() {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const numericInterviewId = interviewId ? Number(interviewId) : null;

  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const {
    hasMic,
    isRecording,
    messages,
    elapsedTime,
    isLoading,
    textInput,
    hasStarted,
    currentTurnNo,
    isEnding,
    isTranscribing,
    sseError,
  } = state;

  const isEndDialogOpen = useDialogStore((s) => s.openDialogs['interviewEnd']);
  const isCompleteDialogOpen = useDialogStore(
    (s) => s.openDialogs['interviewComplete']
  );
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const autoRestartedRef = useRef(false);
  // Ref to access latest messages in async handlers without stale closure
  const messagesRef = useRef(messages);
  const messagesEndRef = useRef(null);
  const questionFallbackTimerRef = useRef(null);

  const submitAnswerMutation = useSubmitInterviewAnswer();
  const completeInterviewMutation = useCompleteInterview();

  // Close dialogs on unmount to prevent stale-open state on navigation back
  useEffect(() => {
    return () => {
      const { closeDialog } = useDialogStore.getState();
      closeDialog('interviewEnd');
      closeDialog('interviewComplete');
      clearQuestionFallbackTimer();
    };
  }, [clearQuestionFallbackTimer]);

  const handleAnswer = () => {
    if (isTranscribing) return;
    if (isRecording) {
      const elapsedMs = Date.now() - recordStartRef.current;
      if (elapsedMs < 1000) {
        toast.error('1초 이상 녹음해 주세요.');
        return;
      }
      stopRequestedRef.current = true;
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      } else {
        // Recorder already inactive but UI says recording - force cleanup
        stopStream();
        dispatch({ type: 'SET_RECORDING', payload: false });
      }
      return;
    }
    if (!currentTurnNo) {
      toast.error('질문을 받은 뒤 답변할 수 있습니다.');
      return;
    }
    if (!hasMic) {
      fileInputRef.current?.click();
      return;
    }
    if (!window.MediaRecorder) {
      dispatch({ type: 'SET_HAS_MIC', payload: false });
      fileInputRef.current?.click();
      return;
    }
    startRecording();
  };
  const handleEnd = async () => {
    if (isEnding) return;
    dispatch({ type: 'SET_ENDING', payload: true });
    try {
      const response =
        await completeInterviewMutation.mutateAsync(numericInterviewId);
      let parsedFeedback = null;
      if (response?.totalFeedback) {
        try {
          parsedFeedback = JSON.parse(response.totalFeedback);
        } catch {
          parsedFeedback = null;
        }
      }
      navigate('/interview/summary', {
        state: {
          interviewId: numericInterviewId,
          duration: elapsedTime,
          messages: messagesRef.current,
          feedback: parsedFeedback,
        },
      });
    } catch {
      dispatch({ type: 'SET_ENDING', payload: false });
    }
  };
  const handleOpenEndDialog = () =>
    useDialogStore.getState().openDialog('interviewEnd');
  const handleCancelEndDialog = () =>
    useDialogStore.getState().closeDialog('interviewEnd');
  const handleConfirmEndDialog = async () => {
    useDialogStore.getState().closeDialog('interviewEnd');
    await handleEnd();
  };
  const handleTextChange = (event) =>
    dispatch({ type: 'SET_TEXT_INPUT', payload: event.target.value });
  const handleKeyDown = (event) => {
    // 한글 IME 조합 중일 때는 무시 (조합 완료 후 전송)
    if (event.nativeEvent.isComposing) return;
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
    dispatch({
      type: 'SUBMIT_TEXT_ANSWER',
      payload: {
        type: 'answer',
        text: answerText,
        timestamp: new Date().toISOString(),
        turnNo: currentTurnNo,
      },
    });

    try {
      await submitAnswerMutation.mutateAsync({
        interviewId: numericInterviewId,
        turnNo: currentTurnNo,
        answer: answerText,
        answerInputType: 'TEXT',
        audioUrl: null,
      });
      startQuestionFallbackTimer();
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

    dispatch({ type: 'SET_TRANSCRIBING', payload: true });
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

      // STT 완료 후 바로 변환 상태 해제
      dispatch({ type: 'SET_TRANSCRIBING', payload: false });

      const answerText = sttResult.text.trim();
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          type: 'answer',
          text: answerText,
          timestamp: new Date().toISOString(),
          turnNo: currentTurnNo,
        },
      });

      await submitAnswerMutation.mutateAsync({
        interviewId: numericInterviewId,
        turnNo: currentTurnNo,
        answer: answerText,
        answerInputType: 'AUDIO',
        audioUrl: confirmed.s3Key,
      });
      startQuestionFallbackTimer();
    } catch {
      toast.error('음성 처리에 실패했습니다.');
    } finally {
      dispatch({ type: 'SET_TRANSCRIBING', payload: false });
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
      recordStartRef.current = Date.now();
      stopRequestedRef.current = false;

      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (isRecording) {
            dispatch({ type: 'SET_RECORDING', payload: false });
            toast.error(
              '마이크 입력이 중단되었습니다. 권한/장치를 확인해주세요.'
            );
          }
        };
      });

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
      recorder.onerror = () => {
        toast.error('녹음 중 오류가 발생했습니다. 다시 시도해주세요.');
      };
      recorder.onstart = () => {
        autoRestartedRef.current = false;
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationMs = Date.now() - recordStartRef.current;
        const hasEnoughData = durationMs >= 1000 && blob.size >= 10 * 1024;
        if (!stopRequestedRef.current && !hasEnoughData) {
          stopStream();
          if (!autoRestartedRef.current) {
            autoRestartedRef.current = true;
            setTimeout(() => {
              startRecording();
            }, 300);
            return;
          }
          dispatch({ type: 'SET_RECORDING', payload: false });
          toast.error(
            '녹음이 중단되었습니다. 마이크 권한/장치를 확인해주세요.'
          );
          return;
        }
        if (!hasEnoughData) {
          stopStream();
          dispatch({ type: 'SET_RECORDING', payload: false });
          toast.error('1초 이상 녹음해 주세요.');
          return;
        }
        dispatch({ type: 'SET_RECORDING', payload: false });
        const file = new File([blob], `interview-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        stopStream();
        await processAudioFile(file);
      };

      recorder.start();
      dispatch({ type: 'SET_RECORDING', payload: true });
    } catch {
      dispatch({ type: 'SET_HAS_MIC', payload: false });
      toast.error('마이크 권한을 확인해주세요.');
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const clearQuestionFallbackTimer = useCallback(() => {
    if (questionFallbackTimerRef.current) {
      clearTimeout(questionFallbackTimerRef.current);
      questionFallbackTimerRef.current = null;
    }
  }, []);

  const startQuestionFallbackTimer = useCallback(() => {
    clearQuestionFallbackTimer();
    questionFallbackTimerRef.current = setTimeout(async () => {
      try {
        const messages = await fetchInterviewMessages(numericInterviewId);
        // 질문이 있고 답변이 없는 메시지 찾기 (가장 최근 질문)
        const unanswered = messages
          .filter((m) => m.turnNo && m.askedAt && !m.answer)
          .sort((a, b) => b.turnNo - a.turnNo)[0];
        if (unanswered) {
          dispatch({
            type: 'QUESTION_RECEIVED',
            payload: {
              turnNo: unanswered.turnNo,
              question: unanswered.question,
              askedAt: unanswered.askedAt,
            },
          });
        }
      } catch {
        // fallback 실패 시 무시
      }
    }, 5000);
  }, [numericInterviewId, clearQuestionFallbackTimer]);

  const onQuestion = useCallback((data) => {
    clearQuestionFallbackTimer();
    dispatch({ type: 'QUESTION_RECEIVED', payload: data });
  }, [clearQuestionFallbackTimer]);

  const onFeedback = useCallback((data) => {
    if (data?.totalFeedback) {
      try {
        const parsed = JSON.parse(data.totalFeedback);
        dispatch({ type: 'FEEDBACK_RECEIVED', payload: parsed });
      } catch {
        dispatch({ type: 'FEEDBACK_RECEIVED', payload: null });
      }
    }
  }, []);

  const onEnd = useCallback(() => {
    dispatch({ type: 'SESSION_ENDED' });
  }, []);

  const onAllQuestionsComplete = useCallback(() => {
    useDialogStore.getState().openDialog('interviewComplete');
  }, []);

  const handleConfirmCompleteDialog = async () => {
    useDialogStore.getState().closeDialog('interviewComplete');
    await handleEnd();
  };

  useInterviewSSE(numericInterviewId, {
    onQuestion,
    onFeedback,
    onError: () => {
      dispatch({ type: 'SET_SSE_ERROR' });
    },
    onEnd,
    onAllQuestionsComplete,
  });

  useEffect(() => {
    if (!hasStarted) return undefined;
    const timer = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted]);

  useEffect(() => {
    if (!numericInterviewId) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [numericInterviewId]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      dispatch({ type: 'SET_HAS_MIC', payload: false });
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!numericInterviewId) {
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
            onClick={handleOpenEndDialog}
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
                  {formatKoreanTimestamp(msg.timestamp)}
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
          {/* 상태 표시 텍스트 */}
          <p className="text-sm text-gray-600 text-center">
            {isTranscribing
              ? '음성을 텍스트로 변환 중...'
              : isRecording
                ? '녹음 중...'
                : '대기 중...'}
          </p>

          {/* 입력 행: textarea + Send 버튼 + 마이크 버튼 */}
          <div className="flex items-end gap-2">
            {/* 텍스트 입력창 */}
            <textarea
              placeholder="답변을 입력하세요..."
              value={textInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={isRecording || isTranscribing}
              className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              rows={1}
            />

            {/* Send 버튼 */}
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isRecording || isTranscribing}
              className={cn(
                'p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0',
                textInput.trim() && !isRecording && !isTranscribing
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* 마이크 버튼 (기존) */}
            <button
              onClick={handleAnswer}
              disabled={isTranscribing}
              className={cn(
                'p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 disabled:opacity-50',
                isRecording
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Mic className="w-5 h-5" strokeWidth={1.5} />
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

      <ConfirmDialog
        isOpen={isEndDialogOpen}
        title="면접 종료"
        description={
          '면접을 종료하시겠습니까?\n종료하시면 면접을 다시 이어서 진행할 수 없습니다.'
        }
        confirmText="네"
        cancelText="아니오"
        onConfirm={handleConfirmEndDialog}
        onClose={handleCancelEndDialog}
      />

      <ConfirmDialog
        isOpen={isCompleteDialogOpen}
        title="면접 완료"
        description={'모든 질문이 완료되었습니다.\n피드백을 확인하시겠습니까?'}
        confirmText="피드백 보기"
        onConfirm={handleConfirmCompleteDialog}
        hideCancel
      />
    </div>
  );
}
