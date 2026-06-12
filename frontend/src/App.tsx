import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { 
  Login, 
  Register, 
  Dashboard, 
  Courses, 
  CourseEditor, 
  AIGenerator, 
  Settings,
  StepikSync 
} from './pages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Private routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/courses" element={
        <PrivateRoute>
          <Courses />
        </PrivateRoute>
      } />
      <Route path="/courses/:courseId" element={
        <PrivateRoute>
          <CourseEditor />
        </PrivateRoute>
      } />
      <Route path="/ai-generator" element={
        <PrivateRoute>
          <AIGenerator />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
      <Route path="/stepik-sync" element={
        <PrivateRoute>
          <StepikSync />
        </PrivateRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

