import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Book, ListChecks, ShieldAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { CompetencyList } from '../components/CompetencyList';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { Alert } from '../components/Alert';

export default function Competencies() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();

  // Redirect if still loading or if authenticated user isn't available
  if (authLoading || adminLoading) {
    return <LoadingState />;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  // Admin banner to confirm admin access
  const AdminBanner = () => (
    <Alert 
      variant="success" 
      message="You are viewing this page with administrator access." 
      className="mb-4"
      icon={ShieldAlert}
    />
  );

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Back Button */}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6 transition-colors duration-200"
        >
          Back to Dashboard
        </Button>

        {/* Admin Access Banner */}
        {isAdmin && <AdminBanner />}

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <ListChecks className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                Competencies Framework
              </h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Browse the complete framework of competencies used for assessments
              and evaluations.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 gap-6">
          {/* About Competencies Section */}
          <section className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg border border-gray-700 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#FF8A00]/20 p-3 rounded-lg flex-shrink-0">
                <Book className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  About Competencies
                </h2>
                <p className="text-gray-300 mb-3">
                  Competencies are the measurable skills, abilities, and
                  knowledge that define successful performance in a role. Our
                  framework breaks down each competency into five levels of
                  proficiency, from basic understanding to expert mastery.
                </p>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-white font-medium mb-2">
                    Framework Structure:
                  </h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      <strong>Assessment Type:</strong> How the competency is
                      evaluated (Explicit, Overarching, Conditional)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <strong>Category:</strong> Grouping of related
                      competencies (Interpersonal, Intellectual, Operational,
                      etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      <strong>Levels 1-5:</strong> Descriptions of proficiency
                      from basic to expert
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Competency List Section */}
          <section>
            <CompetencyList />
          </section>
        </main>
      </div>
    </div>
  );
}