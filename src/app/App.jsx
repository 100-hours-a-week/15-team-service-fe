import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { ensureCsrfToken } from './lib/utils';
import {
  useNotificationSSE,
  NotificationContext,
} from './hooks/useNotificationSSE';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationToastBanner } from './components/features/NotificationToastBanner';

import { OnboardingPage } from './pages/auth/OnboardingPage';
import { SignupPage } from './pages/auth/SignupPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { HomePage } from './pages/HomePage';
import { RepoSelectPage } from './pages/resume/RepoSelectPage';
import { CreateResumePage } from './pages/resume/CreateResumePage';
import { ResumeViewerPage } from './pages/resume/ResumeViewerPage';
import { InterviewStartPage } from './pages/interview/InterviewStartPage';
import { InterviewSessionPage } from './pages/interview/InterviewSessionPage';
import { InterviewSummaryPage } from './pages/interview/InterviewSummaryPage';
import { InterviewDetailPage } from './pages/interview/InterviewDetailPage';
import { InterviewListPage } from './pages/interview/InterviewListPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { ProfileOnboardingPage } from './pages/onboarding/ProfileOnboardingPage';
import { ResumeProfileSetupPage } from './pages/resume/ResumeProfileSetupPage';
import { useAuthStatus } from './hooks/queries/useUserQuery';

function RootLayout() {
  const { data: userProfile } = useAuthStatus();

  // Initialize CSRF token on app mount
  useEffect(() => {
    if (userProfile) {
      ensureCsrfToken();
    }
  }, [userProfile]);

  // Single SSE connection for the entire app — toast fires on any page
  const notification = useNotificationSSE(Boolean(userProfile));

  return (
    <NotificationContext.Provider value={notification}>
      <div className="min-h-screen bg-gray-50">
        <div
          id="app-container"
          className="mx-auto max-w-[390px] min-h-screen bg-white shadow-xl relative"
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
          <NotificationToastBanner />
          <Toaster
            position="bottom-center"
            expand={true}
            toastOptions={{
              style: {
                backgroundColor: 'rgba(75, 85, 99, 0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                border: 'none',
                width: '320px',
                position: 'absolute',
                bottom: '20px',
                left: 'calc(47%)',
                transform: 'translateX(-50%)',
              },
              className: '!rounded-full !px-6',
            }}
            offset={80}
          />
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

function AuthGate({ children, mode }) {
  const { data: userProfile, isLoading, error } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (mode === 'public') {
    if (userProfile) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  if (!userProfile || error?.response?.status === 401) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const ProtectedRoute = ({ children }) => (
  <AuthGate mode="protected">{children}</AuthGate>
);

const PublicRoute = ({ children }) => (
  <AuthGate mode="public">{children}</AuthGate>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <OnboardingPage />
          </PublicRoute>
        ),
      },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },
      { path: '/home', element: <Navigate to="/" replace /> },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/repo-select',
        element: (
          <ProtectedRoute>
            <RepoSelectPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/resume-setup',
        element: (
          <ProtectedRoute>
            <ResumeProfileSetupPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/create-resume',
        element: (
          <ProtectedRoute>
            <CreateResumePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/resume/:id',
        element: (
          <ProtectedRoute>
            <ResumeViewerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/interview/start',
        element: (
          <ProtectedRoute>
            <InterviewStartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/interview/session/:interviewId',
        element: (
          <ProtectedRoute>
            <InterviewSessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/interview/summary',
        element: (
          <ProtectedRoute>
            <InterviewSummaryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/interview/detail/:id',
        element: (
          <ProtectedRoute>
            <InterviewDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/interviews',
        element: (
          <ProtectedRoute>
            <InterviewListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/settings/profile',
        element: (
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/onboarding/profile',
        element: (
          <ProtectedRoute>
            <ProfileOnboardingPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
