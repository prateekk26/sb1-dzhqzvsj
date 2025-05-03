import React, { useState, useEffect } from 'react';
import { FileText, Upload, AlertCircle, Sparkles, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Alert } from './Alert';
import { useResumes } from '../hooks/useResumes';
import { useResumeAnalysis } from '../hooks/useResumeAnalysis';
import { useExperiences } from '../hooks/useExperiences';
import { ContentLoading } from './LoadingState';
import { ProjectImpactStatements } from './ProjectImpactStatements';
import { CollapsibleResumeAnalysis } from './CollapsibleResumeAnalysis';
import { JobMatchSection } from './JobMatchSection';
import { ProcessingIndicator } from './LoadingIndicator';

interface ResumeReviewSectionProps {
  userId: string;
  debugMode?: boolean;
  onApiResponse?: (response: any) => void;
}

export function ResumeReviewSection({ userId, debugMode = false, onApiResponse }: ResumeReviewSectionProps) {
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(null);
  const [isPngAvailable, setIsPngAvailable] = useState<boolean>(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [experienceYears, setExperienceYears] = useState<number | null>(null);
  const [manualExperienceYears, setManualExperienceYears] = useState<string>('');
  const [useManualExperience, setUseManualExperience] = useState<boolean>(false);
  const [showExperienceOptions, setShowExperienceOptions] = useState<boolean>(false);
  const [preparingResume, setPreparingResume] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'job'>('resume');
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    { name: 'Preparing resume', description: 'Converting and optimizing your resume for analysis' },
    { name: 'Analyzing content', description: 'Evaluating structure, formatting, and content' },
    { name: 'Identifying strengths', description: 'Finding effective elements in your resume' },
    { name: 'Generating suggestions', description: 'Creating personalized improvement recommendations' }
  ];
  
  const { 
    resumes, 
    loading: resumesLoading, 
    error: resumesError,
    getPngVersionUrl,
    convertPdfToPng,
    conversionPending,
    conversionError
  } = useResumes(userId);

  const {
    analyzeResume,
    loading: analysisLoading,
    error: analysisError,
    results: analysisResults,
    rawResponse,
    loadSavedResults,
    hasSavedResults,
    clearSavedResults
  } = useResumeAnalysis(userId);

  const {
    experiences,
    loading: experiencesLoading
  } = useExperiences(userId);

  // Load saved results when component mounts
  useEffect(() => {
    loadSavedResults();
  }, [loadSavedResults]);

  // Calculate total years of experience from work history when experiences load
  useEffect(() => {
    if (experiences && experiences.length > 0 && !experiencesLoading) {
      let totalMonths = 0;
      const now = new Date();
      
      experiences.forEach(exp => {
        const startDate = new Date(exp.start_date);
        const endDate = exp.end_date ? new Date(exp.end_date) : now;
        
        // Calculate months
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (endDate.getMonth() - startDate.getMonth());
        
        if (months > 0) {
          totalMonths += months;
        }
      });
      
      // Convert to years (rounded to nearest 0.5)
      const years = Math.round(totalMonths / 6) / 2;
      setExperienceYears(years);
      
      // Set manual input to match calculated value for user edits
      setManualExperienceYears(years.toString());
    }
  }, [experiences, experiencesLoading]);

  // When resumes are loaded, select the first one by default
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeUrl) {
      // Filter for visible resumes (PDFs)
      const visibleResumes = resumes.filter(r => r.fileType === 'pdf' || r.name.toLowerCase().endsWith('.pdf'));
      
      if (visibleResumes.length > 0) {
        setSelectedResumeUrl(visibleResumes[0].url);
        setSelectedResumeName(visibleResumes[0].name);
        
        // Check if an optimized version exists in the background
        checkForPngVersion(visibleResumes[0].url);
      }
    }
  }, [resumes]);

  // Check for an existing optimized version without showing details to user
  const checkForPngVersion = async (pdfUrl: string) => {
    if (!pdfUrl) return;
    
    try {
      const pngVersionUrl = await getPngVersionUrl(pdfUrl);
      if (pngVersionUrl) {
        console.log('Optimized version found:', pngVersionUrl);
        setIsPngAvailable(true);
        setPngUrl(pngVersionUrl);
      } else {
        console.log('No optimized version found');
        setIsPngAvailable(false);
        setPngUrl(null);
        
        // Automatically start preparation if no optimized version exists
        prepareResumeForAnalysis(pdfUrl);
      }
    } catch (error) {
      console.error("Error checking for optimized version:", error);
    }
  };

  // Automatically prepare resume for analysis
  const prepareResumeForAnalysis = async (pdfUrl: string) => {
    if (!pdfUrl) return;
    
    setPreparingResume(true);
    
    try {
      const result = await convertPdfToPng(pdfUrl);
      if (result.success && result.pngUrl) {
        setIsPngAvailable(true);
        setPngUrl(result.pngUrl);
        setPreparingResume(false);
      } else {
        console.error('Failed to prepare resume:', result.error);
        setPreparingResume(false);
      }
    } catch (error) {
      console.error('Error preparing resume:', error);
      setPreparingResume(false);
    }
  };

  // Handle manual years of experience input
  const handleManualExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only accept numbers and decimal point
    if (/^(\d*\.?\d*)$/.test(value) || value === '') {
      setManualExperienceYears(value);
    }
  };

  // Analyze the resume
  const handleAnalyzeResume = async () => {
    // Use optimized URL if available, otherwise use the selected PDF URL
    const urlToAnalyze = isPngAvailable && pngUrl ? pngUrl : selectedResumeUrl;
    
    if (!urlToAnalyze) {
      console.error('No resume URL to analyze');
      return;
    }
    
    // Determine which experience value to use
    const yearsToUse = useManualExperience && manualExperienceYears !== '' 
      ? parseFloat(manualExperienceYears)
      : experienceYears;
    
    // Reset analysis steps
    setAnalysisStep(0);
    
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
    }, 4000); // Advance every 4 seconds
    
    // For backward compatibility, pass an empty array for projectIds
    const result = await analyzeResume(urlToAnalyze, userId, [], yearsToUse || undefined);
    
    // Clear the timer when analysis is complete
    clearInterval(analysisTimer);
    
    // Set to final step
    if (result) {
      setAnalysisStep(analysisSteps.length - 1);
    }
    
    // If in debug mode and we have a callback, send the API response
    if (debugMode && onApiResponse && result) {
      onApiResponse({
        timestamp: new Date().toISOString(),
        duration: 0,
        endpoint: 'analyze-resume',
        status: result ? 200 : 500,
        method: 'POST',
        request: { 
          resumeUrl: urlToAnalyze, 
          userId, 
          isPngFormat: isPngAvailable,
          experienceYears: yearsToUse
        },
        response: result || rawResponse || { error: analysisError }
      });
    }
  };

  // Format experience level for display
  const formatExperienceLevel = (years: number | null | undefined) => {
    if (years === null || years === undefined) return "Unknown";
    
    if (years <= 2) return "0-2 years (Early Career)";
    if (years <= 6) return "3-6 years (Mid-Career)";
    return "7+ years (Experienced)";
  };

  // Get the original file name by extracting it from the URL or name
  const getDisplayFileName = (resume: any) => {
    // If it's a full URL with query parameters, extract just the filename
    if (resume.name.includes('/')) {
      // Extract filename from URL path
      const pathParts = resume.name.split('/');
      const filenameWithParams = pathParts[pathParts.length - 1];
      
      // Remove any query parameters
      if (filenameWithParams.includes('?')) {
        return filenameWithParams.split('?')[0];
      }
      return filenameWithParams;
    }
    
    // Extract timestamp prefix if present (like 1234567890_filename.pdf)
    if (resume.name.match(/^\d+_/)) {
      return resume.name.replace(/^\d+_/, '');
    }
    
    // Just return the name if it's already clean
    return resume.name;
  };

  return (
    <div className="space-y-8">
      {/* Tabs for Resume Review vs Job Match */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-6 py-3 text-lg font-medium ${activeTab === 'resume' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('resume')}
        >
          Resume Analysis
        </button>
        <button
          className={`px-6 py-3 text-lg font-medium ${activeTab === 'job' ? 'text-[#FF8A00] border-b-2 border-[#FF8A00]' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setActiveTab('job')}
        >
          Job Match
        </button>
      </div>

      {activeTab === 'resume' ? (
        <>
          {/* Show analysis results first if available */}
          {(analysisResults || hasSavedResults) && (
            <CollapsibleResumeAnalysis 
              results={analysisResults || {
                score: 7.0,
                summary: "Your resume has been analyzed. Check the dashboard for full results and suggestions.",
                suggestions: [
                  "Add more quantifiable achievements (numbers, percentages, etc.)",
                  "Use stronger action verbs at the beginning of bullet points",
                  "Ensure consistent formatting throughout the document"
                ],
                breakdown: {} as any,
                projectOneLiners: []
              }}
              userId={userId}
              onRefresh={handleAnalyzeResume}
              isRefreshing={analysisLoading}
              onClear={clearSavedResults}
            />
          )}
          
          {/* Impact Statements Section */}
          <Card className="border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
                Impact Statements for Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectImpactStatements userId={userId} showCard={false} />
            </CardContent>
          </Card>

          {/* Resume Selection Section */}
          <Card className="border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#FF8A00]" />
                Select Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumesLoading ? (
                <ContentLoading 
                  message="Loading your resumes..." 
                  icon={<FileText className="h-8 w-8 text-[#FF8A00] animate-pulse" />} 
                />
              ) : resumesError ? (
                <Alert 
                  variant="error" 
                  message={resumesError} 
                  className="mb-4" 
                />
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No resumes found</h3>
                  <p className="text-gray-400 mb-4">Upload your resume on the Profile page to get started</p>
                  <Button
                    onClick={() => window.location.href = '/complete-profile'}
                    leftIcon={Upload}
                  >
                    Go to Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Only show PDF files to users */}
                    {resumes
                      .filter(r => r.fileType === 'pdf' || r.name.toLowerCase().endsWith('.pdf'))
                      .map((resume, index) => {
                        // Display the original filename
                        const displayName = getDisplayFileName(resume);
                        
                        return (
                          <div 
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              selectedResumeUrl === resume.url
                                ? 'bg-[#FF8A00]/10 border-[#FF8A00]'
                                : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                            } cursor-pointer transition-colors`}
                            onClick={() => {
                              setSelectedResumeUrl(resume.url);
                              setSelectedResumeName(resume.name);
                              
                              // Check for optimized version in the background
                              checkForPngVersion(resume.url);
                            }}
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
                  
                  {/* Show simple preparation status without exposing technical details */}
                  {selectedResumeUrl && (conversionPending || preparingResume) && (
                    <div className="mt-4 bg-blue-900/20 border border-blue-700/30 text-blue-300 px-4 py-3 rounded-lg flex items-center">
                      <LoadingSpinner className="mr-3" />
                      Preparing resume for analysis...
                    </div>
                  )}
                  
                  {/* If there was an error preparing the resume */}
                  {selectedResumeUrl && conversionError && !isPngAvailable && (
                    <Alert
                      variant="warning"
                      message="We had trouble optimizing your resume for analysis. The analysis may take longer than usual."
                      className="mt-4"
                    />
                  )}
                  
                  {/* Show success status when ready - Fixed to avoid duplicate checkmark icons */}
                  {selectedResumeUrl && isPngAvailable && (
                    <Alert 
                      variant="success" 
                      message="Resume ready for analysis"
                      className="mt-4"
                    />
                  )}
                  
                  {/* Experience Level Collapsible Section */}
                  <div className="mt-6 border border-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                      onClick={() => setShowExperienceOptions(!showExperienceOptions)}
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-[#FF8A00]" />
                        <div>
                          <span className="text-white font-medium">Experience Level: </span>
                          <span className="text-gray-300">
                            {experiencesLoading ? "Calculating..." : 
                              (useManualExperience ? 
                                formatExperienceLevel(parseFloat(manualExperienceYears)) : 
                                formatExperienceLevel(experienceYears))}
                          </span>
                        </div>
                      </div>
                      {showExperienceOptions ? 
                        <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                        <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                    
                    {showExperienceOptions && (
                      <div className="p-4 border-t border-gray-700 bg-gray-800/50 animate-fadeIn">
                        <p className="text-sm text-gray-300 mb-4">
                          Your experience level determines which scoring criteria are most important for your resume.
                          {experienceYears !== null && !experiencesLoading && (
                            <span className="ml-1">We've calculated <strong>{experienceYears} years</strong> from your work history.</span>
                          )}
                        </p>
                        
                        {experiencesLoading ? (
                          <div className="flex items-center bg-gray-700/50 p-3 rounded-lg">
                            <LoadingSpinner className="mr-3" />
                            <span className="text-gray-300">Calculating your experience...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className={`flex-1 p-3 rounded-lg border ${!useManualExperience ? 'bg-[#FF8A00]/10 border-[#FF8A00]' : 'bg-gray-700/50 border-gray-700'}`}>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="auto-experience"
                                  checked={!useManualExperience}
                                  onChange={() => setUseManualExperience(false)}
                                  className="h-4 w-4 text-[#FF8A00] focus:ring-[#FF8A00] rounded-full"
                                />
                                <label htmlFor="auto-experience" className="ml-2 flex flex-col">
                                  <span className="text-white font-medium">Use calculated experience</span>
                                  <span className="text-gray-400 text-sm">Based on your work history</span>
                                </label>
                              </div>
                              {experienceYears !== null && (
                                <div className="ml-6 mt-2 bg-gray-700/50 px-3 py-2 rounded text-white">
                                  <span className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-[#FF8A00]" />
                                    {formatExperienceLevel(experienceYears)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className={`flex-1 p-3 rounded-lg border ${useManualExperience ? 'bg-[#FF8A00]/10 border-[#FF8A00]' : 'bg-gray-700/50 border-gray-700'}`}>
                              <div className="flex items-start">
                                <input
                                  type="radio"
                                  id="manual-experience"
                                  checked={useManualExperience}
                                  onChange={() => setUseManualExperience(true)}
                                  className="h-4 w-4 mt-1 text-[#FF8A00] focus:ring-[#FF8A00] rounded-full"
                                />
                                <label htmlFor="manual-experience" className="ml-2 flex flex-col">
                                  <span className="text-white font-medium">Set experience manually</span>
                                  <span className="text-gray-400 text-sm">Override the calculated value</span>
                                </label>
                              </div>
                              <div className="ml-6 mt-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={manualExperienceYears}
                                    onChange={handleManualExperienceChange}
                                    placeholder="Enter years"
                                    disabled={!useManualExperience}
                                    className={`w-24 px-3 py-2 bg-gray-700 border ${useManualExperience ? 'border-gray-500' : 'border-gray-700'} rounded text-white focus:outline-none focus:ring-1 focus:ring-[#FF8A00]`}
                                  />
                                  <span className="ml-2 text-gray-300">years</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Button Section - Only show if no results yet or if results are visible but can be refreshed */}
          {(!analysisResults && !hasSavedResults) && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleAnalyzeResume}
                isLoading={analysisLoading}
                disabled={!selectedResumeUrl || analysisLoading || conversionPending || preparingResume}
                leftIcon={Sparkles}
                className="px-8"
              >
                {analysisLoading ? 'Analyzing Resume...' : 'Analyze Resume'}
              </Button>
            </div>
          )}

          {/* Analysis Error Alert */}
          {analysisError && (
            <Alert
              variant="error"
              title="Analysis Error"
              message={analysisError}
              className="mb-4"
            />
          )}
          
          {/* Analysis loading state */}
          {analysisLoading && (
            <div className="mt-6 animate-fadeIn">
              <ProcessingIndicator 
                title="Analyzing Resume"
                steps={analysisSteps}
                currentStep={analysisStep}
                className="border border-[#FF8A00]/20"
                error={analysisError || undefined}
                onRetry={analysisError ? handleAnalyzeResume : undefined}
              />
            </div>
          )}
        </>
      ) : (
        <JobMatchSection userId={userId} />
      )}
    </div>
  );
}