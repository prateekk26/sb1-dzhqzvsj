import React, { useState } from 'react';
import { Edit, Trash, MapPin, Calendar, ChevronDown, ChevronUp, FileText, Plus, Linkedin, Sparkles, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { Alert } from './Alert';
import { Experience } from '../hooks/useExperiences';
import { Project, useProjects } from '../hooks/useProjects';
import { LoadingSpinner } from './LoadingState';
import { formatDate, formatDateWithDay, getDuration } from '../utils/dateUtils';
import { ProjectAIEnhancer } from './ProjectAIEnhancer';
import { FormInput } from './FormInput';

interface ExperienceItemProps {
  experience: Experience;
  onEdit: (experience: Experience) => void;
  onDelete: (experience: Experience) => void;
  userId: string | null;
}

export function ExperienceItem({ experience, onEdit, onDelete, userId }: ExperienceItemProps) {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [projectInput, setProjectInput] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For AI enhancement
  const [showAIEnhancer, setShowAIEnhancer] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Only fetch projects when the section is open
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError,
    addProject,
    deleteProject,
    updateProject,
    refresh: refreshProjects
  } = useProjects(
    isProjectsOpen ? userId : null, 
    isProjectsOpen ? experience.id : null
  );

  // Calculate target number of projects based on experience duration (3 per year)
  const calculateTargetProjects = (startDate: string, endDate: string | null): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Calculate years between dates (convert milliseconds to years)
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    // Target is 3 projects per year, with a minimum of 1 project
    return Math.max(1, Math.ceil(years * 3));
  };
  
  const targetProjects = calculateTargetProjects(experience.start_date, experience.end_date);
  const projectCount = projects?.length || 0;
  const completionPercentage = Math.min(100, Math.round((projectCount / targetProjects) * 100));

  // Combined function to handle project submission with or without AI
  const handleProjectSubmit = async (e: React.FormEvent, useAI: boolean = false) => {
    e.preventDefault();
    console.log('Project submission started');
    
    // Validate input
    setInputError(null);
    setTitleError(null);
    setIsSubmitting(true);
   
    if (!projectInput.trim()) {
      setIsSubmitting(false);
      setInputError('Project description is required');
      return;
    }
    
    if (projectTitle.length > 80) {
      setIsSubmitting(false);
      setTitleError('Title must be 80 characters or less');
      return;
    }
    
    try {
      console.log('Adding project to database:', {
        experience_id: experience.id,
        title: projectTitle.trim() || undefined,
        raw_input_length: projectInput.length
      });
      
      const result = await addProject({
        experience_id: experience.id,
        raw_input: projectInput,
        title: projectTitle.trim() || undefined
      });
      
      if (!result.success) {
        console.error('Project submission failed:', result.error);
        throw new Error(result.error || 'Failed to add project');
      }
      
      console.log('Project added successfully:', result.data?.id);
      
      // If AI enhancement is requested, open the enhancer
      if (useAI && result.data) {
        setSelectedProjectId(result.data.id);
        setShowAIEnhancer(true);
      } else {
        // Clear input on success
        setProjectInput('');
        setProjectTitle('');
      }

      // Refresh projects list to ensure UI is updated
      refreshProjects();
    } catch (error) {
      console.error('Error in handleProjectSubmit:', error);
      setInputError(error instanceof Error ? error.message : 'Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteProject = async (projectId: string) => {
    setIsSubmitting(true);
    
    // Reset errors
    setError(null);
    
    try {
      const result = await deleteProject(projectId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleProjects = () => {
    setIsProjectsOpen(!isProjectsOpen);
    // Reset errors when toggling
    setInputError(null);
    setTitleError(null);
    setError(null);
  };

  // Handle AI enhancement updates
  const handleProjectUpdate = async (projectId: string, updates: { 
    title?: string;
    enhanced_description?: string; 
    competencies?: string[]; 
    suggestions?: string[];
    competency_rationales?: Record<string, string>;
  }) => {
    try {
      // Save the AI-enhanced content to the project
      await updateProject(projectId, updates);
      // Refresh the projects list
      refreshProjects();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };
  
  // Determine if there is a description to show
  const hasDescription = experience.description && experience.description.trim().length > 0;
  
  // Determine badge based on source
  const renderSourceBadge = () => {
    if (experience.source === 'linkedin') {
      return (
        <span className="flex items-center text-xs bg-blue-600/40 text-blue-200 px-2 py-0.5 rounded-full ml-2">
          <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
        </span>
      );
    }
    return null;
  };

  // Render completion status badge
  const renderCompletionBadge = () => {
    if (completionPercentage >= 100) {
      return (
        <span className="flex items-center text-xs bg-green-600/40 text-green-200 px-2 py-0.5 rounded-full">
          <CheckCircle className="h-3 w-3 mr-1" /> Complete
        </span>
      );
    } else if (completionPercentage >= 66) {
      return (
        <span className="flex items-center text-xs bg-yellow-600/40 text-yellow-200 px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3 mr-1" /> Almost Complete
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-xs bg-red-600/40 text-red-200 px-2 py-0.5 rounded-full">
          <AlertCircle className="h-3 w-3 mr-1" /> Needs More Projects
        </span>
      );
    }
  };
  
  return (
    <div 
      id={`experience-${experience.id}`}
      className={`rounded-lg p-4 transition-all duration-300 hover:border-[#FF8A00]/60 ${
        experience.source === 'linkedin' 
          ? 'bg-blue-900/20 border border-blue-800/50 hover:bg-blue-900/30' 
          : 'bg-gray-700 border border-gray-700 hover:bg-gray-700/90'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-white font-semibold text-lg">{experience.company}</h3>
            {renderSourceBadge()}
          </div>
          <p className="text-[#FF8A00]">{experience.role}</p>
          
          {/* Date and location information - consistently positioned */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 mb-3">
            <div className="bg-gray-800/60 px-3 py-1.5 rounded-md flex items-center text-gray-300 text-sm">
              <Calendar className="h-3.5 w-3.5 mr-2 text-[#FF8A00]/80" /> 
              <span>{formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Present'}</span>
            </div>
            
            <div className="bg-gray-800/60 px-3 py-1.5 rounded-md flex items-center text-gray-300 text-sm">
              <span className="text-white font-medium">{getDuration(experience.start_date, experience.end_date)}</span>
            </div>
            
            {experience.location && (
              <div className="bg-gray-800/60 px-3 py-1.5 rounded-md flex items-center text-gray-300 text-sm">
                <MapPin className="h-3.5 w-3.5 mr-2 text-[#FF8A00]/80" /> 
                <span>{experience.location}</span>
              </div>
            )}
          </div>
          
          {/* Description section - always shown if available */}
          {hasDescription && (
            <div className="p-3 bg-gray-800/50 rounded-lg text-gray-300 text-sm whitespace-pre-line border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
              {experience.description}
            </div>
          )}
        </div>
        
        <div className="flex sm:flex-col space-x-1 sm:space-x-0 sm:space-y-2 ml-auto sm:ml-0">
          <IconButton
            icon={Edit}
            variant="ghost"
            size="sm"
            onClick={() => onEdit(experience)}
            label="Edit Experience"
            className="hover:bg-[#FF8A00]/10 hover:text-[#FF8A00] transition-colors"
          />
          <IconButton
            icon={Trash}
            variant="ghost"
            size="sm"
            onClick={() => onDelete(experience)}
            label="Delete Experience"
            className="hover:text-red-500 hover:bg-red-900/20 transition-colors"
          />
          <Button
            variant={isProjectsOpen ? "secondary" : "primary"}
            size="sm"
            rightIcon={isProjectsOpen ? ChevronUp : ChevronDown}
            className="sm:mt-2 transition-colors"
            onClick={toggleProjects}
          >
            Projects
          </Button>
        </div>
      </div>
      
      {isProjectsOpen && (
        <div className="mt-4 pt-4 border-t border-gray-600 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-[#FF8A00]" />
              Projects
            </h4>
            <div className="flex items-center gap-2">
              {renderCompletionBadge()}
              <div className="text-sm text-gray-300">
                <span>{projectCount} of {targetProjects} projects added</span>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${
                completionPercentage >= 100 
                  ? 'bg-green-500' 
                  : completionPercentage >= 66 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <form onSubmit={handleProjectSubmit} className="mb-4">
            <div className="space-y-4">
              <FormInput
                name="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                label="Project Title"
                placeholder="Give your project a title (optional)"
                icon={FileText}
                error={titleError || undefined}
              />
              
              <TextArea
                name="project"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                label="Project Description"
                placeholder="Describe a project you worked on during this role..."
                error={inputError || undefined}
                rows={3}
              />
            </div>
            
            <div className="mt-2 flex justify-end space-x-2">
              <Button
                type="button"
                variant="primary"
                leftIcon={Sparkles}
                className="text-white"
                onClick={(e) => handleProjectSubmit(e, true)}
                disabled={isSubmitting || !projectInput.trim()}
              >
                Enhance with AI
              </Button>
              <Button
                type="submit"
                variant="outline"
                isLoading={isSubmitting}
                leftIcon={Plus}
                onClick={(e) => handleProjectSubmit(e, false)}
              >
                Add Project
              </Button>
            </div>
          </form>
          
          {projectCount < targetProjects && (
            <Alert 
              variant="info" 
              message={`Target: Add at least ${targetProjects} impactful projects to fully document this experience. ${targetProjects - projectCount} more needed.`}
              className="mb-4"
            />
          )}
          
          {/* Error message */}
          {error && (
            <Alert 
              variant="error" 
              message={error} 
              className="mb-3"
              onClose={() => setError(null)}
            />
          )}
          
          {projectsLoading ? (
            <ContentLoading message="Loading projects..." className="py-4" />
          ) : projectsError ? (
            <Alert 
              variant="error" 
              message={projectsError} 
              onClose={() => {}}
              className="mb-3"
            />
          ) : projects.length === 0 ? (
            <p className="text-gray-400 text-center py-2">No projects added yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onEnhance={() => {
                    setSelectedProjectId(project.id);
                    setShowAIEnhancer(true);
                  }}
                />
              ))}
            </div>
          )}
          
          {/* AI Enhancement Modal */}
          {showAIEnhancer && selectedProjectId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {projects.find(p => p.id === selectedProjectId) && (
                  <ProjectAIEnhancer
                    key={selectedProjectId}
                    project={projects.find(p => p.id === selectedProjectId)!}
                    onUpdate={handleProjectUpdate}
                    onClose={() => {
                      setShowAIEnhancer(false);
                      setSelectedProjectId(null);
                      // Refresh projects after closing the enhancer
                      refreshProjects();
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
  onEnhance: () => void;
}

function ProjectItem({ project, onDelete, onEnhance }: ProjectItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(project.id);
    setIsDeleting(false);
  };
  
  const displayTitle = project.title || 'Untitled Project';
  const hasEnhancedContent = !!project.enhanced_description;
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 transition-all duration-200 transform hover:-translate-y-1 hover:bg-gray-750 border border-gray-700 hover:border-[#FF8A00]/30">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className={`text-lg font-medium mb-1 ${!project.title ? 'text-gray-400' : 'text-white'}`}>
            {displayTitle}
          </h4>
          
          {/* Only show the enhanced content if available, otherwise show the raw input */}
          {hasEnhancedContent ? (
            <div className="bg-[#FF8A00]/5 border border-[#FF8A00]/20 p-3 rounded text-gray-300 text-sm">
              <div className="flex items-center text-[#FF8A00] text-xs mb-2">
                <Sparkles className="h-3 w-3 mr-1" /> 
                AI-Enhanced Description
              </div>
              <div className="whitespace-pre-line">
                {project.enhanced_description}
              </div>
              
              {/* Show competencies if available */}
              {project.competencies && project.competencies.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#FF8A00]/20">
                  <p className="text-xs font-medium text-[#FF8A00] mb-1">Competencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.competencies.map((code, i) => (
                      <div 
                        key={i}
                        className="group relative"
                      >
                        <span 
                          className="bg-[#FF8A00]/20 text-[#FF8A00] px-1.5 py-0.5 rounded text-xs font-mono cursor-help"
                          title={project.competency_rationales?.[code] || ""}
                        >
                          {code}
                        </span>
                        
                        {/* Tooltip for rationale */}
                        {project.competency_rationales?.[code] && (
                          <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 p-2 rounded shadow-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {project.competency_rationales[code]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white">{project.raw_input}</p>
          )}
          
          <p className="text-xs text-gray-400 mt-2">Added: {formatDateWithDay(project.created_at)}</p>
        </div>
        <div className="flex flex-col gap-2">
          {!hasEnhancedContent && (
            <IconButton
              icon={Sparkles}
              variant="ghost"
              size="sm"
              onClick={onEnhance}
              label="Enhance with AI"
              className="hover:text-[#FF8A00] hover:bg-[#FF8A00]/10 transition-colors"
            />
          )}
          <IconButton
            icon={Edit}
            variant="ghost"
            size="sm"
            onClick={onEnhance}
            label="Edit Project"
            className="hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
          />
          <IconButton
            icon={Trash}
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            label="Delete Project"
            className="hover:text-red-500 hover:bg-red-900/20 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}