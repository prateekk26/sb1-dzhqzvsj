import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Link as LinkIcon, FileText, Image, X, Upload, Eye, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useResumes, StorageFile } from '../hooks/useResumes';
import { Button } from '../components/Button';
import { FormInput } from '../components/Form/FormInput';
import { Card } from '../components/Card';
import { LoadingState, ProfileSkeleton } from '../components/LoadingState';
import { UploadingIndicator } from '../components/LoadingIndicator';
import { IconButton } from '../components/IconButton';
import { Modal } from '../components/Modal';
import { Alert } from '../components/Alert';

const CompleteProfile = memo(function CompleteProfile() {
  const { user, profile, loading: authLoading, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && profile?.profileCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, profile, navigate]);

  if (!initialized || authLoading) {
    return <LoadingState text="Loading Profile..." />;
  }

  if (profile?.profileCompleted) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center">
        <LoadingState text="Redirecting to Dashboard..." />
      </div>
    );
  }
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    linkedinUrl: '',
    resumeUrl: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

  const { 
    resumes: previousResumes, 
    loading: resumesLoading, 
    uploadResume, 
    deleteResume, 
    viewResume 
  } = useResumes(user?.id || null);

  useEffect(() => {
    if (!initialized || authLoading) return;

    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        linkedinUrl: profile.linkedinUrl || '',
        resumeUrl: profile.resumeUrl || '',
      });
      
      // Check if this is a new user
      if (!profile.firstName && !profile.lastName) {
        setIsNewUser(true);
      }
    }

    setPageLoading(false);
    console.log('Profile data loaded:', profile);
  }, [initialized, authLoading, user, profile, navigate]);

  // Handle file input click
  const handleFileButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.linkedinUrl.trim()) {
      newErrors.linkedinUrl = 'LinkedIn URL is required';
    } else if (!formData.linkedinUrl.includes('linkedin.com')) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)';
    }
    if (!resumeFile && !formData.resumeUrl && previousResumes.length === 0) newErrors.resume = 'Resume is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, resumeFile, previousResumes.length]);

  const saveProfile = useCallback(async (newResumeUrl: string | null) => {
    if (!user?.id) throw new Error('No user ID');

    const { error } = await supabase
      .from('users_profile')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        linkedin_url: formData.linkedinUrl,
        resume_url: newResumeUrl || formData.resumeUrl,
        profile_completed: true,
      })
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  }, [user, formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    const initialFormState = {
      firstName: '',
      lastName: '',
      linkedinUrl: '',
      resumeUrl: '',
    };

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let newResumeUrl = null;

      if (resumeFile) {
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(prev => (prev >= 95 ? prev : prev + 5));
        }, 300);

        const result = await uploadResume(resumeFile);
        clearInterval(interval);
        setUploadProgress(100);

        if (result.error) throw new Error(result.error);
        newResumeUrl = result.url;
      }

      await saveProfile(newResumeUrl);
      
      // Reset form
      console.log('Profile saved successfully');
      setFormData(initialFormState); 
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
      setSubmitError(error instanceof Error ? error.message : 'Error saving profile');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, resumeFile, uploadResume, saveProfile, navigate, formData]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset any previous errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.resume;
      return newErrors;
    });

    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, resume: 'Only PDF files are allowed' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setResumeFile(file);
  }, []);

  const confirmDeleteResumeHandler = useCallback((fileName: string) => {
    setResumeToDelete(fileName);
    console.log('Setting resume to delete:', fileName);
    setConfirmDeleteModalOpen(true);
  }, []);

  const handleDeleteResume = useCallback(async () => {
    if (!resumeToDelete) return;
    console.log('Deleting resume:', resumeToDelete);
    await deleteResume(resumeToDelete);
    
    // If the deleted resume was the one set in formData, clear it
    if (formData.resumeUrl && formData.resumeUrl.includes(resumeToDelete)) {
      setFormData(prev => ({ ...prev, resumeUrl: '' }));
    }
    
    setConfirmDeleteModalOpen(false);
    setResumeToDelete(null);
  }, [resumeToDelete, deleteResume]);

  if (authLoading || pageLoading) {
    return <LoadingState text="Loading Profile..." />;
  }

  return (
    <div className="min-h-screen bg-[#0F121A] flex flex-col items-center pt-12 px-4">
      <div className="w-full max-w-2xl">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6"
        >
          Back to Dashboard
        </Button>

        {resumesLoading ? <ProfileSkeleton /> : (
          <Card className="p-8 shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300">
            <h1 className="text-2xl font-bold text-white mb-6">
              {isNewUser ? 'Welcome! Complete Your Profile' : 'Update Your Profile Information'}
            </h1>

            {isNewUser && (
              <Alert
                variant="info"
                message="Please complete your profile information to get started. This information helps us personalize your experience and unlock all features."
                className="mb-6"
              />
            )}

            {submitError && submitError !== '' && (
              <Alert variant="error" message={submitError} className="mb-4" onClose={() => setSubmitError(null)} />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  ref={null}
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  label="First Name"
                  placeholder="Enter your first name"
                  icon={UserCircle}
                  error={errors.firstName}
                />
                <FormInput
                  ref={null}
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  label="Last Name"
                  placeholder="Enter your last name"
                  icon={UserCircle}
                  error={errors.lastName}
                />
              </div>

              <FormInput
                ref={null}
                name="linkedinUrl"
                value={formData.linkedinUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                label="LinkedIn Profile"
                placeholder="https://linkedin.com/in/your-profile"
                icon={LinkIcon}
                error={errors.linkedinUrl}
                helpText="Your LinkedIn URL helps us import your work experience and verify your profile"
              />

              <div className="space-y-4">
                <label className="block text-gray-300 font-medium mb-2">Resume (PDF only)</label>
                
                {/* Previously uploaded resumes */}
                {previousResumes.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h3 className="text-gray-300 text-sm font-medium">Your uploaded resumes:</h3>
                    {previousResumes.map((resume, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
                        <div className="flex items-center">
                          {resume.fileType === 'pdf' ? (
                            <FileText className="h-5 w-5 text-[#FF8A00] mr-2" />
                          ) : resume.fileType === 'png' ? (
                            <Image className="h-5 w-5 text-[#FF8A00] mr-2" />
                          ) : (
                            <FileText className="h-5 w-5 text-[#FF8A00] mr-2" />
                          )}
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">
                              {resume.name}
                            </p>
                            <p className="text-gray-400 text-xs flex items-center">
                              Uploaded: {resume.uploaded_at} • {resume.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <IconButton
                            icon={Eye}
                            variant="ghost"
                            size="sm"
                            onClick={() => viewResume(resume.url)}
                            label="View Resume"
                            className="hover:bg-gray-700/50"
                          />
                          <IconButton
                            icon={X}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Delete button clicked for resume:', resume.name);
                              confirmDeleteResumeHandler(resume.name);
                            }}
                            label="Delete Resume"
                            className="hover:bg-red-900/20 hover:text-red-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show upload progress indicator when uploading */}
                {isSubmitting && resumeFile && uploadProgress < 100 && (
                  <div className="mb-4">
                    <UploadingIndicator
                      fileName={resumeFile.name}
                      progress={uploadProgress}
                      onCancel={() => {
                        setResumeFile(null);
                        setUploadProgress(0);
                      }}
                    />
                  </div>
                )}
                
                {/* Resume upload area */}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg hover:border-[#FF8A00]/50 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      PDF up to 10MB
                    </p>
                    {resumeFile && (
                      <p className="text-sm text-[#FF8A00]">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>
                </div>
                
                {errors.resume && (
                  <Alert
                    variant="error"
                    message={errors.resume}
                    className="mt-2"
                  />
                )}
                
                <Alert
                  variant="info"
                  message="Upload your resume in PDF format. We'll automatically convert it for AI analysis when needed."
                  className="mt-2"
                />
                
                {resumeFile && (
                  <Alert
                    variant="success"
                    message={`Selected file: ${resumeFile.name} (${(resumeFile.size / 1024).toFixed(1)} KB)`}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  disabled={isSubmitting}
                >
                  Skip for Now
                </Button>
                
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isNewUser ? 'Complete Profile & Continue' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <Modal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button 
              variant="ghost" 
              onClick={() => setConfirmDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteResume}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Alert
            variant="warning"
            message="This action cannot be undone. The file will be permanently removed from your profile."
            className="mb-4"
          />
          <p className="text-white">Are you sure you want to delete this resume file?</p>
          {resumeToDelete && (
            <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300 font-mono">{resumeToDelete}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
});

export default CompleteProfile;