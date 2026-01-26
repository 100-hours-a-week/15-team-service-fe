import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Toaster } from 'sonner';

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

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        id="app-container"
        className="mx-auto max-w-[390px] min-h-screen bg-white shadow-xl relative"
      >
        <Outlet />
        <Toaster
          position="top-center"
          className="app-toaster"
          style={{
            '--width': 'min(390px, 100%)',
          }}
          toastOptions={{
            className: 'mx-auto',
          }}
        />
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <OnboardingPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/home', element: <HomePage /> },
      { path: '/repo-select', element: <RepoSelectPage /> },
      { path: '/create-resume', element: <CreateResumePage /> },
      { path: '/resume/:id', element: <ResumeViewerPage /> },
      { path: '/interview/start', element: <InterviewStartPage /> },
      { path: '/interview/session', element: <InterviewSessionPage /> },
      { path: '/interview/summary', element: <InterviewSummaryPage /> },
      { path: '/interview/detail/:id', element: <InterviewDetailPage /> },
      { path: '/interviews', element: <InterviewListPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
