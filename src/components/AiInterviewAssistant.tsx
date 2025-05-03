import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, RefreshCw, Copy, Check, Lightbulb, Briefcase, Target, Tag, Clock, Plus, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { FormInput } from './FormInput';
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';
import { supabase } from '../lib/supabase';
import { useExperiences } from '../hooks/useExperiences';
import { useProjects } from '../hooks/useProjects';

interface AiInterviewAssistantProps {
  userId: string;
  className?: string;
}

type QuestionType = 'behavioral' | 'technical' | 'leadership' | 'situational' | 'general';

interface GenerateResponseRequest {
  question: string;
  questionType: QuestionType;
  targetRole?: string;
  targetIndustry?: string;
  emphasizedSkills?: string[];
  userId: string;
  experienceIds?: string[];
  projectIds?: string[];
}

export function AiInterviewAssistant({ userId, className = '' }: AiInterviewAssistantProps) {
  const [question, setQuestion] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('behavioral');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [emphasizedSkills, setEmphasizedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  // Fetch user's experiences and projects
  const { experiences, loading: experiencesLoading } = useExperiences(userId);
  const { projects, loading: projectsLoading } = useProjects(userId, null);
  
  // Common skills for different question types
  const skillOptions: Record<QuestionType, string[]> = {
    behavioral: ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability', 'Leadership', 'Time Management', 'Conflict Resolution'],
    technical: ['Programming', 'System Design', 'Data Structures', 'Algorithms', 'Database Design', 'API Development', 'Testing'],
    leadership: ['Team Management', 'Delegation', 'Strategic Thinking', 'Mentoring', 'Decision Making', 'Vision Setting', 'Change Management'],
    situational: ['Crisis Management', 'Prioritization', 'Negotiation', 'Client Interaction', 'Stakeholder Management', 'Resource Allocation'],
    general: ['Career Goals', 'Strengths', 'Weaknesses', 'Work Style', 'Company Knowledge', 'Industry Knowledge', 'Motivation']
  };

  // Add a custom skill to the list
  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !emphasizedSkills.includes(customSkill.trim())) {
      setEmphasizedSkills([...emphasizedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  // Remove a skill from the list
  const handleRemoveSkill = (skill: string) => {
    setEmphasizedSkills(emphasizedSkills.filter(s => s !== skill));
  };

  // Toggle experience selection
  const toggleExperience = (id: string) => {
    setSelectedExperiences(prev => 
      prev.includes(id) ? prev.filter(expId => expId !== id) : [...prev, id]
    );
  };

  // Toggle project selection
  const toggleProject = (id: string) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(projId => projId !== id) : [...prev, id]
    );
  };

  // Generate AI response
  const handleGenerateResponse = async () => {
    if (!question.trim()) {
      setError('Please enter an interview question');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Call the Edge Function to generate a response
      const { data, error } = await supabase.functions.invoke('generate-interview-response', {
        body: {
          question: question.trim(),
          questionType,
          targetRole: targetRole.trim() || undefined,
          targetIndustry: targetIndustry.trim() || undefined,
          emphasizedSkills: emphasizedSkills.length > 0 ? emphasizedSkills : undefined,
          userId,
          experienceIds: selectedExperiences.length > 0 ? selectedExperiences : undefined,
          projectIds: selectedProjects.length > 0 ? selectedProjects : undefined
        } as GenerateResponseRequest
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.response) {
        throw new Error('Failed to generate response');
      }

      setResponse(data.response);
    } catch (err) {
      console.error('Error generating response:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the response');
    } finally {
      setLoading(false);
    }
  };

  // Copy response to clipboard
  const copyToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={`border border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
          AI Interview Response Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert
          variant="info"
          message="This AI assistant generates personalized interview responses based on your work history, projects, and professional background."
          className="mb-4"
        />

        {/* Question Input */}
        <div className="space-y-2">
          <label className="block text-gray-300 font-medium">Interview Question</label>
          <TextArea
            name="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            label=""
            rows={3}
            placeholder="Enter the interview question you want to answer..."
          />
        </div>

        {/* Question Type Selection */}
        <div>
          <label className="block text-gray-300 font-medium mb-2">Question Type</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(skillOptions) as QuestionType[]).map((type) => (
              <button
                key={type}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  questionType === type
                    ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                }`}
                onClick={() => setQuestionType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-2">
          <button
            type="button"
            className="text-[#FF8A00] hover:text-[#FF8A00]/80 text-sm flex items-center"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            {showAdvancedOptions ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 pt-2 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                label="Target Role"
                placeholder="e.g., Senior Software Engineer"
                icon={Target}
                optional
              />
              <FormInput
                name="targetIndustry"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                label="Target Industry"
                placeholder="e.g., Fintech, Healthcare"
                icon={Briefcase}
                optional
              />
            </div>

            {/* Emphasized Skills */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">Emphasized Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {emphasizedSkills.map((skill) => (
                  <div
                    key={skill}
                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-gray-200"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {emphasizedSkills.length === 0 && (
                  <span className="text-gray-500 text-sm">No skills selected. Choose from common skills or add your own.</span>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add a custom skill..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkill.trim()}
                  leftIcon={Plus}
                >
                  Add
                </Button>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Common {questionType} skills:</label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions[questionType].map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className={`px-2 py-1 rounded-full text-xs ${
                        emphasizedSkills.includes(skill)
                          ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40'
                          : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        if (emphasizedSkills.includes(skill)) {
                          handleRemoveSkill(skill);
                        } else {
                          setEmphasizedSkills([...emphasizedSkills, skill]);
                        }
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Selection */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Specific Experiences to Include
                {experiencesLoading && <LoadingSpinner className="inline-block ml-2" />}
              </label>
              <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-2">
                {experiences.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2">No work experiences found. Add some in the Work Experience section.</p>
                ) : (
                  <div className="space-y-2">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedExperiences.includes(exp.id)
                            ? 'bg-[#FF8A00]/10 border border-[#FF8A00]/40'
                            : 'bg-gray-700 border border-gray-600 hover:bg-gray-650'
                        }`}
                        onClick={() => toggleExperience(exp.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{exp.company}</p>
                            <p className="text-[#FF8A00] text-sm">{exp.role}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              {new Date(exp.start_date).toLocaleDateString()} - 
                              {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                            </p>
                          </div>
                          <div className="w-4 h-4 mt-1">
                            {selectedExperiences.includes(exp.id) && (
                              <Check className="h-4 w-4 text-[#FF8A00]" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {selectedExperiences.length === 0 
                  ? "All experiences will be considered" 
                  : `${selectedExperiences.length} experience${selectedExperiences.length > 1 ? 's' : ''} selected`}
              </p>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Specific Projects to Include
                {projectsLoading && <LoadingSpinner className="inline-block ml-2" />}
              </label>
              <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-2">
                {projects.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2">No projects found. Add some in the Work Experience section.</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedProjects.includes(project.id)
                            ? 'bg-[#FF8A00]/10 border border-[#FF8A00]/40'
                            : 'bg-gray-700 border border-gray-600 hover:bg-gray-650'
                        }`}
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{project.title || 'Untitled Project'}</p>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {project.enhanced_description || project.raw_input}
                            </p>
                          </div>
                          <div className="w-4 h-4 mt-1">
                            {selectedProjects.includes(project.id) && (
                              <Check className="h-4 w-4 text-[#FF8A00]" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {selectedProjects.length === 0 
                  ? "All projects will be considered" 
                  : `${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''} selected`}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert
            variant="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Generate Button */}
        <div className="pt-2">
          <Button
            onClick={handleGenerateResponse}
            isLoading={loading}
            disabled={!question.trim() || loading}
            leftIcon={Sparkles}
            fullWidth
          >
            Generate Response
          </Button>
        </div>

        {/* Response Display */}
        {response && (
          <div className="mt-4 animate-fadeIn">
            <div className="bg-gray-800 rounded-lg border border-[#FF8A00]/30 p-4 relative">
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={copied ? Check : Copy}
                  onClick={copyToClipboard}
                  className={`h-8 w-8 p-0 ${copied ? 'text-green-400' : 'text-gray-400'}`}
                />
              </div>
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-[#FF8A00]" />
                AI-Generated Response
              </h3>
              <div className="text-gray-300 whitespace-pre-line">
                {response}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-700 pt-4">
        <div className="text-gray-400 text-xs">
          Responses are generated based on your professional background and tailored to the specific question.
        </div>
      </CardFooter>
    </Card>
  );
}