import { useRef, useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorkerSource from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw';
import yaml from 'js-yaml';
import { toast } from '@/app/lib/toast';
import { formatPhoneNumber } from '@/app/lib/utils';

/**
 * Manages all PDF export state and logic for ResumeViewerPage.
 *
 * @param {{ yamlContent: string, userProfile: object, positions: Array, resumeName: string }} params
 * @returns {{ showPDFViewer, pdfPage, pdfNumPages, pdfCanvasEl, isPdfRendering,
 *             pdfRenderError, pdfUrl, handleExportPDF, handleClosePDF,
 *             handleConfirmDownload, setPdfPage }}
 */
export function usePdfExport({
  yamlContent,
  userProfile,
  positions,
  resumeName,
}) {
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [isPdfWorkerReady, setIsPdfWorkerReady] = useState(false);
  const [pdfCanvasEl, setPdfCanvasEl] = useState(null);

  const pdfDocRef = useRef(null);
  const pdfNotifyRef = useRef(false);
  const pdfWorkerBlobUrlRef = useRef(null);

  // Initialize PDF.js worker once on mount
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

  // Load PDF document when pdfData changes
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

  // Render current page to canvas
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
    (resumeData, userInfo) => {
      let htmlContent =
        "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif; color: #111;\">";

      if (userInfo?.name) {
        const hasPhoto = userInfo.profileImageUrl;

        if (hasPhoto) {
          htmlContent += `
            <div style="display: flex; align-items: center; margin-bottom: 24px; padding-bottom: 16px;">
              <div style="flex-shrink: 0; margin-right: 20px;">
                <img
                  src="${userInfo.profileImageUrl}"
                  alt="프로필 사진"
                  style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block;"
                />
              </div>
              <div style="flex: 1;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0; color: #111;">${userInfo.name}</h1>
                ${userInfo.phone ? `<p style="font-size: 16px; margin: 0; color: #333;">${userInfo.phone}</p>` : ''}
              </div>
            </div>
          `;
        } else {
          htmlContent += `
            <div style="margin-bottom: 24px; padding-bottom: 16px;">
              <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0; color: #111;">${userInfo.name}</h1>
              ${userInfo.phone ? `<p style="font-size: 16px; margin: 0; color: #333;">${userInfo.phone}</p>` : ''}
            </div>
          `;
        }
      }

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
          '<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">학력</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        resumeData.education.forEach((edu) => {
          let eduText = '';
          if (edu.degree) eduText += edu.degree;
          if (edu.school) eduText += ` | ${edu.school}`;
          if (edu.period) eduText += ` | ${edu.period}`;
          htmlContent += `<p style="font-size: 12px; margin: 2px 0; color: #111;">${eduText}</p>`;
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
          htmlContent += `<p style="font-size: 12px; margin: 4px 0; font-weight: bold; color: #111;">${expText}</p>`;
          if (exp.description) {
            htmlContent += `<p style="font-size: 12px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(exp.description)}</p>`;
          }
        });
        htmlContent += '</div>';
      }

      if (resumeData?.skills && Array.isArray(resumeData.skills)) {
        htmlContent +=
          '<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">기술 스택</h3>';
        htmlContent += `<p style="font-size: 12px; margin-left: 5px; color: #111;">${resumeData.skills.join(', ')}</p>`;
      }

      if (resumeData?.projects && Array.isArray(resumeData.projects)) {
        htmlContent +=
          '<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 18px 0;">프로젝트</h3>';
        htmlContent += '<div style="margin-left: 5px;">';
        resumeData.projects.forEach((project) => {
          htmlContent += '<div style="margin-bottom: 22px;">';
          let projText = '';
          if (project.name) projText += `<strong>${project.name}</strong>`;
          if (project.period) projText += ` | ${project.period}`;
          htmlContent += `<p style="font-size: 12px; margin: 14px 0 6px 0; font-weight: bold; color: #111;">${projText}</p>`;
          if (project.description) {
            htmlContent += `<p style="font-size: 12px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(project.description)}</p>`;
          }
          const techStack = project.techStack || project.tech_stack;
          if (techStack) {
            const techText = Array.isArray(techStack)
              ? techStack.join(', ')
              : techStack;
            htmlContent += `<p style="font-size: 11px; margin: 2px 0 8px 0; font-style: italic; color: #333;">기술: ${techText}</p>`;
          }
          if (project.repoUrl) {
            htmlContent += `<p style="font-size: 11px; margin: 2px 0 10px 0; color: #333;">${project.repoUrl}</p>`;
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

  const handleExportPDF = useCallback(async () => {
    try {
      if (!yamlContent) {
        toast.error('이력서 내용을 찾을 수 없습니다.');
        return;
      }

      toast.loading('PDF 생성 중...', { id: 'pdf-loading' });

      const userName = userProfile?.name || '';
      const userPositionId = userProfile?.positionId;
      const userPositionName =
        positions.find((p) => p.id === userPositionId)?.name || '';
      const userPhone = userProfile?.phone
        ? formatPhoneNumber(userProfile.phone)
        : null;
      const profileImageUrl = userProfile?.profileImageUrl || null;

      if (profileImageUrl) {
        try {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = profileImageUrl;
          });
        } catch {
          // Continue without image
        }
      }

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
      const userInfo = {
        name: userName,
        position: userPositionName,
        phone: userPhone,
        profileImageUrl: profileImageUrl,
      };
      const htmlContent = buildResumeHtml(normalizedData, userInfo);
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
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      toast.dismiss('pdf-loading');
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`PDF 생성 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }, [
    buildResumeHtml,
    htmlToImage,
    yamlContent,
    pdfUrl,
    userProfile,
    positions,
  ]);

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

  const handleConfirmDownload = useCallback(() => {
    if (!pdfUrl) {
      toast.error('PDF를 찾을 수 없습니다.');
      return;
    }

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${resumeName || '이력서'}.pdf`;
    link.click();
    toast.success('PDF가 다운로드되었습니다.');
  }, [pdfUrl, resumeName]);

  return {
    showPDFViewer,
    pdfPage,
    pdfNumPages,
    pdfCanvasEl: setPdfCanvasEl, // callback ref
    isPdfRendering,
    pdfRenderError,
    pdfUrl,
    handleExportPDF,
    handleClosePDF,
    handleConfirmDownload,
    setPdfPage,
  };
}
