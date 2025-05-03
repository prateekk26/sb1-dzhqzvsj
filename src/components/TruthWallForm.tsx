import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Briefcase, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  DollarSign, 
  Send, 
  CheckCircle,
  X, 
  MapPin,
  Plus,
  Search,
  Loader,
  Calendar
} from 'lucide-react';
import { useRef } from 'react';
import { Button } from './Button'; 
import { FormInput } from './Form/FormInput';
import { TextArea } from './Form/TextArea';
import { Alert } from './Alert';
import { useTruthWall, InterviewReviewInput } from '../hooks/useTruthWall';
import { useCompanies } from '../hooks/useCompanies';
import { useDebounce } from '../hooks/useDebounce';

// Form steps
type FormStep = 1 | 2 | 3 | 4;

// Interview stage options
type InterviewStage = 
  | 'interview_invite'
  | 'hr_screen'
  | 'test'
  | 'assignment'
  | 'interview_round_1_2'
  | 'interview_round_3_4'
  | 'interview_round_5_plus'
  | 'got_offer'
  | 'rejected_offer'
  | 'accepted_offer';

// Interviewer attitude options
type InterviewerAttitude = 
  | 'respectful' 
  | 'friendly' 
  | 'disinterested' 
  | 'rude' 
  | 'condescending';

// Assignment duration options
type AssignmentDuration = 
  | 'less_than_2_hours' 
  | '2_to_6_hours' 
  | 'more_than_6_hours';

// Date range options
type DateRange = 
  | '0_3_months'
  | '3_6_months'
  | '6_12_months'
  | '12_plus_months';

// Form data interface
interface TruthWallFormData {
  companyLinkedInUrl: string;
  roleTitle: string;
  stage: InterviewStage | '';
  dateRange: DateRange | '';
  wasGhosted: boolean | null;
  interviewerAttitude: InterviewerAttitude | '';
  gaveFeedback: boolean | null;
  hadAssignment: boolean | null;
  assignmentDuration: AssignmentDuration | '';
  previousSalary: string;
  expectedSalary: string;
  offeredSalary: string;
  comments: string;
  location: string;
}

// Initial form state
const initialFormState: TruthWallFormData = {
  companyLinkedInUrl: '',
  roleTitle: '',
  stage: '',
  dateRange: '',
  wasGhosted: null,
  interviewerAttitude: '',
  gaveFeedback: null,
  hadAssignment: null,
  assignmentDuration: '',
  previousSalary: '',
  expectedSalary: '',
  offeredSalary: '',
  comments: '',
  location: ''
};

interface TruthWallFormProps {
  onSubmitSuccess?: () => void;
  userId?: string;
}

export function TruthWallForm({ onSubmitSuccess, userId }: TruthWallFormProps) {
  // State for form steps and data
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<TruthWallFormData>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Create a ref to track component mount state
  const isMountedRef = useRef<boolean>(true);
  
  // Use the truth wall hook
  const { submitReview, loading: isSubmitting } = useTruthWall(userId);
  
  // Get user's location when component mounts
  useEffect(() => {
    // Set mounted flag
    const isMountedRef = { current: true };
    
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get city and country using reverse geocoding
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=en`)
            .then(response => response.json())
            .then(data => {
              // Only update state if component is still mounted
              if (!isMountedRef.current) return;
              
              const city = data.address?.city || data.address?.town || data.address?.village || '';
              const state = data.address?.state || '';
              const country = data.address?.country || '';
              
              let locationString = '';
              if (city) locationString += city;
              if (state && state !== city) locationString += locationString ? `, ${state}` : state;
              if (country) locationString += locationString ? `, ${country}` : country;
              
              setFormData(prev => ({ ...prev, location: locationString }));
              setIsGettingLocation(false);
            })
            .catch(err => {
              console.error('Error getting location details:', err);
              // Only update state if component is still mounted
              if (!isMountedRef.current) return;
              
              // Fall back to coordinates if geocoding fails
              setFormData(prev => ({ 
                ...prev, 
                location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}` 
              }));
              setIsGettingLocation(false);
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Only update state if component is still mounted
          if (!isMountedRef.current) return;
          setIsGettingLocation(false);
        }
      );
    }
    
    // Cleanup function to set mounted flag to false when component unmounts
    return () => {
      // This is a cleanup function
    };
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle toggle changes
  const handleToggleChange = (name: keyof TruthWallFormData, value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Extract company name from LinkedIn URL
      const companyName = extractCompanyNameFromUrl(formData.companyLinkedInUrl);
      
      // Prepare the data for submission
      const reviewData: InterviewReviewInput = {
        company_name: companyName,
        company_linkedin_url: formData.companyLinkedInUrl,
        role_title: formData.roleTitle || undefined,
        stage: formData.stage,
        date_range: formData.dateRange || undefined,
        was_ghosted: formData.wasGhosted !== null ? formData.wasGhosted : undefined,
        interviewer_attitude: formData.interviewerAttitude || undefined,
        gave_feedback: formData.gaveFeedback !== null ? formData.gaveFeedback : undefined,
        had_assignment: formData.hadAssignment !== null ? formData.hadAssignment : undefined,
        assignment_duration: formData.assignmentDuration || undefined,
        previous_salary: formData.previousSalary || undefined,
        expected_salary: formData.expectedSalary || undefined,
        offered_salary: formData.offeredSalary || undefined,
        comments: formData.comments || undefined,
        location: formData.location || undefined
      };
      
      // Submit the review
      const result = await submitReview(reviewData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }
      
      // Reset form and call success callback
      setFormData(initialFormState);
      setCurrentStep(1);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  // Extract company name from LinkedIn URL
  const extractCompanyNameFromUrl = (url: string): string => {
    try {
      // If the URL doesn't look like a URL, just return it as the company name
      if (!url.includes('linkedin.com') && !url.includes('http')) {
        return url;
      }
      
      // Remove protocol and www if present
      let cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
      
      // Check if it's a LinkedIn company URL
      if (cleanUrl.startsWith('linkedin.com/company/')) {
        // Extract company name from URL
        const companySlug = cleanUrl.split('/company/')[1].split('/')[0];
        
        // Convert slug to readable name (replace hyphens with spaces and capitalize)
        return companySlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // If not a standard LinkedIn company URL, just return the URL as is
      return url;
    } catch (error) {
      console.error('Error extracting company name from URL:', error);
      return url;
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 4) {
      // If user was ghosted at interview invite stage, skip to final step
      if (currentStep === 1 && formData.stage === 'interview_invite') {
        setCurrentStep(4);
        return;
      }
      
      // If user was ghosted at any stage, skip step 3 (salary)
      if (currentStep === 2 && formData.wasGhosted === true) {
        setCurrentStep(4);
        return;
      }
      
      setCurrentStep(prev => (prev + 1) as FormStep);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as FormStep);
    }
  };
  
  // Render form step 1: The Basics
  const renderStep1 = () => (
    <div className="space-y-5 animate-fade-in">
      <h3 className="text-xl font-semibold text-white mb-5">Step 1: The Basics</h3>

      <FormInput
        name="companyLinkedInUrl"
        value={formData.companyLinkedInUrl}
        onChange={handleInputChange}
        label="Company Name or LinkedIn URL"
        placeholder="e.g., Google or linkedin.com/company/google"
        icon={Building}
      />
      
      <FormInput
        name="roleTitle"
        value={formData.roleTitle}
        onChange={handleInputChange}
        label="Role Title"
        placeholder="e.g., Software Engineer, Product Manager, etc."
        icon={Briefcase}
        optional
      />
      
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 font-medium text-lg mb-2">How Far Did You Get?</label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleInputChange}
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00] text-base"
            >
              <option value="">Select an option</option>
              <option value="interview_invite">Interview Invite</option>
              <option value="hr_screen">HR Screen</option>
              <option value="test">Test</option>
              <option value="assignment">Assignment</option>
              <option value="interview_round_1_2">Interview Round 1/2</option>
              <option value="interview_round_3_4">Interview Round 3/4</option>
              <option value="interview_round_5_plus">Interview Round 5/5+</option>
              <option value="got_offer">Got Offer</option>
              <option value="rejected_offer">Rejected Offer</option>
              <option value="accepted_offer">Accepted Offer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 font-medium text-lg mb-2">When Was This?</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-6 w-6" />
              <select
                name="dateRange"
                value={formData.dateRange}
                onChange={handleInputChange}
                className="w-full pl-12 p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00] text-base"
              >
                <option value="">Select timeframe</option>
                <option value="0_3_months">0-3 months ago</option>
                <option value="3_6_months">3-6 months ago</option>
                <option value="6_12_months">6-12 months ago</option>
                <option value="12_plus_months">12+ months ago</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Location display */}
        {formData.location && (
          <div className="mt-2 flex items-center text-sm text-gray-400">
            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
            <span>
              {isGettingLocation ? 'Detecting your location...' : formData.location}
            </span>
          </div>
        )}
        
        <div className="pt-6 flex justify-end">
          <Button
            onClick={handleNextStep}
            disabled={!formData.companyLinkedInUrl || !formData.stage || !formData.dateRange}
            rightIcon={ChevronRight}
            size="lg"
          >
            {formData.stage === 'interview_invite' ? 'Skip to Comments' : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  );
  
  // Render form step 2: What Really Happened?
  const renderStep2 = () => (
    <div className="space-y-5 animate-fade-in">
      <h3 className="text-xl font-semibold text-white mb-5">Step 2: What Really Happened?</h3>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium text-lg mb-2">Did they ghost you?</label>
        <div className="flex space-x-5">
          <button
            type="button"
            onClick={() => handleToggleChange('wasGhosted', true)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.wasGhosted === true
                ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-5 w-5 mr-3" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('wasGhosted', false)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.wasGhosted === false 
                ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-5 w-5 mr-3" />
            No
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium text-lg mb-2">Was your interviewer...</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['respectful', 'friendly', 'disinterested', 'rude', 'condescending'].map((attitude) => (
            <button
              key={attitude}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, interviewerAttitude: attitude as InterviewerAttitude }))}
              className={`px-4 py-3 rounded-lg text-base ${
                formData.interviewerAttitude === attitude 
                  ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40' 
                  : 'bg-gray-700 text-gray-300 border border-gray-600'
              }`}
            >
              {attitude.charAt(0).toUpperCase() + attitude.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium text-lg mb-2">Did they give you feedback?</label>
        <div className="flex space-x-5">
          <button
            type="button"
            onClick={() => handleToggleChange('gaveFeedback', true)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.gaveFeedback === true
                ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-5 w-5 mr-3" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('gaveFeedback', false)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.gaveFeedback === false 
                ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-5 w-5 mr-3" />
            No
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium text-lg mb-2">Was there an assignment?</label>
        <div className="flex space-x-5">
          <button
            type="button"
            onClick={() => handleToggleChange('hadAssignment', true)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.hadAssignment === true
                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-5 w-5 mr-3" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('hadAssignment', false)}
            className={`flex items-center px-5 py-3 rounded-lg text-base ${
              formData.hadAssignment === false 
                ? 'bg-gray-700/80 text-gray-300 border border-gray-600' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-5 w-5 mr-3" />
            No
          </button>
        </div>
      </div>
      
      {formData.hadAssignment && (
        <div className="space-y-2 animate-fade-in">
          <label className="block text-gray-300 font-medium text-lg mb-2">How long did it take?</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'less_than_2_hours', label: '< 2 hours' },
              { value: '2_to_6_hours', label: '2-6 hours' },
              { value: 'more_than_6_hours', label: '6+ hours' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  assignmentDuration: option.value as AssignmentDuration 
                }))}
                className={`px-4 py-3 rounded-lg text-base ${
                  formData.assignmentDuration === option.value 
                    ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40' 
                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          rightIcon={ChevronRight}
          size="lg"
        >
          {formData.wasGhosted ? 'Skip to Comments' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
  
  // Render form step 3: Show Me the Money
  const renderStep3 = () => (
    <div className="space-y-5 animate-fade-in">
      <h3 className="text-xl font-semibold text-white mb-5">Step 3: Show Me the Money (Optional)</h3>
      
      <div className="space-y-5">
        <div className="relative">
          <FormInput
            name="previousSalary"
            value={formData.previousSalary}
            onChange={handleInputChange}
            label="Previous CTC"
            placeholder="e.g., 80000"
            icon={DollarSign}
            optional
          />
        </div>
        
        <div className="relative">
          <FormInput
            name="expectedSalary"
            value={formData.expectedSalary}
            onChange={handleInputChange}
            label="Expected Offer"
            placeholder="e.g., 100000"
            icon={DollarSign}
            optional
          />
        </div>
        
        <div className="relative">
          <FormInput
            name="offeredSalary"
            value={formData.offeredSalary}
            onChange={handleInputChange}
            label="What did they offer?"
            placeholder="e.g., 90000"
            icon={DollarSign}
            optional
          />
        </div>
      </div>
      
      {/* Auto-generated tags based on salary info */}
      {formData.expectedSalary && formData.offeredSalary && (
        <div className="flex flex-wrap gap-3 mt-3 animate-fade-in">
          {parseInt(formData.offeredSalary) < parseInt(formData.expectedSalary) * 0.9 && (
            <span className="bg-red-900/30 text-red-300 px-3 py-1.5 rounded-full text-sm border border-red-700/50">
              Lowball Offer
            </span>
          )}
          {parseInt(formData.offeredSalary) >= parseInt(formData.expectedSalary) && (
            <span className="bg-green-900/30 text-green-300 px-3 py-1.5 rounded-full text-sm border border-green-700/50">
              Exceeded Expectations
            </span>
          )}
          {parseInt(formData.offeredSalary) >= parseInt(formData.previousSalary) * 1.2 && (
            <span className="bg-green-900/30 text-green-300 px-3 py-1.5 rounded-full text-sm border border-green-700/50">
              Significant Raise
            </span>
          )}
        </div>
      )}
      
      <div className="pt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          rightIcon={ChevronRight}
          size="lg"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
  
  // Render form step 4: Final Comments
  const renderStep4 = () => (
    <div className="space-y-5 animate-fade-in">
      <h3 className="text-xl font-semibold text-white mb-5">Final Step: Share Your Experience</h3>
      
      <TextArea
        name="comments"
        value={formData.comments}
        onChange={handleInputChange}
        label="Any comments you want to share with the world?"
        placeholder="Share your experience, advice, or anything else you think would help others..."
        rows={6}
        optional
      />
      
      {error && (
        <Alert
          variant="error"
          message={error}
        />
      )}
      
      <div className="pt-6 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
          size="lg"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          rightIcon={Send}
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
    </form>
  );
}