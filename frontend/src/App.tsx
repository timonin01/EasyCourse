import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { Landing, Login, PersonalDataConsent, PrivacyPolicy, Register } from './pages';

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const Courses = lazy(() =>
  import('./pages/Courses').then((m) => ({ default: m.Courses })),
);
const CourseEditor = lazy(() =>
  import('./pages/CourseEditor').then((m) => ({ default: m.CourseEditor })),
);
const AIGenerator = lazy(() =>
  import('./pages/AIGenerator').then((m) => ({ default: m.AIGenerator })),
);
const CourseAgent = lazy(() =>
  import('./pages/CourseAgent').then((m) => ({ default: m.CourseAgent })),
);
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings })),
);
const StepikSync = lazy(() =>
  import('./pages/StepikSync').then((m) => ({ default: m.StepikSync })),
);
const CourseAudit = lazy(() =>
  import('./pages/CourseAudit').then((m) => ({ default: m.CourseAudit })),
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 text-sm text-dark-400">
      Загрузка…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public routes — eager for SEO / first paint */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/consent" element={<PersonalDataConsent />} />

        {/* Private routes — code-split so landing does not download the app shell */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <Courses />
            </PrivateRoute>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <PrivateRoute>
              <CourseEditor />
            </PrivateRoute>
          }
        />
        <Route
          path="/ai-generator"
          element={
            <PrivateRoute>
              <AIGenerator />
            </PrivateRoute>
          }
        />
        <Route
          path="/course-agent"
          element={
            <PrivateRoute>
              <CourseAgent />
            </PrivateRoute>
          }
        />
        <Route
          path="/course-audit"
          element={
            <PrivateRoute>
              <CourseAudit />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/stepik-sync"
          element={
            <PrivateRoute>
              <StepikSync />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
