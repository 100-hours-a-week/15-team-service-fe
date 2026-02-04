import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/app/lib/toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  createResume,
  renameResume,
  saveResumeVersion,
  deleteResume,
} from '@/app/api/endpoints/resumes';
// import { resumeKeys } from '../queries/useResumeQueries';

export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;
      const status = error.response?.status;

      if (status === 401) {
        toast.error('로그인이 필요합니다.');
        window.location.href = '/';
        return;
      }

      switch (errorCode) {
        case 'INVALID_RESUME_NAME':
          toast.error('이력서명은 1~18글자로 입력해주세요.');
          break;
        case 'POSITION_NOT_FOUND':
          toast.error('선택한 포지션을 찾을 수 없습니다.');
          break;
        case 'COMPANY_NOT_FOUND':
          toast.error('선택한 회사를 찾을 수 없습니다.');
          break;
        case 'REPO_URLS_REQUIRED':
          toast.error('레포지토리를 선택해주세요.');
          break;
        default:
          toast.error('프로젝트 요약 생성에 실패했습니다.');
      }
    },
  });
}

export function useRenameResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resumeId, name }) => renameResume(resumeId, name),
    onSuccess: (_, { resumeId }) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      toast.success('이력서명이 수정되었습니다.');
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 'INVALID_RESUME_NAME':
          toast.error('이력서명은 1~18글자로 입력해주세요.');
          break;
        case 'RESUME_NOT_FOUND':
          toast.error('이력서를 찾을 수 없습니다.');
          break;
        default:
          toast.error('이력서명 수정에 실패했습니다.');
      }
    },
  });
}

export function useSaveResumeVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resumeId, versionNo }) =>
      saveResumeVersion(resumeId, versionNo),
    onSuccess: (_, { resumeId, versionNo }) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      queryClient.invalidateQueries({
        queryKey: ['resume', resumeId, 'version', versionNo],
      });
      toast.success('저장되었습니다.');
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 'RESUME_NOT_FOUND':
          toast.error('이력서를 찾을 수 없습니다.');
          break;
        case 'VERSION_NOT_FOUND':
          toast.error('버전을 찾을 수 없습니다.');
          break;
        default:
          toast.error('저장에 실패했습니다.');
      }
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('이력서가 삭제되었습니다.');
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;

      switch (errorCode) {
        case 'RESUME_NOT_FOUND':
          toast.error('이력서를 찾을 수 없습니다.');
          break;
        default:
          toast.error('이력서 삭제에 실패했습니다.');
      }
    },
  });
}

/**
 * Generate resume PDF from HTML element (client-side)
 * @param {Object} params
 * @param {HTMLElement} params.element - HTML element to convert to PDF
 * @param {string} params.filename - PDF filename
 */
const generatePDFFromHTML = async ({ element, filename }) => {
  if (!element) {
    throw new Error('Element not found');
  }

  const applyBadgeOverrides = (rootEl) => {
    const updates = [];
    rootEl.querySelectorAll('[data-tech-badge="true"]').forEach((badgeEl) => {
      updates.push({ el: badgeEl, style: badgeEl.getAttribute('style') });
      badgeEl.style.height = '24px';
      badgeEl.style.lineHeight = '24px';
      badgeEl.style.display = 'inline-flex';
      badgeEl.style.alignItems = 'center';
      badgeEl.style.justifyContent = 'center';
      badgeEl.style.verticalAlign = 'middle';
      badgeEl.style.paddingLeft = '12px';
      badgeEl.style.paddingRight = '12px';
      badgeEl.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif';
      badgeEl.style.fontSize = '14px';
    });
    rootEl
      .querySelectorAll('[data-tech-badge-text="true"]')
      .forEach((textEl) => {
        updates.push({ el: textEl, style: textEl.getAttribute('style') });
        textEl.style.display = 'block';
        textEl.style.lineHeight = '1';
        textEl.style.transform = 'translateY(-7px)';
      });

    return () => {
      updates.forEach(({ el, style }) => {
        if (style === null) {
          el.removeAttribute('style');
        } else {
          el.setAttribute('style', style);
        }
      });
    };
  };

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));

  const imgWidth = 210; // A4 가로 (mm)
  const margin = 15; // 여백 (mm)
  const contentWidth = imgWidth - margin * 2;

  // PDF 생성
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 프로젝트 요소들 찾기
  const projectItems = element.querySelectorAll('[data-project-item="true"]');

  if (projectItems.length === 0) {
    // 프로젝트가 없으면 전체 요소 캡처
    const restoreBadgeStyles = applyBadgeOverrides(element);
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.body;
        applyBadgeOverrides(clonedRoot);
      },
    });
    restoreBadgeStyles();
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // 각 프로젝트를 개별 페이지로
    for (let i = 0; i < projectItems.length; i++) {
      const projectEl = projectItems[i];

      // 캡처 전 임시로 패딩 추가
      const originalPadding = projectEl.style.padding;
      projectEl.style.padding = '16px';
      const restoreBadgeStyles = applyBadgeOverrides(projectEl);

      const canvas = await html2canvas(projectEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedRoot = clonedDoc.body;
          applyBadgeOverrides(clonedRoot);
        },
      });

      // 패딩 복원
      projectEl.style.padding = originalPadding;
      restoreBadgeStyles();

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      // 이미지만 추가 (제목은 프로젝트 내부에 이미 있음)
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
    }
  }

  pdf.save(filename);
};

/**
 * Generate resume PDF mutation (client-side)
 * @returns {UseMutationResult} Mutation result
 */
export function useGenerateResumePDF() {
  return useMutation({
    mutationFn: generatePDFFromHTML,
    onSuccess: () => {
      toast.success('PDF 다운로드가 완료되었습니다.');
    },
    onError: () => {
      toast.error('PDF 생성에 실패했습니다.');
    },
  });
}
