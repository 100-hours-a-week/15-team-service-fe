import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
          toast.error('이력서 생성에 실패했습니다.');
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

  // HTML을 canvas로 변환
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // PDF 생성
  const pdf = new jsPDF({
    orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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
