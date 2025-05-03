import React, { lazy, Suspense, useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/LoadingState';
import { Header } from './components/Header';
import { AdminRoute } from './components/AdminRoute';
import { UnauthorizedAccess } from './components/UnauthorizedAccess';
import { Footer } from './components/Footer';

// Layout component that includes Header for authenticated routes
const AuthenticatedLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  // Get the current path
  const pathname = window.location.pathname;
  const isLanding = pathname === '/';

  // Don't show header on landing page
  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <Header title={title} />
      {children}
      <Footer />
    </>
  );
};

// Improved lazy loading with better error boundaries
const lazyLoadWithErrorBoundary = (factory: () => Promise<any>, fallback: ReactNode = <LoadingState />) => {
  const Component = lazy(factory);
  return (props: any) => (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

// Lazy load all page components
const Landing = lazyLoadWithErrorBoundary(() => import('./pages/Landing'));
const Dashboard = lazyLoadWithErrorBoundary(() => import('./pages/Dashboard'));
const CompleteProfile = lazyLoadWithErrorBoundary(() => import('./pages/CompleteProfile'));
const Memory = lazyLoadWithErrorBoundary(() => import('./pages/Memory'));
const Competencies = lazyLoadWithErrorBoundary(() => import('./pages/Competencies'));
const ResumeReview = lazyLoadWithErrorBoundary(() => import('./pages/ResumeReview'));
const ExampleLinkedInPreview = lazyLoadWithErrorBoundary(() => import('./components/ExampleLinkedInPreview'));
const InterviewQuestions = lazyLoadWithErrorBoundary(() => import('./pages/InterviewQuestions'));
const UpcomingInterviews = lazyLoadWithErrorBoundary(() => import('./pages/UpcomingInterviews'));
const MockInterview = lazyLoadWithErrorBoundary(() => import('./pages/MockInterview'));
const MockInterviewPremium = lazyLoadWithErrorBoundary(() => import('./pages/MockInterviewPremium'));
const MockInterviewResults = lazyLoadWithErrorBoundary(() => import('./pages/MockInterviewResults'));
const InterviewAssistant = lazyLoadWithErrorBoundary(() => import('./pages/InterviewAssistant'));
const InterviewHistory = lazyLoadWithErrorBoundary(() => import('./pages/InterviewHistory'));
const ReferenceFeedback = lazyLoadWithErrorBoundary(() => import('./pages/ReferenceFeedback'));
const References = lazyLoadWithErrorBoundary(() => import('./pages/References'));
const TermsOfService = lazyLoadWithErrorBoundary(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazyLoadWithErrorBoundary(() => import('./pages/PrivacyPolicy'));

// Lazy load admin pages
const AdminUsers = lazyLoadWithErrorBoundary(() => import('./pages/admin/AdminUsers'));
const AdminTruthWall = lazyLoadWithErrorBoundary(() => import('./pages/admin/AdminTruthWall'));
const AdminCompanies = lazyLoadWithErrorBoundary(() => import('./pages/admin/AdminCompanies'));
const AdminReferences = lazyLoadWithErrorBoundary(() => import('./pages/admin/AdminReferences'));
const TruthWall = lazyLoadWithErrorBoundary(() => import('./pages/TruthWall'));

// Protected route component to check if profile is complete
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isProfileComplete } = useAuth();
  
  console.log('ProtectedRoute check - user:', !!user, 'loading:', loading, 'isProfileComplete:', isProfileComplete && isProfileComplete());
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Only redirect to complete-profile if profile is incomplete
  if (isProfileComplete && !isProfileComplete()) {
    console.log('Profile incomplete, redirecting to /complete-profile');
    return <Navigate to="/complete-profile" replace />;
  }
  
  return <>{children}</>;
};

// Page not found component - defined as a separate component to use hooks properly
const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGoHome = () => {
    // Redirect to dashboard if user is logged in, otherwise to landing page
    navigate(user ? '/dashboard' : '/');
  };
  
  return (
    <div className="min-h-screen bg-[#0F121A] flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <button
          onClick={handleGoHome}
          className="inline-block bg-[#FF8A00] hover:bg-[#E67A00] text-white py-2 px-4 rounded-lg transition-colors"
        >
          Go to {user ? 'Dashboard' : 'Home'}
        </button>
      </div>
    </div>
  );
};

function App() {
  // Get initial config based on environment variables
  const initialConfig = {
    theme: 'dark',
    debug: import.meta.env.DEV || false,
    features: {
      mockInterviews: true,
      resumeReview: true,
      linkedInImport: true,
      truthWall: true
    }
  };

  // Route title mapping
  const getTitleForRoute = (pathname: string): string | undefined => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/complete-profile': 'Profile Settings',
      '/memory': 'Work Experience',
      '/competencies': 'Competencies Framework',
      '/resume-review': 'Resume Review',
      '/interview-questions': 'Interview Questions',
      '/upcoming-interviews': 'Upcoming Interviews',
      '/mock-interview': 'Mock Interview',
      '/mock-interview-premium': 'Real-time Interview',
      '/interview-history': 'Interview History',
      '/admin/references': 'Manage References',
      '/references': 'Professional References'
    };
    
    // Check for exact matches
    if (routes[pathname]) return routes[pathname];
    
    // Check for path patterns
    if (pathname.startsWith('/mock-interview-results/')) return 'Interview Results';
    if (pathname.startsWith('/references/submit/')) return 'Reference Submission';
    if (pathname.startsWith('/admin/references/')) return 'Reference Details';
    
    return undefined;
  };

  return (
    <ErrorBoundary>
      <ConfigProvider initialConfig={initialConfig}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/truth-wall" element={<TruthWall />} />
                <Route path="/dashboard" element={
                  <AuthenticatedLayout title="Dashboard">
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/complete-profile" element={
                  <AuthenticatedLayout title="Complete Your Profile">
                    <CompleteProfile />
                  </AuthenticatedLayout>
                } />
                <Route path="/memory" element={
                  <AuthenticatedLayout title="Work Experience">
                    <ProtectedRoute>
                      <Memory />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/competencies" element={
                  <AuthenticatedLayout title="Competencies">
                    <AdminRoute fallback="/unauthorized">
                      <Competencies />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/interview-questions" element={
                  <AuthenticatedLayout title="Interview Questions">
                    <AdminRoute fallback="/unauthorized">
                      <InterviewQuestions />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/admin/references" element={
                  <AuthenticatedLayout title="Manage References">
                    <AdminRoute fallback="/unauthorized">
                      <AdminReferences />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/admin/users" element={
                  <AuthenticatedLayout title="Manage Users">
                    <AdminRoute fallback="/unauthorized">
                      <AdminUsers />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/admin/truth-wall" element={
                  <AuthenticatedLayout title="Truth Wall Management">
                    <AdminRoute fallback="/unauthorized">
                      <AdminTruthWall />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/admin/companies" element={
                  <AuthenticatedLayout title="Manage Companies">
                    <AdminRoute fallback="/unauthorized">
                      <AdminCompanies />
                    </AdminRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/resume-review" element={
                  <AuthenticatedLayout title="Resume Review">
                    <ProtectedRoute>
                      <ResumeReview />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/linkedin-preview" element={
                  <AuthenticatedLayout title="LinkedIn Preview">
                    <ProtectedRoute>
                      <ExampleLinkedInPreview />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/upcoming-interviews" element={
                  <AuthenticatedLayout title="Upcoming Interviews">
                    <ProtectedRoute>
                      <UpcomingInterviews />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/mock-interview" element={
                  <AuthenticatedLayout title="Mock Interview">
                    <ProtectedRoute>
                      <MockInterview />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/interview-history" element={
                  <AuthenticatedLayout title="Interview History">
                    <ProtectedRoute>
                      <InterviewHistory />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/mock-interview-premium" element={
                  <AuthenticatedLayout title="Real-time Interview">
                    <ProtectedRoute>
                      <MockInterviewPremium />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/mock-interview-results/:id" element={
                  <AuthenticatedLayout title="Interview Results">
                    <ProtectedRoute>
                      <MockInterviewResults />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/interview-assistant" element={
                  <AuthenticatedLayout title="Interview Assistant">
                    <ProtectedRoute>
                      <InterviewAssistant />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/references" element={
                  <AuthenticatedLayout title="Professional References">
                    <ProtectedRoute>
                      <References />
                    </ProtectedRoute>
                  </AuthenticatedLayout>
                } />
                <Route path="/references/submit/:token" element={<ReferenceFeedback />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/unauthorized" element={
                  <AuthenticatedLayout title="Unauthorized">
                    <UnauthorizedAccess />
                  </AuthenticatedLayout>
                } />
                <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;