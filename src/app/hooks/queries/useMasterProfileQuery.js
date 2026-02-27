import { useQuery } from '@tanstack/react-query';

export const masterProfileKeys = {
  all: ['masterProfile'],
};

/**
 * Hook to fetch the master resume profile.
 * Currently returns mock data for UI implementation.
 */
export function useMasterProfile() {
  return useQuery({
    queryKey: masterProfileKeys.all,
    queryFn: async () => {
      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        name: '홍길동',
        profileImageUrl: null,
        phone: '01012345678',
        positionId: 1, // 백엔드
        bio: '안녕하세요. 5년차 백엔드 개발자 홍길동입니다.',
        techStacks: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'AWS'],
        experiences: [
          {
            id: 1,
            company: '테크컴퍼니',
            position: '백엔드 개발자',
            department: '플랫폼실',
            startDate: '2021-03',
            endDate: '',
            isCurrent: true,
            workType: '정규직',
            description: '이커머스 플랫폼 백엔드 개발 및 유지보수',
          },
        ],
        projects: [
          {
            id: 1,
            name: '결제 시스템 고도화',
            organization: '테크컴퍼니',
            startDate: '2022-01',
            endDate: '2022-06',
            isCurrent: false,
          },
        ],
        educations: [
          {
            id: 1,
            type: '대학교(학사)',
            institution: '한국대학교',
            major: '컴퓨터공학',
            status: '졸업',
            startDate: '2015-03',
            endDate: '2021-02',
          },
        ],
        activities: [],
        certifications: [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
