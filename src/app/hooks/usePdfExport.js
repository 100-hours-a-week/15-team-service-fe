import { useRef, useState, useCallback, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorkerSource from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw';
import yaml from 'js-yaml';
import { toast } from '@/app/lib/toast';
import { formatPhoneNumber } from '@/app/lib/utils';

const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  FREELANCE: '프리랜서',
};

const EDUCATION_TYPE_LABELS = {
  BACHELOR: '학사',
  MASTER: '석사',
  DOCTOR: '박사',
  ASSOCIATE: '전문학사',
  HIGH_SCHOOL: '고졸',
};

const EDUCATION_STATUS_LABELS = {
  GRADUATED: '졸업',
  ENROLLING: '재학중',
  DROPPED_OUT: '중퇴',
  COMPLETED: '수료',
  GRADUATION_POSTPONED: '졸업유예',
};

/**
 * Manages all PDF export state and logic for ResumeViewerPage.
 *
 * @param {{ yamlContent: string, userProfile: object, positions: Array, resumeName: string, resumeProfile: object }} params
 * @returns {{ showPDFViewer, pdfPage, pdfNumPages, pdfCanvasEl, isPdfRendering,
 *             pdfRenderError, pdfUrl, handleExportPDF, handleClosePDF,
 *             handleConfirmDownload, setPdfPage }}
 */
export function usePdfExport({
  yamlContent,
  userProfile,
  positions,
  resumeName,
  resumeProfile,
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
    (resumeData, userInfo, profile) => {
      const s =
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif; color: #111;";
      let html = `<div style="${s}">`;

      // --- Header: name + phone ---
      const displayName = profile?.name || userInfo?.name;
      const displayPhone = profile?.phoneNumber || userInfo?.phone;
      const displayPhoto =
        profile?.profileImageUrl || userInfo?.profileImageUrl;

      if (displayName) {
        if (displayPhoto) {
          html += `
            <div style="display: flex; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <div style="flex-shrink: 0; margin-right: 20px;">
                <img src="${displayPhoto}" alt="프로필 사진"
                  style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block;" />
              </div>
              <div style="flex: 1;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0; color: #111;">${displayName}</h1>
                ${displayPhone ? `<p style="font-size: 14px; margin: 0; color: #555;">${displayPhone}</p>` : ''}
              </div>
            </div>`;
        } else {
          html += `
            <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 8px 0; color: #111;">${displayName}</h1>
              ${displayPhone ? `<p style="font-size: 14px; margin: 0; color: #555;">${displayPhone}</p>` : ''}
            </div>`;
        }
      }

      if (profile) {
        // --- 자기소개 ---
        if (profile.introduction) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 6px 0; color: #2F6BFF;">자기소개</h3>`;
          html += `<p style="font-size: 12px; margin: 0 0 16px 0; line-height: 1.7; white-space: pre-line; color: #333;">${profile.introduction}</p>`;
        }

        // --- 경력 ---
        if (profile.experiences?.length > 0) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; color: #2F6BFF;">경력</h3>`;
          profile.experiences.forEach((exp) => {
            const period = `${exp.startAt} ~ ${exp.isCurrentlyWorking ? '현재' : exp.endAt || ''}`;
            const typeLabel =
              EMPLOYMENT_TYPE_LABELS[exp.employmentType] ||
              exp.employmentType ||
              '';
            const subLine = [exp.position, exp.department, typeLabel]
              .filter(Boolean)
              .join(' · ');
            html += `<div style="margin-bottom: 12px;">`;
            html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
              <span style="font-size: 13px; font-weight: 600; color: #111;">${exp.companyName}</span>
              <span style="font-size: 11px; color: #888;">${period}</span>
            </div>`;
            html += `<p style="font-size: 12px; margin: 0 0 4px 0; color: #555;">${subLine}</p>`;
            if (exp.responsibilities) {
              html += `<p style="font-size: 12px; margin: 0; line-height: 1.6; white-space: pre-line; color: #333;">${exp.responsibilities}</p>`;
            }
            html += `</div>`;
          });
        }

        // --- 학력 ---
        if (profile.educations?.length > 0) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; color: #2F6BFF;">학력</h3>`;
          profile.educations.forEach((edu) => {
            const period = `${edu.startAt} ~ ${edu.endAt || ''}`;
            const typeLabel =
              EDUCATION_TYPE_LABELS[edu.educationType] ||
              edu.educationType ||
              '';
            const statusLabel =
              EDUCATION_STATUS_LABELS[edu.status] || edu.status || '';
            const subLine = [edu.major, typeLabel, statusLabel]
              .filter(Boolean)
              .join(' · ');
            html += `<div style="margin-bottom: 10px;">`;
            html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
              <span style="font-size: 13px; font-weight: 600; color: #111;">${edu.institution}</span>
              <span style="font-size: 11px; color: #888;">${period}</span>
            </div>`;
            html += `<p style="font-size: 12px; margin: 0; color: #555;">${subLine}</p>`;
            html += `</div>`;
          });
        }

        // --- 기술 스택 (profile) ---
        if (profile.techStacks?.length > 0) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 6px 0; color: #2F6BFF;">기술 스택</h3>`;
          html += `<p style="font-size: 12px; margin: 0 0 16px 0; color: #333;">${profile.techStacks.map((t) => t.name).join(', ')}</p>`;
        }

        // --- 활동 ---
        if (profile.activities?.length > 0) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; color: #2F6BFF;">활동</h3>`;
          profile.activities.forEach((act) => {
            html += `<div style="margin-bottom: 8px;">`;
            html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px;">
              <span style="font-size: 13px; font-weight: 600; color: #111;">${act.title}</span>
              ${act.year ? `<span style="font-size: 11px; color: #888;">${act.year}</span>` : ''}
            </div>`;
            if (act.organization) {
              html += `<p style="font-size: 12px; margin: 0 0 2px 0; color: #555;">${act.organization}</p>`;
            }
            if (act.description) {
              html += `<p style="font-size: 12px; margin: 0; color: #333;">${act.description}</p>`;
            }
            html += `</div>`;
          });
        }

        // --- 자격증 ---
        if (profile.certificates?.length > 0) {
          html += `<h3 style="font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; color: #2F6BFF;">자격증</h3>`;
          profile.certificates.forEach((cert) => {
            html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">`;
            html += `<div>
              <span style="font-size: 13px; font-weight: 600; color: #111;">${cert.name}</span>
              ${cert.issuer ? `<span style="font-size: 12px; color: #555;"> · ${cert.issuer}</span>` : ''}
              ${cert.score ? `<span style="font-size: 12px; color: #555;"> · ${cert.score}점</span>` : ''}
            </div>`;
            if (cert.issuedAt) {
              html += `<span style="font-size: 11px; color: #888;">${cert.issuedAt}</span>`;
            }
            html += `</div>`;
          });
        }
      } else {
        // No profile — legacy YAML-based rendering for education/experience/skills
        if (resumeData?.education && Array.isArray(resumeData.education)) {
          html += `<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">학력</h3>`;
          html += `<div style="margin-left: 5px;">`;
          resumeData.education.forEach((edu) => {
            let eduText = '';
            if (edu.degree) eduText += edu.degree;
            if (edu.school) eduText += ` | ${edu.school}`;
            if (edu.period) eduText += ` | ${edu.period}`;
            html += `<p style="font-size: 12px; margin: 2px 0; color: #111;">${eduText}</p>`;
          });
          html += `</div>`;
        }

        if (resumeData?.experience && Array.isArray(resumeData.experience)) {
          html += `<h3 style="font-size: 12px; font-weight: bold; margin: 12px 0 4px 0;">경력</h3>`;
          html += `<div style="margin-left: 5px;">`;
          resumeData.experience.forEach((exp) => {
            let expText = '';
            if (exp.title) expText += `<strong>${exp.title}</strong>`;
            if (exp.company) expText += ` | ${exp.company}`;
            if (exp.period) expText += ` | ${exp.period}`;
            html += `<p style="font-size: 12px; margin: 4px 0; font-weight: bold; color: #111;">${expText}</p>`;
            if (exp.description) {
              html += `<p style="font-size: 12px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(exp.description)}</p>`;
            }
          });
          html += `</div>`;
        }

        if (resumeData?.skills && Array.isArray(resumeData.skills)) {
          html += `<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 4px 0;">기술 스택</h3>`;
          html += `<p style="font-size: 12px; margin-left: 5px; color: #111;">${resumeData.skills.join(', ')}</p>`;
        }
      }

      // --- 프로젝트 (YAML) ---
      if (resumeData?.projects && Array.isArray(resumeData.projects)) {
        html += `<h3 style="font-size: 14px; font-weight: bold; margin: 16px 0 8px 0; color: #2F6BFF;">프로젝트</h3>`;
        html += `<div style="margin-left: 5px;">`;
        resumeData.projects.forEach((project) => {
          html += `<div style="margin-bottom: 22px;">`;
          let projText = '';
          if (project.name) projText += `<strong>${project.name}</strong>`;
          if (project.period) projText += ` | ${project.period}`;
          html += `<p style="font-size: 12px; margin: 14px 0 6px 0; font-weight: bold; color: #111;">${projText}</p>`;
          if (project.description) {
            html += `<p style="font-size: 12px; margin: 2px 0 6px 0; white-space: pre-wrap; color: #111;">${formatDescription(project.description)}</p>`;
          }
          const techStack = project.techStack || project.tech_stack;
          if (techStack) {
            const techText = Array.isArray(techStack)
              ? techStack.join(', ')
              : techStack;
            html += `<p style="font-size: 11px; margin: 2px 0 8px 0; font-style: italic; color: #333;">기술: ${techText}</p>`;
          }
          if (project.repoUrl) {
            html += `<p style="font-size: 11px; margin: 2px 0 10px 0; color: #333;">${project.repoUrl}</p>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
      return html;
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
      const htmlContent = buildResumeHtml(
        normalizedData,
        userInfo,
        resumeProfile
      );
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
    resumeProfile,
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
