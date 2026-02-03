import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { ensureCsrfToken } from './lib/utils';

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
import { useAuthStatus } from './hooks/queries/useUserQuery';

function RootLayout() {
  // Initialize CSRF token on app mount
  useEffect(() => {
    ensureCsrfToken();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        id="app-container"
        className="mx-auto max-w-[390px] min-h-screen bg-white shadow-xl relative"
      >
        <Outlet />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              backgroundColor: 'rgba(75, 85, 99, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              border: 'none',
              width: '320px',
              position: 'absolute',
              bottom: '60px',
              left: 'calc(47%)',
              transform: 'translateX(-50%)',
            },
            className: '!rounded-full !px-6',
          }}
        />
      </div>
    </div>
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
        path: '/interview/session',
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
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
