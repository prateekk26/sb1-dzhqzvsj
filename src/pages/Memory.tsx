import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingIcon, 
  Briefcase, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Plus,
  Edit,
  Linkedin,
  FileText,
  LayoutGrid,
  LayoutList,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExperiences, Experience, ExperienceInput } from '../hooks/useExperiences';
import { FormInput } from '../components/FormInput';
import { DatePicker } from '../components/DatePicker';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Alert } from '../components/Alert';
import { Modal, useModal } from '../components/Modal';
import { LoadingState, LoadingSpinner } from '../components/LoadingState';
import { ExperienceItem } from '../components/ExperienceItem';
import { TextArea } from '../components/TextArea';
import { supabase } from '../lib/supabase';
import { ApiDebug } from '../components/ApiDebug';
import { 
  extractLinkedInUsername, 
  fetchLinkedInData, 
  getUserLinkedInUrl,
  testApiConnection
} from '../services/linkedinService';
import { formatDate } from '../utils/dateUtils';

export default function Memory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const { 
    experiences, 
    loading: experiencesLoading, 
    error: experiencesError,
    addExperience,
    updateExperience,
    deleteExperience,
    deleteLinkedInExperiences
  } = useExperiences(user?.id || null);

  const today = new Date().toISOString().split('T')[0];
  
  const initialFormState: Partial<ExperienceInput> = {
    company: '',
    role: '',
    location: '',
    description: '',
    start_date: '',
    end_date: null,
    source: 'manual',
    source_id: null
  };

  const [formData, setFormData] = useState<Partial<ExperienceInput>>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLinkedinLoading, setIsLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const deleteModal = useModal();
  const confirmImportModal = useModal();
  const [experienceToDelete, setExperienceToDelete] = useState<Experience | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.company?.trim()) {
      newErrors.company = 'Company is required';
    }
    
    if (!formData.role?.trim()) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date cannot be before start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    const isValid = validateForm();
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    try {
      // Make sure source is set to 'manual' when adding/editing manually
      const dataToSubmit = {
        ...formData,
        source: 'manual'
      };
      
      const result = isEditing && currentId
        ? await updateExperience(currentId, dataToSubmit)
        : await addExperience(dataToSubmit);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save experience');
      }
      
      // Reset form
      setFormData(initialFormState);
      setIsEditing(false);
      setCurrentId(null);
      
      // Hide the form after successful submission unless editing
      if (!isEditing) {
        setShowAddForm(false);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExperience = (experience: Experience) => {
    setFormData({
      company: experience.company,
      role: experience.role,
      location: experience.location,
      description: experience.description,
      start_date: experience.start_date,
      end_date: experience.end_date,
      source: experience.source,
      source_id: experience.source_id
    });
    setIsEditing(true);
    setCurrentId(experience.id);
    setErrors({}); // Clear any previous errors
    setShowAddForm(true); // Show the form when editing
    
    // Scroll to the form
    setTimeout(() => {
      const formElement = document.getElementById('experience-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setCurrentId(null);
    setErrors({});
    
    // Only hide the form if it was shown for editing
    if (isEditing) {
      setShowAddForm(false);
    }
  };

  const confirmDeleteExperience = (experience: Experience) => {
    setExperienceToDelete(experience);
    
    deleteModal.open({
      title: 'Delete Experience',
      content: (
        <div>
          <p className="text-white">Are you sure you want to delete this experience?</p>
          <div className="mt-2 p-3 bg-gray-700 rounded-md">
            <p className="text-white font-medium">{experience.company}</p>
            <p className="text-gray-300">{experience.role}</p>
          </div>
          <p className="text-gray-400 mt-3">This action cannot be undone. All projects associated with this experience will also be deleted.</p>
        </div>
      ),
      footer: (
        <>
          <Button variant="ghost" onClick={deleteModal.close}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            isLoading={isDeleting}
            onClick={() => {
              // Define the delete action directly here
              const performDelete = async () => {
                if (!experienceToDelete) return;
                
                setIsDeleting(true);
                try {
                  const result = await deleteExperience(experienceToDelete.id);
                  
                  if (!result.success) {
                    throw new Error(result.error || 'Failed to delete experience');
                  }
                  
                  deleteModal.close();
                } catch (error) {
                  console.error('Delete failed:', error);
                  setSubmitError(error instanceof Error ? error.message : 'Failed to delete experience');
                } finally {
                  setIsDeleting(false);
                  setExperienceToDelete(null);
                }
              };
              
              // Execute the delete function
              performDelete();
            }}
          >
            Delete
          </Button>
        </>
      )
    });
  };

  const confirmImportFromLinkedIn = async () => {
    if (!user?.id) return;
    
    // First check if the user has LinkedIn experiences
    const hasLinkedInExperiences = experiences.some(exp => exp.source === 'linkedin');
    
    if (hasLinkedInExperiences) {
      // Ask for confirmation before overwriting
      confirmImportModal.open({
        title: 'Overwrite LinkedIn Experiences',
        content: (
          <div>
            <p className="text-white">You already have experiences imported from LinkedIn.</p>
            <p className="text-gray-300 mt-2">Importing again will replace all your previously imported LinkedIn experiences with new data.</p>
            <p className="text-gray-400 mt-3">Manually added experiences will not be affected.</p>
          </div>
        ),
        footer: (
          <>
            <Button variant="ghost" onClick={confirmImportModal.close}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                confirmImportModal.close();
                handleImportFromLinkedIn();
              }}
            >
              Import and Replace
            </Button>
          </>
        )
      });
    } else {
      // No existing LinkedIn experiences, proceed with import
      handleImportFromLinkedIn();
    }
  };

  const handleImportFromLinkedIn = async () => {
    if (!user?.id) return;
    
    setIsLinkedinLoading(true);
    setLinkedinError(null);
    setImportSuccess(null);
    setImportInProgress(true);
    
    try {
      // First, test the API connection
      const apiTest = await testApiConnection();
      if (!apiTest.success) {
        throw new Error(`Server connection failed: ${apiTest.message}`);
      }
      
      // Get the user's LinkedIn URL from their profile
      const linkedinUrl = await getUserLinkedInUrl(supabase, user.id);
      
      if (!linkedinUrl) {
        throw new Error('LinkedIn URL not found. Please add it to your profile first.');
      }
      
      // Fetch LinkedIn data directly with the URL
      const { experiences: linkedInExperiences, error } = await fetchLinkedInData(linkedinUrl);
      
      if (error) {
        throw new Error(error);
      }
      
      if (linkedInExperiences.length === 0) {
        throw new Error('No experiences found on LinkedIn profile.');
      }
      
      // First, delete all existing LinkedIn experiences
      const deleteResult = await deleteLinkedInExperiences();
      if (!deleteResult.success) {
        console.error('Error deleting existing LinkedIn experiences:', deleteResult.error);
        // Continue with import even if delete fails
      }
      
      // Directly import all experiences
      let importedCount = 0;
      let failedCount = 0;
      
      // Sort experiences by start_date in descending order (most recent first)
      const sortedExperiences = [...linkedInExperiences].sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateB - dateA;  // Most recent first
      });
      
      for (const exp of sortedExperiences) {
        const result = await addExperience(exp);
        if (result.success) {
          importedCount++;
        } else {
          failedCount++;
          console.error('Failed to import experience:', exp.company, result.error);
        }
      }
      
      setImportSuccess(`Successfully imported ${importedCount} experiences${failedCount > 0 ? `. Failed to import ${failedCount} experiences.` : '.'}`);
      
    } catch (error) {
      console.error('LinkedIn import error:', error);
      setLinkedinError(error instanceof Error ? error.message : 'Failed to fetch LinkedIn data');
    } finally {
      setIsLinkedinLoading(false);
      setImportInProgress(false);
    }
  };

  // Enable debug mode with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Count LinkedIn vs manual experiences
  const linkedInCount = experiences.filter(exp => exp.source === 'linkedin').length;
  const manualCount = experiences.filter(exp => exp.source === 'manual').length;

  if (authLoading) {
    return <LoadingState />;
  }

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
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Work Experience</h1>
            <p className="text-gray-400 text-sm max-w-2xl">
              Manage your work history, add details of your previous roles, and import from LinkedIn.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Linkedin}
              onClick={confirmImportFromLinkedIn}
              isLoading={isLinkedinLoading}
              disabled={importInProgress}
              className="text-white bg-blue-600 hover:bg-blue-700 border-blue-600 transition-all duration-200"
            >
              Import from LinkedIn
            </Button>
            
            <Button
              variant={showAddForm ? "secondary" : "outline"}
              size="sm"
              leftIcon={showAddForm ? Edit : Plus}
              onClick={() => setShowAddForm(!showAddForm)}
              className="transition-all duration-200"
            >
              {showAddForm ? (isEditing ? "Editing" : "Hide Form") : "Add Experience"}
            </Button>
            
            {showDebug ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(false)}
              >
                Hide Debug
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(true)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Debug
              </Button>
            )}
          </div>
        </div>
        
        {/* Success/error messages at the top level */}
        <div className="mb-6">
          {submitError && (
            <Alert
              variant="error"
              message={submitError}
              className="mb-4 animate-fadeIn"
              onClose={() => setSubmitError(null)}
            />
          )}
          
          {linkedinError && (
            <Alert
              variant="error"
              message={linkedinError}
              className="mb-4 animate-fadeIn"
              onClose={() => setLinkedinError(null)}
            />
          )}
          
          {importSuccess && (
            <Alert
              variant="success"
              message={importSuccess}
              className="mb-4 animate-fadeIn"
              onClose={() => setImportSuccess(null)}
            />
          )}
        </div>
        
        {/* Add/Edit Experience Form - Only shown when showAddForm is true */}
        <div 
          id="experience-form"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showAddForm 
              ? 'max-h-[2000px] opacity-100 mb-8' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <Card className="border border-gray-700 hover:border-[#FF8A00]/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                {isEditing ? (
                  <>
                    <Edit className="h-5 w-5 mr-2 text-[#FF8A00]" />
                    Edit Experience
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2 text-[#FF8A00]" />
                    Add Experience
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="company"
                    value={formData.company || ''}
                    onChange={handleInputChange}
                    label="Company"
                    placeholder="Enter company name"
                    icon={BuildingIcon}
                    error={errors.company}
                  />
                  
                  <FormInput
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    label="Role / Title"
                    placeholder="Enter your job title"
                    icon={Briefcase}
                    error={errors.role}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker
                    name="start_date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                    label="Start Date"
                    icon={Calendar}
                    error={errors.start_date}
                    max={today}
                  />
                  
                  <DatePicker
                    name="end_date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    label="End Date"
                    icon={Calendar}
                    error={errors.end_date}
                    optional
                    min={formData.start_date}
                    max={today}
                  />
                </div>
                
                <FormInput
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  label="Location"
                  placeholder="City, Country (optional)"
                  icon={MapPin}
                  error={errors.location}
                  optional
                />
                
                <TextArea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  label="Description"
                  placeholder="Describe your responsibilities and achievements in this role (optional)"
                  icon={FileText}
                  rows={4}
                  optional
                />
                
                <div className="pt-2 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    variant="outline"
                  >
                    {isEditing ? 'Update Experience' : 'Add Experience'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Experiences section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-[#FF8A00]" />
                Your Experiences
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {experiences.length > 0 
                  ? `You have ${experiences.length} work experiences` 
                  : 'Add your work history to showcase your career journey'}
              </p>
            </div>
            
            {experiences.length > 0 && (
              <div className="flex items-center">
                <div className="hidden md:flex gap-2 text-sm mr-4">
                  {linkedInCount > 0 && (
                    <span className="flex items-center text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                      <Linkedin className="h-3 w-3 mr-1" /> {linkedInCount} from LinkedIn
                    </span>
                  )}
                  {manualCount > 0 && (
                    <span className="flex items-center text-gray-300 bg-gray-700 px-2 py-1 rounded">
                      <Edit className="h-3 w-3 mr-1" /> {manualCount} manual
                    </span>
                  )}
                </div>
                
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button 
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <LayoutList size={18} />
                  </button>
                  <button 
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {experiencesLoading ? (
            <div className="py-16 flex justify-center items-center bg-gray-800/50 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 relative mb-4">
                  <div className="absolute h-full w-full border-4 border-gray-600 rounded-full"></div>
                  <div className="absolute h-full w-full border-4 border-[#FF8A00] rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-gray-400">Loading your experiences...</p>
              </div>
            </div>
          ) : experiencesError ? (
            <Alert
              variant="error"
              message={experiencesError}
              className="animate-fadeIn"
            />
          ) : experiences.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="max-w-md mx-auto">
                <div className="inline-block p-3 bg-[#FF8A00]/20 rounded-full mb-4">
                  <Briefcase className="h-8 w-8 text-[#FF8A00]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No work experiences yet</h3>
                <p className="text-gray-400 mb-6 px-4">
                  Add your work history or import from LinkedIn to showcase your professional journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={confirmImportFromLinkedIn}
                    leftIcon={Linkedin}
                    className="bg-blue-600 hover:bg-blue-700 text-white order-first"
                  >
                    Import from LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                    leftIcon={Plus}
                  >
                    Add Manually
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            viewMode === 'list' ? (
              // List view
              <div className="space-y-4 animate-fadeIn">
                {experiences.map((experience) => (
                  <div 
                    key={experience.id}
                    className="transition-all duration-300 hover:translate-x-1 hover:shadow-lg"
                  >
                    <ExperienceItem
                      experience={experience}
                      onEdit={handleEditExperience}
                      onDelete={confirmDeleteExperience}
                      userId={user?.id || null}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Grid view
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                {experiences.map((experience) => (
                  <div 
                    key={experience.id}
                    className="transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg"
                  >
                    <Card className={`h-full border ${
                      experience.source === 'linkedin' 
                        ? 'border-blue-800/50 hover:border-[#FF8A00]/40' 
                        : 'border-gray-700 hover:border-[#FF8A00]/40'
                    } transition-colors`}>
                      <CardContent className="p-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-white font-semibold text-lg flex items-center">
                                {experience.company}
                                {experience.source === 'linkedin' && (
                                  <span className="flex items-center text-xs bg-blue-600/40 text-blue-200 px-2 py-0.5 rounded-full ml-2">
                                    <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                                  </span>
                                )}
                              </h3>
                              <p className="text-[#FF8A00]">{experience.role}</p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={Edit}
                                onClick={() => handleEditExperience(experience)}
                                className="text-gray-400 hover:text-[#FF8A00] hover:bg-[#FF8A00]/10 transition-colors"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                          
                          {/* Consistent date and location display */}
                          <div className="flex flex-wrap gap-2 mt-3 mb-3">
                            <div className="bg-gray-800/60 px-3 py-1.5 rounded-md flex items-center text-gray-300 text-sm">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-[#FF8A00]/80" /> 
                              <span>
                                {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Present'}
                              </span>
                            </div>
                            
                            {experience.location && (
                              <div className="bg-gray-800/60 px-3 py-1.5 rounded-md flex items-center text-gray-300 text-sm">
                                <MapPin className="h-3.5 w-3.5 mr-2 text-[#FF8A00]/80" /> 
                                <span>{experience.location}</span>
                              </div>
                            )}
                          </div>
                        
                          {/* Always show description if available */}
                          {experience.description && (
                            <div className="mt-3 p-3 bg-gray-800/70 rounded-lg text-gray-300 text-sm border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
                              <p className="line-clamp-3 whitespace-pre-line">{experience.description}</p>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDeleteExperience(experience)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              Delete
                            </Button>
                            
                            <Button
                              variant="primary"
                              size="sm"
                              rightIcon={ChevronRight}
                              onClick={() => {
                                // Open experience details or projects
                                const experienceItem = document.getElementById(`experience-${experience.id}`);
                                if (experienceItem) {
                                  experienceItem.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="hover:bg-[#FF8A00]/90 transition-colors"
                            >
                              Add Projects
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        
        {showDebug && (
          <div className="mt-8 transition-all duration-300 animate-fadeIn">
            <ApiDebug title="LinkedIn API Debug" />
          </div>
        )}
      </div>
      
      {deleteModal.ModalComponent}
      {confirmImportModal.ModalComponent}
    </div>
  );
}