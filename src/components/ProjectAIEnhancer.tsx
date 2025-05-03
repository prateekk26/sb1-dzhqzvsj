import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCcw, Lightbulb, X, Tag, Plus, FileText, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { FormInput } from './FormInput';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';
import { useCompetencies, Competency } from '../hooks/useCompetencies';
import { supabase } from '../lib/supabase';
import { enhanceProjectClientSide } from '../services/aiService';
import { Project } from '../hooks/useProjects';
import { AIProcessingIndicator } from './LoadingIndicator';

// Define types for additional questions and answers
interface AdditionalQuestions {
  questions: string[];
  answers: Record<string, string>;
}

// Define types for additional questions and answers
interface AdditionalQuestions {
  questions: string[];
  answers: Record<string, string>;
}

interface ProjectAIEnhancerProps {
  project: Project;
  onUpdate: (projectId: string, updates: { 
    title?: string;
    enhanced_description?: string; 
    competencies?: string[]; 
    suggestions?: string[];
    competency_rationales?: Record<string, string>;
  }) => Promise<void>;
  onClose?: () => void;
}

export function ProjectAIEnhancer({ project, onUpdate, onClose }: ProjectAIEnhancerProps) {
  const [title, setTitle] = useState<string>(project.title || '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [enhancedText, setEnhancedText] = useState<string>(project.enhanced_description || '');
  const [detectedCompetencies, setDetectedCompetencies] = useState<string[]>(project.competencies || []);
  const [competencyRationales, setCompetencyRationales] = useState<Record<string, string>>(project.competency_rationales || {});
  const [suggestions, setSuggestions] = useState<string[]>(project.suggestions || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCompetencies, setAvailableCompetencies] = useState<Competency[]>([]);
  const [showCompetencyPicker, setShowCompetencyPicker] = useState<boolean>(false);
  const [competencyFilter, setCompetencyFilter] = useState<string>('');
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  
  // For additional questions feature
  const [additionalQuestions, setAdditionalQuestions] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [showQuestionsUI, setShowQuestionsUI] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  
  const { competencies, loading: competenciesLoading } = useCompetencies();

  // Setup available competencies for selection
  useEffect(() => {
    if (competencies.length > 0) {
      setAvailableCompetencies(competencies);
    }
  }, [competencies]);

  // Filter competencies based on search term
  const filteredCompetencies = availableCompetencies.filter(comp => 
    !detectedCompetencies.includes(comp.code) && 
    (competencyFilter === '' || 
      comp.name.toLowerCase().includes(competencyFilter.toLowerCase()) ||
      comp.code.toLowerCase().includes(competencyFilter.toLowerCase()) ||
      comp.definition.toLowerCase().includes(competencyFilter.toLowerCase())
    )
  );

  const enhanceWithAI = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    setUsingFallback(false);
    setAdditionalQuestions([]);
    setQuestionAnswers({});
    setShowQuestionsUI(false);
    console.log('Starting AI enhancement for project:', project.id);
    
    try {
      // Try to use the Edge Function first
      try {
        console.log('Calling Supabase Edge Function enhance-project...');
        
        // Call with a timeout to help debugging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Prepare the request body
        const requestBody: any = { 
          rawText: project.raw_input, 
          projectId: project.id 
        };
        
        // If we have answers to additional questions, include them
        if (Object.keys(questionAnswers).length > 0) {
          requestBody.additionalInfo = questionAnswers;
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('enhance-project', {
            body: requestBody,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Edge function returned error:', error);
            throw new Error(error.message || 'Failed to enhance project with Edge Function');
          }
          
          if (!data) {
            console.error('No data returned from Edge Function');
            throw new Error('No data returned from the API');
          }
          
          // Check if we received additional questions
          if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            setAdditionalQuestions(data.questions);
            setShowQuestionsUI(true);
            setLoading(false);
            return;
          }
          
          // Store the raw response for debugging
          setEnhancedText(data.enhancedText || '');
          
          // Limit to 3-5 most relevant competencies with rationales
          const competenciesWithRationales = data.competencies
            .filter((code: string) => data.competencyRationales && data.competencyRationales[code])
            .slice(0, 5);
          
          setDetectedCompetencies(competenciesWithRationales);
          setSuggestions(data.suggestions || []);
          
          // Store competency rationales if available
          if (data.competencyRationales) {
            setCompetencyRationales(data.competencyRationales);
          }
        } catch (abortError) {
          if (abortError.name === 'AbortError') {
            throw new Error('Request timeout: The API took too long to respond');
          }
          throw abortError;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to client-side processing:', edgeFunctionError);
        setUsingFallback(true);
        setError(`Edge Function error: ${edgeFunctionError.message}. Using client-side fallback.`);
        
        // Fall back to client-side processing
        const result = await enhanceProjectClientSide(project.raw_input, competencies);
        setEnhancedText(result.enhancedText || '');
        
        // Limit to 3-5 most relevant competencies with rationales
        const competenciesWithRationales = result.competencies
          .filter(code => result.competencyRationales && result.competencyRationales[code])
          .slice(0, 5);
        
        setDetectedCompetencies(competenciesWithRationales);
        setSuggestions(result.suggestions || []);
        
        // Store competency rationales if available
        if (result.competencyRationales) {
          setCompetencyRationales(result.competencyRationales);
        }
      }
    } catch (err) {
      console.error('Error enhancing project:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while enhancing your project');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    console.log('Saving project enhancements for project:', project.id);
    
    if (title.length > 80) {
      setTitleError('Title must be 80 characters or less');
      return;
    }
    
    try {
      const updates = {
        title: title.trim() || undefined,
        enhanced_description: enhancedText,
        competencies: detectedCompetencies,
        suggestions: suggestions,
        competency_rationales: competencyRationales
      };
      
      console.log('Saving project updates:', { projectId: project.id, ...updates });
      
      await onUpdate(project.id, updates);
      console.log('Project updates saved successfully');
      
      setSaved(true);
      
      // Close the modal after successful save
      setTimeout(() => {
        if (onClose) {
          console.log('Closing AI enhancer modal after successful save');
          onClose();
        }
      }, 1500);
    } catch (err) {
      console.error('Error saving project enhancements:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    }
  };

  const addCompetency = (code: string) => {
    if (!detectedCompetencies.includes(code)) {
      setDetectedCompetencies([...detectedCompetencies, code]);
      
      // Add a default rationale if none exists
      if (!competencyRationales[code]) {
        const comp = getCompetencyByCode(code);
        setCompetencyRationales({
          ...competencyRationales,
          [code]: `Manually added ${comp?.name || code} competency.`
        });
      }
    }
    setShowCompetencyPicker(false);
    setCompetencyFilter('');
  };

  const removeCompetency = (code: string) => {
    setDetectedCompetencies(detectedCompetencies.filter(c => c !== code));
    
    // Also remove the rationale
    const updatedRationales = { ...competencyRationales };
    delete updatedRationales[code];
    setCompetencyRationales(updatedRationales);
  };

  const getCompetencyByCode = (code: string): Competency | undefined => {
    return competencies.find(c => c.code === code);
  };
  
  // Handle question answer changes
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setQuestionAnswers({
      ...questionAnswers,
      [`question_${questionIndex}`]: answer
    });
  };
  
  // Handle user's choice about answering questions
  const handleQuestionChoice = async (answerQuestions: boolean) => {
    setShowConfirmDialog(false);
    
    if (answerQuestions) {
      // Show the questions UI if user wants to answer questions
      setShowQuestionsUI(true);
    } else {
      // Skip questions and proceed with enhancement using what we have
      setQuestionAnswers({});
      await enhanceWithAI();
    }
  };
  
  // Submit additional answers and regenerate enhancement
  const submitAdditionalAnswers = async (skipAnswers: boolean = false) => {
    setShowQuestionsUI(false);
    
    // If skipping answers, clear any partial answers
    if (skipAnswers) {
      setQuestionAnswers({});
    }
    
    
    // If skipping answers, clear any partial answers
    if (skipAnswers) {
      setQuestionAnswers({});
    }
    
    await enhanceWithAI();
  };

  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#FF8A00]/10 to-transparent">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
            AI Project Enhancement
            {usingFallback && (
              <span className="ml-2 text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">
                Client-side mode
              </span>
            )}
          </CardTitle>
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 flex items-center justify-center rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        {/* Project title */}
        <div>
          <FormInput
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.length > 80) {
                setTitleError('Title must be 80 characters or less');
              } else {
                setTitleError(null);
              }
            }}
            label="Project Title"
            placeholder="Untitled Project"
            icon={FileText}
            error={titleError || undefined}
          />
          {title.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {title.length}/80 characters
            </p>
          )}
        </div>
        
        {/* Original input */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Original Project Description:</h3>
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-gray-300 text-sm whitespace-pre-line max-h-48 overflow-y-auto">
            {project.raw_input}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <Alert
            variant="error"
            message={error}
            onClose={() => setError(null)}
            className="animate-fadeIn"
          />
        )}
        
        {/* Success message */}
        {saved && (
          <Alert
            variant="success"
            message="Project enhancements saved successfully!"
            onClose={() => setSaved(false)}
            className="animate-fadeIn"
          />
        )}
        
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
                Enhance Your Project
              </h3>
              <p className="text-gray-300 mb-6">
                Would you like to answer a few clarifying questions to help create a more accurate enhancement?
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => handleQuestionChoice(false)}
                >
                  No, Enhance Directly
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleQuestionChoice(true)}
                >
                  Yes, I'll Answer Questions
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <AIProcessingIndicator
            message="Enhancing your project description"
            subMessage="Our AI is analyzing your project and creating a professional STAR format description with relevant competencies."
            progress={50}
            error={error || undefined}
            onRetry={error ? enhanceWithAI : undefined}
          />
        ) : showQuestionsUI ? (
          /* Additional Questions UI */
          <div className="space-y-5 animate-fadeIn">
            <Alert
              variant="info"
              message="To provide a better enhancement, please answer these additional questions about your project:"
              className="mb-4"
            />
            
            {additionalQuestions.map((question, index) => (
              <div key={index} className="space-y-2">
                <h4 className="text-white font-medium">{question}</h4>
                <TextArea
                  name={`question_${index}`}
                  value={questionAnswers[`question_${index}`] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  label=""
                  placeholder="Your answer..."
                  rows={3}
                />
              </div>
            ))}
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  // Show confirmation dialog before skipping
                  if (window.confirm("Skipping these questions may result in a less accurate enhancement. Continue anyway?")) {
                    submitAdditionalAnswers(true);
                  }
                }}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                onClick={submitAdditionalAnswers}
                leftIcon={Sparkles}
              >
                Continue Enhancement
              </Button>
            </div>
          </div>
        ) : (
          /* Enhanced content UI */
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Enhanced Description:</h3>
              </div>
              <TextArea
                name="enhanced_description"
                value={enhancedText}
                onChange={(e) => setEnhancedText(e.target.value)}
                label=""
                placeholder="Enhanced project description will appear here..."
                rows={6}
              />
            </div>
            
            {/* Competencies section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Detected Competencies:</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompetencyPicker(true)}
                  className="text-[#FF8A00] hover:text-[#FF8A00] hover:bg-[#FF8A00]/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competency
                </Button>
              </div>
              
              {detectedCompetencies.length > 0 ? (
                <div className="space-y-2">
                  {detectedCompetencies.map((code) => {
                    const comp = getCompetencyByCode(code);
                    return (
                      <div
                        key={code}
                        className="flex items-start gap-2 p-2 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <Tag className="h-4 w-4 mt-1 text-[#FF8A00]" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white">
                              {comp?.name || code}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCompetency(code)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {competencyRationales[code] || 'No rationale provided'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-gray-700 rounded-lg">
                  <Lightbulb className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    No competencies detected yet. Click "Enhance" to analyze your project.
                  </p>
                </div>
              )}
              
              {/* Competency picker modal */}
              {showCompetencyPicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white">Add Competency</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCompetencyPicker(false);
                            setCompetencyFilter('');
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormInput
                        name="competency_search"
                        value={competencyFilter}
                        onChange={(e) => setCompetencyFilter(e.target.value)}
                        placeholder="Search competencies..."
                        className="mt-2"
                      />
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                      {filteredCompetencies.length > 0 ? (
                        <div className="space-y-2">
                          {filteredCompetencies.map((comp) => (
                            <button
                              key={comp.code}
                              onClick={() => addCompetency(comp.code)}
                              className="w-full text-left p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <h4 className="text-sm font-medium text-white">{comp.name}</h4>
                              <p className="text-xs text-gray-400 mt-1">{comp.definition}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-sm text-gray-500">
                            No matching competencies found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Suggestions section */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Improvement Suggestions:</h3>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-2 bg-gray-800 rounded-lg"
                    >
                      <HelpCircle className="h-4 w-4 mt-1 text-blue-400" />
                      <p className="text-sm text-gray-300">{suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 p-4 bg-gray-900/50">
        {onClose && (
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          leftIcon={RefreshCcw}
          onClick={enhanceWithAI}
          disabled={loading || showQuestionsUI}
          className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
        >
          Regenerate
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || showQuestionsUI}
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}