import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, Upload, ChevronDown, ChevronUp, Building, User, CheckCircle2, XCircle, Copy, Check, Award, PenTool, TextIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { Alert } from './Alert';
import { useResumes } from '../hooks/useResumes';
import { useJobDescriptions } from '../hooks/useJobDescriptions';
import { useJobMatch, JobMatchResult } from '../hooks/useJobMatch';
import { LoadingSpinner, ContentLoading, FileLoading } from './LoadingState';
import { ProcessingIndicator } from './LoadingIndicator';
import { TextArea } from './TextArea';

interface JobMatchSectionProps {
  userId: string;
}

export function JobMatchSection({ userId }: JobMatchSectionProps) {
  // Fetch resumes and job descriptions
  const { resumes, loading: resumesLoading } = useResumes(userId);
  const { 
    jobDescriptions, 
    loading: jobDescriptionsLoading, 
    uploadJobDescription,
    deleteJobDescription,
    viewJobDescription
  } = useJobDescriptions(userId);
  
  // Job match analysis
  const { 
    analyzeJobMatch, 
    loading: analysisLoading, 
    error: analysisError,
    networkStatus,
    results: matchResults,
    loadSavedResults,
    clearSavedResults
  } = useJobMatch();

  // UI state
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [selectedJdUrl, setSelectedJdUrl] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'linkedin' | 'cover'>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [hasSavedResults, setHasSavedResults] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Text input state
  const [jdInputMode, setJdInputMode] = useState<'upload' | 'text'>('upload');
  const [jdTextInput, setJdTextInput] = useState('');
  const [textInputCompany, setTextInputCompany] = useState('');
  const [textInputPosition, setTextInputPosition] = useState('');
  
  // Analysis process tracking
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    { name: 'Preparing documents', description: 'Converting and preparing your resume and job description' },
    { name: 'Analyzing match', description: 'Comparing your resume against the job requirements' },
    { name: 'Identifying skills', description: 'Finding matching and missing skills and keywords' },
    { name: 'Generating content', description: 'Creating personalized application materials' }
  ];

  // Select first resume by default
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeUrl) {
      const pdfResumes = resumes.filter(r => r.fileType === 'pdf');
      if (pdfResumes.length > 0) {
        setSelectedResumeUrl(pdfResumes[0].url);
      }
    }
  }, [resumes, selectedResumeUrl]);

  // Select first job description by default
  useEffect(() => {
    if (jobDescriptions.length > 0 && !selectedJdUrl && jdInputMode === 'upload') {
      setSelectedJdUrl(jobDescriptions[0].url);
    }
  }, [jobDescriptions, selectedJdUrl, jdInputMode]);

  // Check for saved results
  useEffect(() => {
    const hasResults = loadSavedResults(userId);
    setHasSavedResults(hasResults);
    if (hasResults) {
      setShowResults(true);
    }
  }, [userId, loadSavedResults]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setFormError('Only PDF files are allowed');
      return;
    }
    
    setJdFile(file);
    setFormError(null);
  };

  const handleUploadJd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jdFile) {
      setFormError('Please select a file to upload');
      return;
    }
    
    const result = await uploadJobDescription(
      jdFile, 
      companyName.trim() || undefined, 
      positionName.trim() || undefined
    );
    
    if (result.error) {
      setFormError(result.error);
    } else {
      // Reset form
      setJdFile(null);
      setCompanyName('');
      setPositionName('');
      setShowUploadForm(false);
      setFormError(null);
      
      // Select the newly uploaded JD
      if (result.url) {
        setSelectedJdUrl(result.url);
      }
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    // Reset error state
    setFormError(null);
    
    // Validate inputs
    if (!selectedResumeUrl) {
      setFormError('Please select a resume');
      return;
    }
    
    if (jdInputMode === 'upload' && !selectedJdUrl) {
      setFormError('Please select a job description');
      return;
    }
    
    if (jdInputMode === 'text' && !jdTextInput.trim()) {
      setFormError('Please enter a job description');
      return;
    }
    
    // Reset analysis steps
    setAnalysisStep(0);
    
    let jobDescriptionToAnalyze = '';
    let companyNameToUse = '';
    let positionNameToUse = '';
    
    if (jdInputMode === 'upload') {
      // Use selected PDF
      jobDescriptionToAnalyze = selectedJdUrl || '';
      // Find company and position from selected JD
      const selectedJd = jobDescriptions.find(jd => jd.url === selectedJdUrl);
      companyNameToUse = selectedJd?.company || 'the company';
      positionNameToUse = selectedJd?.position || 'the position';
    } else {
      // Use text input
      jobDescriptionToAnalyze = jdTextInput;
      companyNameToUse = textInputCompany || 'the company';
      positionNameToUse = textInputPosition || 'the position';
    }
    
    // Start analysis process with steps
    const analysisTimer = setInterval(() => {
      setAnalysisStep(prev => {
        // Don't go beyond the last step
        if (prev >= analysisSteps.length - 1) {
          clearInterval(analysisTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 5000); // Advance every 5 seconds
    
    const result = await analyzeJobMatch(
      selectedResumeUrl,
      jobDescriptionToAnalyze,
      userId,
      companyNameToUse,
      positionNameToUse
    );
    
    // Clear the timer when analysis is complete
    clearInterval(analysisTimer);
    
    if (result) {
      // Set to final step
      setAnalysisStep(analysisSteps.length - 1);
      setShowResults(true);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get display name for files
  const getDisplayName = (fullName: string): string => {
    // Remove timestamp prefix if present
    const withoutTimestamp = fullName.replace(/^\d+_/, '');
    
    // If it's a formatted name with company and position
    const parts = withoutTimestamp.split('_');
    if (parts.length >= 3) {
      const company = parts[0].replace(/-/g, ' ');
      const position = parts[1].replace(/-/g, ' ');
      return `${company} - ${position}`;
    }
    
    // Otherwise just return the filename
    return withoutTimestamp;
  };

  // Render match score with color coding
  const renderMatchScore = (score: number) => {
    let color;
    let label;
    
    if (score >= 85) {
      color = 'text-green-400';
      label = 'Excellent Match';
    } else if (score >= 70) {
      color = 'text-blue-400';
      label = 'Good Match';
    } else if (score >= 50) {
      color = 'text-yellow-400';
      label = 'Fair Match';
    } else {
      color = 'text-red-400';
      label = 'Poor Match';
    }
    
    return (
      <div className="flex flex-col items-center">
        <div className={`text-4xl font-bold ${color}`}>
          {score}%
        </div>
        <div className={color}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Show match results if available */}
      {(matchResults || hasSavedResults) && showResults && (
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
                Job Match Results
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearSavedResults(userId);
                  setShowResults(false);
                }}
              >
                Clear Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Match score and summary */}
            {matchResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center">
                  {renderMatchScore(matchResults.matchScore)}
                </div>
                
                <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg overflow-auto">
                  <h3 className="text-lg font-medium text-white mb-2">Analysis</h3>
                  <p className="text-gray-300 whitespace-pre-line">
                    {matchResults.matchScoreRationale ? (
                      <>
                        <strong>Score Calculation:</strong> {matchResults.matchScoreRationale}
                        <br /><br />
                      </>
                    ) : null}
                    {matchResults.analysis || ''}
                    {matchResults.strengthsAnalysis ? (
                      <>
                        <br /><br />
                        <strong>Strengths:</strong> {matchResults.strengthsAnalysis}
                      </>
                    ) : null}
                    {matchResults.gapsAnalysis ? (
                      <>
                        <br /><br />
                        <strong>Gaps:</strong> {matchResults.gapsAnalysis}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            )}
            
            {/* Company Information */}
            {matchResults && matchResults.companyInfo && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-400" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-gray-300 whitespace-pre-line">{matchResults.companyInfo}</p>
                  </div>
                  <div className="space-y-3">
                    {matchResults.companyRating && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Company Rating</p>
                        <div className="flex items-center">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-lg ${i < Math.round(matchResults.companyRating) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                            ))}
                          </div>
                          <span className="ml-2 text-white font-medium">{matchResults.companyRating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    {matchResults.salaryRange && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Estimated Salary Range</p>
                        <p className="text-white font-medium">{matchResults.salaryRange}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Skills and Keywords */}
            {matchResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-3">Skills</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-green-400 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {matchResults.skills.matched.length > 0 ? (
                          matchResults.skills.matched.map((skill, index) => (
                            <span key={index} className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No matching skills found</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-red-400 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {matchResults.skills.missing.length > 0 ? (
                          matchResults.skills.missing.map((skill, index) => (
                            <span key={index} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No missing skills identified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-3">Keywords</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-green-400 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Matched Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {matchResults.keywordMatches.matched.length > 0 ? (
                          matchResults.keywordMatches.matched.map((keyword, index) => (
                            <span key={index} className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No matching keywords found</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-red-400 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {matchResults.keywordMatches.missing.length > 0 ? (
                          matchResults.keywordMatches.missing.map((keyword, index) => (
                            <span key={index} className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-sm">
                              {keyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No missing keywords identified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {matchResults && matchResults.recommendations && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {matchResults.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#FF8A00] mr-2">•</span>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Application Content */}
            {matchResults && (
              <div>
                <div className="flex border-b border-gray-700 mb-4">
                  <button
                    className={`px-4 py-2 ${activeTab === 'email' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('email')}
                  >
                    Email Outreach
                  </button>
                  <button
                    className={`px-4 py-2 ${activeTab === 'linkedin' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('linkedin')}
                  >
                    LinkedIn Message
                  </button>
                  <button
                    className={`px-4 py-2 ${activeTab === 'cover' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('cover')}
                  >
                    Cover Letter
                  </button>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg relative">
                  {activeTab === 'email' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-white">Email Application Outreach</h3>
                        {matchResults.emailOutreach && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={copiedText === matchResults.emailOutreach ? Check : Copy}
                            onClick={() => copyToClipboard(matchResults.emailOutreach)}
                            className={`${copiedText === matchResults.emailOutreach ? 'text-green-400' : 'text-gray-400'}`}
                          >
                            {copiedText === matchResults.emailOutreach ? 'Copied!' : 'Copy'}
                          </Button>
                        )}
                      </div>
                      <Alert
                        variant="info"
                        message="This email is designed to be sent when applying for the job via email or as a follow-up to an application."
                      />
                      <TextArea
                        name="emailOutreach"
                        value={matchResults.emailOutreach}
                        onChange={() => {}}
                        label=""
                        rows={8}
                      />
                    </div>
                  )}
                  
                  {activeTab === 'linkedin' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-white">LinkedIn Connection Message</h3>
                        {matchResults.linkedinOutreach && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={copiedText === matchResults.linkedinOutreach ? Check : Copy}
                            onClick={() => copyToClipboard(matchResults.linkedinOutreach)}
                            className={`${copiedText === matchResults.linkedinOutreach ? 'text-green-400' : 'text-gray-400'}`}
                          >
                            {copiedText === matchResults.linkedinOutreach ? 'Copied!' : 'Copy'}
                          </Button>
                        )}
                      </div>
                      <Alert
                        variant="info"
                        message="Use this message when connecting with a hiring manager or recruiter on LinkedIn. It's short and designed to fit within LinkedIn's character limits."
                      />
                      <TextArea
                        name="linkedinOutreach"
                        value={matchResults.linkedinOutreach}
                        onChange={() => {}}
                        label=""
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {activeTab === 'cover' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-white">Cover Letter</h3>
                        {matchResults.coverLetter && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={copiedText === matchResults.coverLetter ? Check : Copy}
                            onClick={() => copyToClipboard(matchResults.coverLetter)}
                            className={`${copiedText === matchResults.coverLetter ? 'text-green-400' : 'text-gray-400'}`}
                          >
                            {copiedText === matchResults.coverLetter ? 'Copied!' : 'Copy'}
                          </Button>
                        )}
                      </div>
                      <Alert
                        variant="info" 
                        message="This cover letter highlights your relevant experience and skills for the position. Edit it to personalize before submitting with your application."
                      />
                      <TextArea
                        name="coverLetter"
                        value={matchResults.coverLetter}
                        onChange={() => {}}
                        label=""
                        rows={12}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Description Upload and Selection */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab navigation for Job Description input options */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-2 ${jdInputMode === 'upload' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setJdInputMode('upload')}
            >
              Upload PDF
            </button>
            <button
              className={`px-4 py-2 ${jdInputMode === 'text' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
              onClick={() => setJdInputMode('text')}
            >
              Paste Text
            </button>
          </div>
          
          {/* Text Input Mode */}
          {jdInputMode === 'text' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="textInputCompany"
                  value={textInputCompany}
                  onChange={(e) => setTextInputCompany(e.target.value)}
                  label="Company Name"
                  placeholder="E.g., Google"
                  icon={Building}
                  optional
                />
                
                <FormInput
                  name="textInputPosition"
                  value={textInputPosition}
                  onChange={(e) => setTextInputPosition(e.target.value)}
                  label="Position Title"
                  placeholder="E.g., Software Engineer"
                  icon={User}
                  optional
                />
              </div>
              
              <TextArea
                name="jdTextInput"
                value={jdTextInput}
                onChange={(e) => setJdTextInput(e.target.value)}
                label="Job Description"
                placeholder="Paste the full job description here..."
                icon={FileText}
                rows={12}
              />
              
              <Alert
                variant="info"
                message="Paste the complete job description text here, including all requirements, responsibilities, and qualifications."
              />
            </div>
          )}
          
          {/* Upload Mode */}
          {jdInputMode === 'upload' && (
            jobDescriptionsLoading ? (
              <ContentLoading 
                message="Loading your job descriptions..." 
                icon={<Briefcase className="h-8 w-8 text-[#FF8A00] animate-pulse" />} 
              />
            ) : (
              <>
                {jobDescriptions.length === 0 && !showUploadForm ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No job descriptions found</h3>
                    <p className="text-gray-400 mb-4">Upload a job description PDF to analyze it against your resume</p>
                    <Button
                      onClick={() => setShowUploadForm(true)}
                      leftIcon={Upload}
                    >
                      Upload Job Description
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Job description file selection */}
                    {jobDescriptions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-medium">Select a Job Description</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={Upload}
                            onClick={() => setShowUploadForm(!showUploadForm)}
                          >
                            {showUploadForm ? 'Cancel Upload' : 'Upload New'}
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {jobDescriptions.map((jd, index) => (
                            <div 
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                selectedJdUrl === jd.url
                                  ? 'bg-[#FF8A00]/10 border-[#FF8A00]'
                                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                              } cursor-pointer transition-colors`}
                              onClick={() => setSelectedJdUrl(jd.url)}
                            >
                              <div className="flex items-center">
                                <FileText className={`h-5 w-5 mr-3 ${selectedJdUrl === jd.url ? 'text-[#FF8A00]' : 'text-gray-400'}`} />
                                <div>
                                  <p className={`font-medium ${selectedJdUrl === jd.url ? 'text-white' : 'text-gray-300'}`}>
                                    {getDisplayName(jd.name)}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {jd.uploadedAt}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedJdUrl === jd.url && (
                                <div className="w-4 h-4 rounded-full bg-[#FF8A00]"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Upload form */}
                    {showUploadForm && (
                      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 animate-fadeIn">
                        <h3 className="text-white font-medium mb-3">Upload Job Description</h3>
                        
                        <form onSubmit={handleUploadJd} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                              name="companyName"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              label="Company Name"
                              placeholder="E.g., Google"
                              icon={Building}
                              optional
                            />
                            
                            <FormInput
                              name="positionName"
                              value={positionName}
                              onChange={(e) => setPositionName(e.target.value)}
                              label="Position"
                              placeholder="E.g., Software Engineer"
                              icon={User}
                              optional
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                              Job Description PDF
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg hover:border-gray-500 transition-colors">
                              <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-400">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-medium text-[#FF8A00] hover:text-[#FF8A00]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#FF8A00]"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      onChange={handleFileChange}
                                      accept=".pdf"
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-400">
                                  PDF up to 10MB
                                </p>
                                {jdFile && (
                                  <p className="text-sm text-[#FF8A00]">
                                    Selected: {jdFile.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {formError && (
                            <Alert
                              variant="error"
                              message={formError}
                            />
                          )}
                          
                          <div className="flex justify-end space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowUploadForm(false);
                                setJdFile(null);
                                setFormError(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={!jdFile}
                              loading={jobDescriptionsLoading}
                            >
                              Upload
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          )}
          
          {/* Analysis button */}
          {((jdInputMode === 'upload' && selectedJdUrl) || (jdInputMode === 'text' && jdTextInput.trim())) && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleAnalyze}
                disabled={analysisLoading}
                loading={analysisLoading}
                leftIcon={PenTool}
              >
                Analyze Job Match
              </Button>
            </div>
          )}
          
          {/* Analysis progress */}
          {analysisLoading && (
            <div className="mt-6">
              <ProcessingIndicator 
                steps={analysisSteps}
                currentStep={analysisStep}
                error={analysisError || undefined}
                onRetry={analysisError ? handleAnalyze : undefined}
              />
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
}