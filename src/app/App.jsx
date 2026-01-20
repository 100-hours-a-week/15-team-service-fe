import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';

import { store } from './store';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { SignupPage } from './pages/auth/SignupPage';
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

/**
 * Root layout component for the application
 *
 * Implementation Decision:
 * - Migrated from BrowserRouter to createBrowserRouter to support useBlocker hook
 * - Wraps all routes with app-container (390px max-width mobile viewport)
 * - Includes Toaster for global toast notifications
 * - Redux Provider wraps entire app for global user state management
 */
function RootLayout() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <div id="app-container" className="mx-auto max-w-[390px] min-h-screen bg-white shadow-xl relative">
          <Outlet />
        </div>
        <Toaster position="top-center" />
      </div>
    </Provider>
  );
}

/**
 * Application router configuration
 *
 * Implementation Decision:
 * - Uses createBrowserRouter (React Router v7 data router API)
 * - Required for useBlocker hook in ResumeViewerPage
 * - All routes nested under RootLayout for consistent app container
 */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <OnboardingPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/home", element: <HomePage /> },
      { path: "/repo-select", element: <RepoSelectPage /> },
      { path: "/create-resume", element: <CreateResumePage /> },
      { path: "/resume/:id", element: <ResumeViewerPage /> },
      { path: "/interview/start", element: <InterviewStartPage /> },
      { path: "/interview/session", element: <InterviewSessionPage /> },
      { path: "/interview/summary", element: <InterviewSummaryPage /> },
      { path: "/interview/detail/:id", element: <InterviewDetailPage /> },
      { path: "/interviews", element: <InterviewListPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
