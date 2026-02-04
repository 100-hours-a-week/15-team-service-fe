import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams, useBlocker, useNavigate } from 'react-router-dom';
import yaml from 'js-yaml';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorkerSource from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw';
import {
  // Save,
  Download,
  // MessageCircle,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/app/lib/toast';
import { TopAppBar } from '../../components/layout/TopAppBar';
import { BottomNav } from '../../components/layout/BottomNav';
// import { ChatbotBottomSheet } from '../../components/features/ChatbotBottomSheet';
import { ParsedResumeViewer } from '../../components/features/ParsedResumeViewer';
import { WarningDialog } from '../../components/modals/WarningDialog';
import { Button } from '../../components/common/Button';
// import { useChatbot } from '@/app/hooks/useChatbot';
import {
  useResumeDetail,
  useResumeVersion,
} from '@/app/hooks/queries/useResumeQueries';
// import { useSaveResumeVersion } from '@/app/hooks/mutations/useResumeMutations';
// import { useGenerateResumePDF } from '@/app/hooks/mutations/useResumeMutations';

/**
 * Parse resume content from backend JSON and convert to YAML for viewing/parsing.
 * Backend sends: { techStack: [...], projects: [...] }
 */
function parseResumeContent(contentJson) {
  if (!contentJson || contentJson === '{}') {
    return '';
  }

  try {
    const content = JSON.parse(contentJson);
    const normalized = normalizeResumeContent(content);
    return yaml.dump(normalized, { noRefs: true, sortKeys: false });
  } catch {
    return contentJson;
  }
}

function normalizeResumeContent(content) {
  const projects = content?.projects;
  if (!Array.isArray(projects)) {
    return content;
  }

  const normalizedProjects = projects.map((project) => {
    if (!project || typeof project !== 'object') return project;
    const description = project.description;
    if (typeof description !== 'string') return project;

    const lines = description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^-\s*/, ''));

    if (lines.length === 0) return project;

    return { ...project, description: lines };
  });

  return { ...content, projects: normalizedProjects };
}

export function ResumeViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resumeId = parseInt(id, 10);
  const resumeViewerRef = useRef(null);

  const {
    data: resumeDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useResumeDetail(resumeId);

  const currentVersionNo = resumeDetail?.currentVersionNo || 1;

  const {
    data: versionData,
    isLoading: isLoadingVersion,
    refetch: refetchVersion,
  } = useResumeVersion(resumeId, currentVersionNo, {
    enabled: !!resumeDetail,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'QUEUED' || status === 'PROCESSING') {
        return 3000;
      }
      return false;
    },
  });

  // const saveVersionMutation = useSaveResumeVersion();

  const [yamlContent, setYamlContent] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [showChatbot, setShowChatbot] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const pdfDocRef = useRef(null);
  const [pdfCanvasEl, setPdfCanvasEl] = useState(null);
  const pdfNotifyRef = useRef(false);
  const [isPdfWorkerReady, setIsPdfWorkerReady] = useState(false);
  const pdfWorkerBlobUrlRef = useRef(null);

  useEffect(() => {
    if (versionData?.content && versionData.status === 'SUCCEEDED') {
      const parsed = parseResumeContent(versionData.content);
      setYamlContent(parsed);
      setRawContent(versionData.content);
    }
  }, [versionData]);

  useEffect(() => {
    if (!pdfData || !showPDFViewer || !isPdfWorkerReady) return;

    let cancelled = false;
    setIsPdfRendering(true);
    setPdfRenderError('');
    setPdfPage(1);
    setPdfNumPages(0);
    pdfDocRef.current = null;
    pdfNotifyRef.current = false;

    const loadingTask = getDocument({ data: pdfData });

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setPdfNumPages(pdf.numPages);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('PDF 로드 오류:', error);
          setPdfRenderError('PDF 미리보기를 불러오지 못했습니다.');
          setIsPdfRendering(false);
          toast.dismiss('pdf-loading');
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [pdfData, showPDFViewer, isPdfWorkerReady]);

  useEffect(() => {
    const blob = new Blob([pdfWorkerSource], {
      type: 'application/javascript',
    });
    const blobUrl = URL.createObjectURL(blob);
    pdfWorkerBlobUrlRef.current = blobUrl;
    GlobalWorkerOptions.workerSrc = blobUrl;
    setIsPdfWorkerReady(true);

    return () => {
      if (pdfWorkerBlobUrlRef.current) {
        URL.revokeObjectURL(pdfWorkerBlobUrlRef.current);
        pdfWorkerBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const pdf = pdfDocRef.current;
    const canvas = pdfCanvasEl;
    if (!pdf || !canvas || !pdfNumPages) return;

    let cancelled = false;
    setIsPdfRendering(true);
    setPdfRenderError('');

    pdf
      .getPage(pdfPage)
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 2.0 });
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas context를 가져올 수 없습니다.');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const renderTask = page.render({ canvasContext: context, viewport });
        return renderTask.promise;
      })
      .then(() => {
        if (!cancelled) {
          setIsPdfRendering(false);
          if (!pdfNotifyRef.current) {
            pdfNotifyRef.current = true;
            toast.dismiss('pdf-loading');
            toast.success('PDF가 생성되었습니다.');
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('PDF 렌더링 오류:', error);
          setPdfRenderError('PDF 미리보기를 불러오지 못했습니다.');
          setIsPdfRendering(false);
          toast.dismiss('pdf-loading');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfPage, pdfNumPages, pdfCanvasEl]);

  // 프로젝트 요약 생성 완료 메시지 표시
  useEffect(() => {
    const message = sessionStorage.getItem('resumeCreatedMessage');
    if (message) {
      sessionStorage.removeItem('resumeCreatedMessage');
      setTimeout(() => {
        toast.success(message);
      }, 300);
    }
  }, []);

  // const {
  //   messages,
  //   chatInput,
  //   isUpdating,
  //   isPaused,
  //   onInputChange,
  //   onSendMessage,
  //   onTogglePause,
  // } = useChatbot({
  //   onUpdate: (content) => {
  //     setYamlContent((prev) => prev + content);
  //     setHasUnsavedChanges(true);
  //   },
  // });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // const handleSave = useCallback(() => {
  //   if (versionData?.status !== 'SUCCEEDED') {
  //     toast.error('이력서 생성이 완료된 후 저장할 수 있습니다');
  //     return;
  //   }
  //
  //   saveVersionMutation.mutate(
  //     { resumeId, versionNo: currentVersionNo },
  //     {
  //       onSuccess: () => {
  //         setHasUnsavedChanges(false);
  //       },
  //     }
  //   );
  // }, [resumeId, currentVersionNo, versionData?.status, saveVersionMutation]);

  // const handleSaveAndPreview = useCallback(() => {
  //   handleSave();
  //   setShowPreview(true);
  // }, [handleSave]);

  const handleSaveAndStay = useCallback(() => {
    setHasUnsavedChanges(false);
    toast.success('저장되었습니다.');
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  const handleDiscardAndLeave = useCallback(() => {
    setHasUnsavedChanges(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const handleConfirmDownload = useCallback(() => {
    if (!pdfUrl) {
      toast.error('PDF를 찾을 수 없습니다.');
      return;
    }

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${resumeDetail?.name || '이력서'}.pdf`;
    link.click();
    toast.success('PDF가 다운로드되었습니다.');
  }, [pdfUrl, resumeDetail?.name]);

  const handleClosePDF = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfData(null);
    pdfDocRef.current = null;
    setPdfNumPages(0);
    setPdfPage(1);
    setPdfRenderError('');
    setIsPdfRendering(false);
    setShowPDFViewer(false);
  }, [pdfUrl]);

  const htmlToImage = useCallback(async (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    tempDiv.style.padding = '15mm';
    tempDiv.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Malgun Gothic", sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      document.body.removeChild(tempDiv);
      return canvas.toDataURL('image/png');
    } catch (error) {
      document.body.removeChild(tempDiv);
      throw error;
    }
  }, []);

  const formatDescription = useCallback((description) => {
    if (Array.isArray(description)) {
      return description
        .map((line) => String(line).trim().replace(/^-\s*/, ''))
        .map((line) => `- ${line}`)
        .join('<br>');
    }
    if (typeof description === 'string') {
      return description.replace(/\n/g, '<br>');
    }
    return '';
  }, []);

  const buildResumeHtml = useCallback(
    (resumeData) => {
      let htmlContent =
        "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif; color: #111;\">";

      if (resumeData?.name) {
        htmlContent += `<h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">${resumeData.name}</h1>`;
      }
      if (resumeData?.position) {
        htmlContent += `<h2 style="font-size: 16px; font-weight: 500; margin: 0 0 6px 0; color: #111;">${resumeData.position}</h2>`;
      }
      if (resumeData?.company) {
        htmlContent += `<p style="font-size: 12px; margin: 0 0 10px 0; color: #333;">${resumeData.company}</p>`;
      }

      htmlContent +=
        '<hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">';

      if (resumeData?.profile) {
        htmlContent +=
          '<h3 style="font-size: 12px; font-weight: bold; margin: 8px 0 4px 0;">연락처</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        if (resumeData.profile.email) {
          htmlContent += `<p style="font-size: 10px; margin: 2px 0; color: #111;">이메일: ${resumeData.profile.email}</p>`;
        }
        if (resumeData.profile.phone) {
          htmlContent += `<p style="font-size: 10px; margin: 2px 0; color: #111;">전화: ${resumeData.profile.phone}</p>`;
        }
        if (resumeData.profile.github) {
          htmlContent += `<p style="font-size: 10px; margin: 2px 0; color: #111;">GitHub: ${resumeData.profile.github}</p>`;
        }
        htmlContent += '</div>';
      }

      if (resumeData?.education && Array.isArray(resumeData.education)) {
        htmlContent +=
          '<h3 style="font-size: 12px; font-weight: bold; margin: 12px 0 4px 0;">학력</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        resumeData.education.forEach((edu) => {
          let eduText = '';
          if (edu.degree) eduText += edu.degree;
          if (edu.school) eduText += ` | ${edu.school}`;
          if (edu.period) eduText += ` | ${edu.period}`;
          htmlContent += `<p style="font-size: 10px; margin: 2px 0; color: #111;">${eduText}</p>`;
        });
        htmlContent += '</div>';
      }

      if (resumeData?.experience && Array.isArray(resumeData.experience)) {
        htmlContent +=
          '<h3 style="font-size: 12px; font-weight: bold; margin: 12px 0 4px 0;">경력</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        resumeData.experience.forEach((exp) => {
          let expText = '';
          if (exp.title) expText += `<strong>${exp.title}</strong>`;
          if (exp.company) expText += ` | ${exp.company}`;
          if (exp.period) expText += ` | ${exp.period}`;
          htmlContent += `<p style="font-size: 10px; margin: 4px 0; font-weight: bold; color: #111;">${expText}</p>`;
          if (exp.description) {
            htmlContent += `<p style="font-size: 10px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(exp.description)}</p>`;
          }
        });
        htmlContent += '</div>';
      }

      if (resumeData?.skills && Array.isArray(resumeData.skills)) {
        htmlContent +=
          '<h3 style="font-size: 12px; font-weight: bold; margin: 12px 0 4px 0;">기술 스택</h3>';
        htmlContent += `<p style="font-size: 10px; margin-left: 5px; color: #111;">${resumeData.skills.join(
          ', '
        )}</p>`;
      }

      if (resumeData?.projects && Array.isArray(resumeData.projects)) {
        htmlContent +=
          '<h3 style="font-size: 12px; font-weight: bold; margin: 12px 0 18px 0;">프로젝트</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        resumeData.projects.forEach((project) => {
          htmlContent += '<div style="margin-bottom: 22px;">';
          let projText = '';
          if (project.name) projText += `<strong>${project.name}</strong>`;
          if (project.period) projText += ` | ${project.period}`;
          htmlContent += `<p style="font-size: 10px; margin: 14px 0 6px 0; font-weight: bold; color: #111;">${projText}</p>`;
          if (project.description) {
            htmlContent += `<p style="font-size: 10px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(
              project.description
            )}</p>`;
          }
          const techStack = project.techStack || project.tech_stack;
          if (techStack) {
            const techText = Array.isArray(techStack)
              ? techStack.join(', ')
              : techStack;
            htmlContent += `<p style="font-size: 9px; margin: 2px 0 8px 0; font-style: italic; color: #333;">기술: ${techText}</p>`;
          }
          if (project.repoUrl) {
            htmlContent += `<p style="font-size: 9px; margin: 2px 0 10px 0; color: #333;">${project.repoUrl}</p>`;
          }
          htmlContent += '</div>';
        });
        htmlContent += '</div>';
      }

      htmlContent += '</div>';
      return htmlContent;
    },
    [formatDescription]
  );

  const handleExportPDF = useCallback(async () => {
    try {
      if (!yamlContent) {
        toast.error('이력서 내용을 찾을 수 없습니다.');
        return;
      }

      toast.loading('PDF 생성 중...', { id: 'pdf-loading' });

      let resumeData;
      try {
        resumeData = yaml.load(yamlContent);
      } catch (yamlError) {
        console.error('YAML 파싱 에러:', yamlError);
        toast.dismiss('pdf-loading');
        toast.error('YAML 형식 오류가 발생했습니다.');
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const normalizedData =
        resumeData?.resume && typeof resumeData.resume === 'object'
          ? { ...resumeData, ...resumeData.resume }
          : resumeData;
      const htmlContent = buildResumeHtml(normalizedData);
      const imgData = await htmlToImage(htmlContent);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('이미지 로드 시간 초과'));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const pxToMm = 0.264583;
            const imgWidthMm = imgWidth * pxToMm;
            const imgHeightMm = imgHeight * pxToMm;

            const scale = pdfWidth / imgWidthMm;
            const scaledHeight = imgHeightMm * scale;

            let yPosition = 0;
            let remainingHeight = scaledHeight;
            let sourceY = 0;

            while (remainingHeight > 0) {
              const pageHeight = Math.min(pdfHeight, remainingHeight);
              const sourceHeight = (pageHeight / scaledHeight) * imgHeight;

              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = imgWidth;
              tempCanvas.height = Math.ceil(sourceHeight);
              const ctx = tempCanvas.getContext('2d');

              if (!ctx) {
                throw new Error('Canvas context를 가져올 수 없습니다');
              }

              ctx.drawImage(
                img,
                0,
                sourceY,
                imgWidth,
                sourceHeight,
                0,
                0,
                imgWidth,
                sourceHeight
              );

              const pageImgData = tempCanvas.toDataURL('image/png');
              pdf.addImage(
                pageImgData,
                'PNG',
                0,
                yPosition,
                pdfWidth,
                pageHeight
              );

              remainingHeight -= pageHeight;
              sourceY += sourceHeight;

              if (remainingHeight > 0) {
                pdf.addPage();
                yPosition = 0;
              }
            }

            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = (e) => {
          clearTimeout(timeout);
          console.error('이미지 로드 에러:', e);
          reject(new Error('이미지 로드 실패'));
        };

        img.src = imgData;
      });

      const pdfArrayBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const url = URL.createObjectURL(pdfBlob);
      setPdfData(new Uint8Array(pdfArrayBuffer));
      setPdfUrl(url);
      setPdfRenderError('');
      setIsPdfRendering(true);
      setShowPDFViewer(true);

      // toast is dismissed after first page render
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      toast.dismiss('pdf-loading');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`PDF 생성 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }, [buildResumeHtml, htmlToImage, yamlContent, pdfUrl]);

  const status = versionData?.status;
  const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
  const isFailed = status === 'FAILED';

  if (isLoadingDetail || isLoadingVersion) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="이력서" showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">이력서를 불러오는 중...</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isDetailError) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title="이력서" showBack />
        <div className="px-5 py-9">
          <div className="max-w-[390px] mx-auto">
            <div className="flex flex-col items-center bg-white rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <p className="text-gray-500">이력서를 불러오지 못 했습니다.</p>
              <Button variant="primary" onClick={() => refetchDetail()}>
                재시도
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title={resumeDetail?.name || '이력서'} showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <h3>AI가 이력서를 생성 중입니다.</h3>
              <p className="text-sm text-gray-500">
                {status === 'QUEUED' ? '대기 중...' : '분석 중...'}
              </p>
              <p className="text-xs text-gray-400">
                잠시만 기다려주세요. 페이지를 벗어나도 진행됩니다.
              </p>
              <Button variant="ghost" onClick={() => navigate('/')}>
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopAppBar title={resumeDetail?.name || '이력서'} showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-500" />
              <h3>프로젝트 요약 생성에 실패했습니다.</h3>
              <p className="text-sm text-gray-500">
                {versionData?.errorLog || '알 수 없는 오류가 발생했습니다'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" onClick={() => navigate('/')}>
                  홈으로
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    refetchVersion();
                    refetchDetail();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  새로고침
                </Button>
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <TopAppBar
        title={resumeDetail?.name || '이력서'}
        showBack
        action={
          <div className="flex items-center gap-0">
            {/* <button
              onClick={handleSaveAndPreview}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="이력서 저장"
            >
              <Save className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button> */}
            <button
              onClick={handleExportPDF}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="PDF 다운로드"
            >
              <Download className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      <div className="px-5 py-2">
        <div className="max-w-[390px] mx-auto relative">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`
                flex-1 min-h-[44px] px-4 py-3 font-medium text-sm transition-colors
                border-b-2
                ${
                  activeTab === 'preview'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }
              `}
            >
              미리보기
            </button>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`
                flex-1 min-h-[44px] px-4 py-3 font-medium text-sm transition-colors
                border-b-2
                ${
                  activeTab === 'yaml'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }
              `}
            >
              YAML
            </button>
          </div>

          {yamlContent ? (
            activeTab === 'preview' ? (
              <ParsedResumeViewer
                ref={resumeViewerRef}
                yamlContent={rawContent || yamlContent}
              />
            ) : (
              <div className="bg-gray-900 rounded-2xl p-4 overflow-auto max-w-[390px] mx-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {yamlContent}
                </pre>
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-500">이력서 내용이 없습니다.</p>
            </div>
          )}

          {/* <button
            onClick={() => setShowChatbot(true)}
            className="fixed bottom-24 right-[calc(50%-195px+20px)] w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-10"
            aria-label="AI 챗봇 열기"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
          </button> */}
        </div>
      </div>

      {/* <ChatbotBottomSheet
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        messages={messages}
        chatInput={chatInput}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        isUpdating={isUpdating}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      /> */}

      {showPDFViewer && pdfUrl && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClosePDF}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[320px] h-[80vh] flex flex-col shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">PDF 미리보기</h3>
                <button
                  onClick={handleClosePDF}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden p-4 min-h-0">
                <div className="w-full h-full overflow-y-auto">
                  {isPdfRendering && (
                    <div className="text-sm text-gray-500 text-center py-6">
                      PDF를 불러오는 중...
                    </div>
                  )}
                  {pdfRenderError && !isPdfRendering && (
                    <div className="text-sm text-red-500 text-center py-6">
                      {pdfRenderError}
                    </div>
                  )}
                  <canvas
                    ref={setPdfCanvasEl}
                    className="w-full rounded-lg border border-gray-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-4 pb-3">
                <button
                  type="button"
                  onClick={() => setPdfPage((prev) => Math.max(1, prev - 1))}
                  disabled={pdfPage <= 1 || isPdfRendering}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    pdfPage <= 1 || isPdfRendering
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {pdfNumPages ? `${pdfPage} / ${pdfNumPages}` : '—'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPdfPage((prev) =>
                      Math.min(pdfNumPages || prev, prev + 1)
                    )
                  }
                  disabled={
                    pdfNumPages === 0 ||
                    pdfPage >= pdfNumPages ||
                    isPdfRendering
                  }
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    pdfNumPages === 0 ||
                    pdfPage >= pdfNumPages ||
                    isPdfRendering
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  다음
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                <Button variant="secondary" onClick={handleClosePDF}>
                  닫기
                </Button>
                <Button variant="primary" onClick={handleConfirmDownload}>
                  다운로드
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <WarningDialog
        isOpen={blocker.state === 'blocked'}
        title="아직 저장하지 않았어요."
        description="저장하지 않고 나가면 이력서가 사라질 수 있습니다."
        primaryButtonText="저장하고 나가기"
        secondaryButtonText="저장하지 않고 나가기"
        onPrimaryAction={handleSaveAndStay}
        onSecondaryAction={handleDiscardAndLeave}
      />

      <BottomNav />
    </div>
  );
}
