import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Plus, Upload, Book, Check, Lightbulb, Star, Lock, Info, ShieldAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Alert } from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { useInterviewQuestions, QuestionInput } from '../hooks/useInterviewQuestions';
import { InterviewQuestionsTable } from '../components/InterviewQuestionsTable';
import { CSVUploader } from '../components/CSVUploader';
import { Modal } from '../components/Modal';
import { useAdminStatus } from '../hooks/useAdminStatus';

export default function InterviewQuestions() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const { 
    questions, 
    loading: questionsLoading, 
    error: questionsError,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    refresh,
    isAdmin: hasAdminPermissions
  } = useInterviewQuestions();
  
  const [activeTab, setActiveTab] = useState<'questions' | 'tips'>('questions');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      message="You are viewing this page with administrator access. You can manage interview questions." 
      className="mb-4"
      icon={ShieldAlert}
    />
  );

  const handleCSVUpload = async (questions: QuestionInput[]) => {
    setUploadError(null);
    let successCount = 0;
    let errorCount = 0;

    for (const question of questions) {
      try {
        const result = await addQuestion(question);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      setUploadError(`Uploaded ${successCount} questions. Failed to upload ${errorCount} questions.`);
    }

    // Close modal and refresh list
    setShowUploadModal(false);
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <HelpCircle className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Interview Questions</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Prepare for interviews by studying common questions organized by competency and type.
            </p>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  leftIcon={Upload}
                  onClick={() => setShowUploadModal(true)}
                >
                  Import CSV
                </Button>
                <Button
                  variant={showAddForm ? "secondary" : "primary"}
                  leftIcon={showAddForm ? Edit : Plus}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Cancel" : "Add Question"}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'questions' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('questions')}
          >
            Question Bank
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'tips' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('tips')}
          >
            Interview Tips
          </button>
        </div>
        
        {activeTab === 'questions' ? (
          <div className="animate-fadeIn">
            <InterviewQuestionsTable
              questions={questions}
              loading={questionsLoading}
              error={questionsError}
              onAdd={addQuestion}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              isAdmin={isAdmin}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <Alert
              variant="info"
              message="These interview tips will help you prepare effectively for different types of questions and interview formats."
            />
            
            {/* Interview Tips Section */}
            <Card className="border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-[#FF8A00]" />
                  Interview Preparation Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-medium flex items-center">
                      <Book className="h-4 w-4 mr-2 text-[#FF8A00]" />
                      Before the Interview
                    </h3>
                    <ul className="space-y-2">
                      <li className="text-gray-300">• Research the company thoroughly</li>
                      <li className="text-gray-300">• Review the job description in detail</li>
                      <li className="text-gray-300">• Prepare your STAR stories</li>
                      <li className="text-gray-300">• Practice common questions</li>
                      <li className="text-gray-300">• Prepare thoughtful questions to ask</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-medium flex items-center">
                      <Star className="h-4 w-4 mr-2 text-[#FF8A00]" />
                      During the Interview
                    </h3>
                    <ul className="space-y-2">
                      <li className="text-gray-300">• Listen carefully to questions</li>
                      <li className="text-gray-300">• Take time to structure responses</li>
                      <li className="text-gray-300">• Use specific examples</li>
                      <li className="text-gray-300">• Show enthusiasm and interest</li>
                      <li className="text-gray-300">• Ask insightful questions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Import Questions from CSV"
        size="lg"
      >
        <CSVUploader
          onUpload={handleCSVUpload}
          onCancel={() => setShowUploadModal(false)}
        />
        {uploadError && (
          <Alert
            variant="error"
            message={uploadError}
            onClose={() => setUploadError(null)}
            className="mt-4"
          />
        )}
      </Modal>
    </div>
  );
}