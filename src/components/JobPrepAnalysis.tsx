import React, { useState, useRef } from 'react';
import { Building, Briefcase, Upload, FileText, Search, ListChecks, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { FormInput } from './FormInput';
import { TextArea } from './TextArea';
import { Button } from './Button';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';
import { useResumes } from '../hooks/useResumes';
import { useCompetencies } from '../hooks/useCompetencies';
import { supabase } from '../lib/supabase';

interface JobPrepAnalysisProps {
  userId: string;
  interviewId?: string;
  onBack?: () => void;
}

export function JobPrepAnalysis({ userId, interviewId, onBack }: JobPrepAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch resumes for the selection dropdown
  const { resumes, loading: resumesLoading } = useResumes(userId);
  const { competencies } = useCompetencies();
  
  // File upload handlers
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    try {
      // Extract text from PDF
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the PDF extraction function
      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: { 
          pdfUrl: null, 
          fileBase64: await fileToBase64(file) 
        }
      });
      
      if (error) {
        throw new Error(`Failed to extract text: ${error.message}`);
      }
      
      if (!data || !data.text) {
        throw new Error('Failed to extract text from PDF');
      }
      
      // Set the extracted text as job description
      setJobDescription(data.text);
      
      // Try to extract company and job title from filename
      const fileName = file.name;
      const match = fileName.match(/([^-_]+)[_-]([^_-]+)/i);
      if (match) {
        if (!company) setCompany(match[1].replace(/[_-]/g, ' ').trim());
        if (!jobTitle) setJobTitle(match[2].replace(/[_-]/g, ' ').trim());
      }
      
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription.trim()) {
      setError('Job description is required');
      return;
    }
    
    if (!selectedResumeUrl && resumes.length > 0) {
      // Auto-select the first resume if none is selected
      setSelectedResumeUrl(resumes[0].url);
    }
    
    setLoading(true);
    setError(null);
    setAnalysisResults(null);
    
    try {
      // Call the edge function to analyze the job description
      const { data, error } = await supabase.functions.invoke('analyze-job-prep', {
        body: {
          jobDescription,
          jobTitle,
          company,
          resumeUrl: selectedResumeUrl,
          userId,
          interviewId
        }
      });
      
      if (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from analysis');
      }
      
      // Set analysis results
      setAnalysisResults(data);
      setSuccess(true);
      
      // If interviewId is provided, update the interview record with relevant info
      if (interviewId) {
        await supabase
          .from('interviews')
          .update({
            job_description: jobDescription,
            analysis_results: data
          })
          .eq('id', interviewId)
          .eq('user_id', userId);
      }
      
    } catch (err) {
      console.error('Error analyzing job description:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze job description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Description Input Form */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Job Interview Preparation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert 
            variant="info" 
            message="Upload a job description to get personalized interview preparation recommendations. We'll analyze it against your resume and provide tailored advice."
            className="mb-4"
          />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                label="Company Name"
                placeholder="e.g. Google"
                icon={Building}
              />
              
              <FormInput
                name="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                label="Job Title"
                placeholder="e.g. Senior Software Engineer"
                icon={Briefcase}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-gray-300 mb-2">Job Description</label>
              
              <div className="flex items-center space-x-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={Upload}
                  onClick={handleFileButtonClick}
                  className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
                >
                  Upload Job Description PDF
                </Button>
                <span className="text-sm text-gray-400">or paste below</span>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
              
              <TextArea
                name="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here or upload a PDF..."
                icon={FileText}
                rows={10}
              />
            </div>
            
            {/* Resume selection */}
            <div className="space-y-2">
              <label className="block text-gray-300 mb-2">Select Your Resume</label>
              
              {resumesLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : resumes.length === 0 ? (
                <Alert
                  variant="warning"
                  message="You don't have any resumes uploaded. Please upload a resume in your profile settings first."
                  className="mb-4"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resumes
                    .filter(r => r.fileType === 'pdf' || r.name.toLowerCase().endsWith('.pdf'))
                    .map((resume, index) => {
                      const displayName = resume.name.replace(/^\d+_/, '');
                      return (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            selectedResumeUrl === resume.url
                              ? 'bg-[#FF8A00]/10 border-[#FF8A00]'
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          } cursor-pointer transition-colors`}
                          onClick={() => setSelectedResumeUrl(resume.url)}
                        >
                          <div className="flex items-center">
                            <FileText className={`h-5 w-5 mr-3 ${selectedResumeUrl === resume.url ? 'text-[#FF8A00]' : 'text-gray-400'}`} />
                            <div>
                              <p className={`font-medium ${selectedResumeUrl === resume.url ? 'text-white' : 'text-gray-300'}`}>
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {resume.uploaded_at}
                              </p>
                            </div>
                          </div>
                          
                          {selectedResumeUrl === resume.url && (
                            <div className="w-4 h-4 rounded-full bg-[#FF8A00]"></div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            
            {error && (
              <Alert
                variant="error"
                message={error}
                onClose={() => setError(null)}
              />
            )}
            
            <div className="flex justify-end space-x-3 pt-2">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                >
                  Back
                </Button>
              )}
              
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading || !jobDescription.trim() || resumes.length === 0}
                leftIcon={Search}
              >
                Analyze Job Description
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Analysis Results */}
      {loading ? (
        <ContentLoading 
          message="Analyzing job description..." 
          className="py-8"
          error={error || undefined}
          onRetry={error ? handleSubmit : undefined}
        />
      ) : error ? (
        <ContentLoading 
          error={error}
          onRetry={handleSubmit}
          className="py-8"
        />
      ) : analysisResults && (
        <div className="animate-fadeIn">
          <Card className="border border-green-700/30 bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                Interview Preparation Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert 
                variant="success" 
                title="Analysis Complete"
                message="We've analyzed the job description and prepared a customized interview preparation plan for you."
                className="mb-4"
              />
              
              {/* Job Match Score */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#374151" 
                        strokeWidth="10" 
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke={analysisResults.matchScore >= 85 ? "#34D399" : analysisResults.matchScore >= 70 ? "#60A5FA" : "#FBBF24"} 
                        strokeWidth="10" 
                        strokeDasharray={`${analysisResults.matchScore * 2.826} 282.6`} 
                        strokeDashoffset="0" 
                        strokeLinecap="round" 
                        transform="rotate(-90 50 50)" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-3xl font-bold ${
                        analysisResults.matchScore >= 85 ? "text-green-400" : 
                        analysisResults.matchScore >= 70 ? "text-blue-400" : 
                        "text-yellow-400"
                      }`}>
                        {analysisResults.matchScore}%
                      </span>
                      <span className="text-xs text-gray-400">Match</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    analysisResults.matchScore >= 85 
                      ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                      : analysisResults.matchScore >= 70 
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                        : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
                  }`}>
                    {analysisResults.matchScore >= 85 
                      ? 'Excellent Match' 
                      : analysisResults.matchScore >= 70 
                        ? 'Good Match' 
                        : 'Fair Match'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-2">Match Analysis</h3>
                  <p className="text-gray-300 text-sm">
                    {analysisResults.analysis || 
                      `Based on the job description and your resume, you have a ${analysisResults.matchScore}% match for this position. Focus on highlighting your relevant experience and skills during the interview.`}
                  </p>
                </div>
              </div>
              
              {/* Key Skills and Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Skills You Match
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.skills?.matched?.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-900/20 text-green-400 rounded text-sm border border-green-900/30">
                        {skill}
                      </span>
                    ))}
                    
                    {(!analysisResults.skills?.matched || analysisResults.skills.matched.length === 0) && (
                      <p className="text-gray-400 text-sm">No direct skill matches identified.</p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <ListChecks className="h-4 w-4 mr-2 text-yellow-400" />
                    Skills to Emphasize
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.skills?.missing?.map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded text-sm border border-yellow-900/30">
                        {skill}
                      </span>
                    ))}
                    
                    {(!analysisResults.skills?.missing || analysisResults.skills.missing.length === 0) && (
                      <p className="text-gray-400 text-sm">No skills gaps identified.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Preparation Focus Areas */}
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-white font-medium mb-4">Interview Preparation Plan</h3>
                
                <div className="space-y-4">
                  {/* Resume Tailoring */}
                  <div className="p-3 border border-gray-700 bg-gray-750 rounded-lg">
                    <h4 className="text-[#FF8A00] font-medium mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Resume Tailoring
                    </h4>
                    <ul className="space-y-2 text-gray-300">
                      {analysisResults.resumeSuggestions?.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#FF8A00] mr-2">•</span>
                          {suggestion}
                        </li>
                      ))}
                      
                      {(!analysisResults.resumeSuggestions || analysisResults.resumeSuggestions.length === 0) && (
                        <li>Focus on highlighting your technical skills and past achievements relevant to this role.</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Key Competencies to Practice */}
                  <div className="p-3 border border-gray-700 bg-gray-750 rounded-lg">
                    <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Key Competencies to Practice
                    </h4>
                    <div className="mb-2">
                      {analysisResults.requiredCompetencies?.map((code: string) => {
                        const competency = competencies.find(c => c.code === code);
                        return competency ? (
                          <div key={code} className="mb-2 flex items-start">
                            <span className="bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded text-xs font-mono mr-2 mt-0.5">
                              {code}
                            </span>
                            <div>
                              <p className="text-white text-sm">{competency.name}</p>
                              <p className="text-gray-400 text-xs">{competency.definition}</p>
                            </div>
                          </div>
                        ) : null;
                      })}
                      
                      {(!analysisResults.requiredCompetencies || analysisResults.requiredCompetencies.length === 0) && (
                        <p className="text-gray-400 text-sm">No specific competencies identified.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Company Information */}
                  <div className="p-3 border border-gray-700 bg-gray-750 rounded-lg">
                    <h4 className="text-green-400 font-medium mb-2 flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Company & Role Insights
                    </h4>
                    <div className="text-gray-300 space-y-2">
                      {analysisResults.companyInfo && (
                        <p>{analysisResults.companyInfo}</p>
                      )}
                      
                      {analysisResults.roleInfo && (
                        <p>{analysisResults.roleInfo}</p>
                      )}
                      
                      {analysisResults.fitRationale && (
                        <div className="pt-2 mt-2 border-t border-gray-700">
                          <p className="text-white font-medium mb-1">Why You're a Good Fit:</p>
                          <p>{analysisResults.fitRationale}</p>
                        </div>
                      )}
                      
                      {(!analysisResults.companyInfo && !analysisResults.roleInfo) && (
                        <p className="text-gray-400 text-sm">Company information not available.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Salary Range */}
                  {analysisResults.salaryRange && (
                    <div className="p-3 border border-gray-700 bg-gray-750 rounded-lg">
                      <h4 className="text-purple-400 font-medium mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                          <path d="M12 18V6" />
                        </svg>
                        Estimated Salary Range
                      </h4>
                      <p className="text-white">
                        {analysisResults.salaryRange}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        This is an estimate based on market data and job description. Actual salary may vary.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Potential Interview Questions */}
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="text-white font-medium mb-3">Potential Interview Questions</h3>
                
                <div className="space-y-3">
                  {analysisResults.potentialQuestions?.map((question: string, index: number) => (
                    <div key={index} className="p-3 bg-gray-750 border border-gray-700 rounded-lg">
                      <p className="text-gray-300">{question}</p>
                    </div>
                  ))}
                  
                  {(!analysisResults.potentialQuestions || analysisResults.potentialQuestions.length === 0) && (
                    <p className="text-gray-400">No specific questions predicted.</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 pt-4">
              <Button
                variant="primary"
                leftIcon={RefreshCw}
                onClick={handleSubmit}
                isLoading={loading}
                disabled={loading}
                fullWidth
              >
                Refresh Analysis
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}