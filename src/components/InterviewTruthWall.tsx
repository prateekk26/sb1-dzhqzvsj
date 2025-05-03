import React, { useState } from 'react';
import { 
  MessageSquare, 
  Flame, 
  Award, 
  Hash, 
  ArrowRight, 
  CheckCircle, 
  X, 
  ChevronRight, 
  Building, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Ghost
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { FormInput } from './Form/FormInput';
import { TextArea } from './Form/TextArea';
import { Alert } from './Alert';

// Form steps
type FormStep = 1 | 2 | 3 | 4;

// Interview stage options
type InterviewStage = 
  | 'applied' 
  | 'assignment' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'accepted';

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

// Form data interface
interface TruthWallFormData {
  companyName: string;
  roleTitle: string;
  stage: InterviewStage | '';
  wasGhosted: boolean;
  interviewerAttitude: InterviewerAttitude | '';
  gaveFeedback: boolean;
  hadAssignment: boolean;
  assignmentDuration: AssignmentDuration | '';
  previousSalary: string;
  expectedSalary: string;
  offeredSalary: string;
  comments: string;
}

// Initial form state
const initialFormState: TruthWallFormData = {
  companyName: '',
  roleTitle: '',
  stage: '',
  wasGhosted: false,
  interviewerAttitude: '',
  gaveFeedback: false,
  hadAssignment: false,
  assignmentDuration: '',
  previousSalary: '',
  expectedSalary: '',
  offeredSalary: '',
  comments: ''
};

// Mock data for visualizations
const mockGhosters = [
  { company: 'Acme Corp', count: 87, trend: 'up' },
  { company: 'Globex Inc', count: 64, trend: 'down' },
  { company: 'Initech', count: 52, trend: 'up' },
  { company: 'Massive Dynamic', count: 43, trend: 'same' },
  { company: 'Umbrella Corp', count: 38, trend: 'up' }
];

const mockRespectful = [
  { company: 'Pied Piper', score: 92, tags: ['Gave Feedback', 'Fair Salary'] },
  { company: 'Stark Industries', score: 88, tags: ['Transparent', 'Quick Process'] },
  { company: 'Wayne Enterprises', score: 85, tags: ['Fair Salary', 'Respectful'] },
  { company: 'Hooli', score: 82, tags: ['Transparent'] }
];

const mockTags = [
  { text: 'Ghosted', count: 342, sentiment: 'negative' },
  { text: 'Lowball', count: 287, sentiment: 'negative' },
  { text: 'Transparent', count: 245, sentiment: 'positive' },
  { text: 'Respectful', count: 213, sentiment: 'positive' },
  { text: 'Dragged', count: 189, sentiment: 'negative' },
  { text: 'Wasted Time', count: 176, sentiment: 'negative' },
  { text: 'Fair Offer', count: 154, sentiment: 'positive' },
  { text: 'Quick Process', count: 132, sentiment: 'positive' },
  { text: 'Rude', count: 118, sentiment: 'negative' },
  { text: 'Helpful', count: 97, sentiment: 'positive' }
];

export function InterviewTruthWall() {
  // State for form steps and data
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<TruthWallFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
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
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.companyName) {
        throw new Error('Company name is required');
      }
      
      if (!formData.stage) {
        throw new Error('Please select how far you got in the process');
      }
      
      // TODO: Implement actual API call to save the review
      // For now, simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success state
      setIsSubmitted(true);
      
      // Show signup modal after a short delay
      setTimeout(() => {
        setShowSignupModal(true);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => (prev + 1) as FormStep);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as FormStep);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFormData(initialFormState);
    setCurrentStep(1);
    setIsSubmitted(false);
    setShowSignupModal(false);
  };
  
  // Render form step 1: The Basics
  const renderStep1 = () => (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Step 1: The Basics</h3>
      
      <FormInput
        name="companyName"
        value={formData.companyName}
        onChange={handleInputChange}
        label="Company Name"
        placeholder="e.g., Google, Amazon, etc."
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
        <label className="block text-gray-300 font-medium">How Far Did You Get?</label>
        <select
          name="stage"
          value={formData.stage}
          onChange={handleInputChange}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
        >
          <option value="">Select an option</option>
          <option value="applied">Applied</option>
          <option value="assignment">Completed Assignment</option>
          <option value="interview">Had Interview(s)</option>
          <option value="offer">Received Offer</option>
          <option value="rejected">Rejected</option>
          <option value="accepted">Accepted Offer</option>
        </select>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button
          onClick={handleNextStep}
          disabled={!formData.companyName || !formData.stage}
          rightIcon={ChevronRight}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
  
  // Render form step 2: What Really Happened?
  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Step 2: What Really Happened?</h3>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium">Did they ghost you?</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleToggleChange('wasGhosted', true)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.wasGhosted 
                ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('wasGhosted', false)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.wasGhosted === false 
                ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            No
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium">Was your interviewer...</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['respectful', 'friendly', 'disinterested', 'rude', 'condescending'].map((attitude) => (
            <button
              key={attitude}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, interviewerAttitude: attitude as InterviewerAttitude }))}
              className={`px-3 py-2 rounded-lg text-sm ${
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
        <label className="block text-gray-300 font-medium">Did they give you feedback?</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleToggleChange('gaveFeedback', true)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.gaveFeedback 
                ? 'bg-green-900/30 text-green-300 border border-green-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('gaveFeedback', false)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.gaveFeedback === false 
                ? 'bg-red-900/30 text-red-300 border border-red-700/50' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            No
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-gray-300 font-medium">Was there an assignment?</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleToggleChange('hadAssignment', true)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.hadAssignment 
                ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleToggleChange('hadAssignment', false)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              formData.hadAssignment === false 
                ? 'bg-gray-700/80 text-gray-300 border border-gray-600' 
                : 'bg-gray-700 text-gray-300 border border-gray-600'
            }`}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            No
          </button>
        </div>
      </div>
      
      {formData.hadAssignment && (
        <div className="space-y-2 animate-fade-in">
          <label className="block text-gray-300 font-medium">How long did it take?</label>
          <div className="grid grid-cols-3 gap-2">
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
                className={`px-3 py-2 rounded-lg text-sm ${
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
      
      <div className="pt-4 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          rightIcon={ChevronRight}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
  
  // Render form step 3: Show Me the Money
  const renderStep3 = () => (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Step 3: Show Me the Money (Optional)</h3>
      
      <div className="space-y-4">
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
        <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
          {parseInt(formData.offeredSalary) < parseInt(formData.expectedSalary) * 0.9 && (
            <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded-full text-xs border border-red-700/50">
              Lowball Offer
            </span>
          )}
          {parseInt(formData.offeredSalary) >= parseInt(formData.expectedSalary) && (
            <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-700/50">
              Exceeded Expectations
            </span>
          )}
          {parseInt(formData.offeredSalary) >= parseInt(formData.previousSalary) * 1.2 && (
            <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-700/50">
              Significant Raise
            </span>
          )}
        </div>
      )}
      
      <div className="pt-4 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          rightIcon={ChevronRight}
        >
          Next Step
        </Button>
      </div>
    </div>
  );
  
  // Render form step 4: Final Comments
  const renderStep4 = () => (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Final Step: Share Your Experience</h3>
      
      <TextArea
        name="comments"
        value={formData.comments}
        onChange={handleInputChange}
        label="Any comments you want to share with the world?"
        placeholder="Share your experience, advice, or anything else you think would help others..."
        rows={5}
        optional
      />
      
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      
      <div className="pt-4 flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
        >
          Back
        </Button>
        <Button
          type="submit"
          leftIcon={Send}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Post Anonymously
        </Button>
      </div>
    </div>
  );
  
  // Render success message
  const renderSuccessMessage = () => (
    <div className="text-center py-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 mb-4">
        <CheckCircle className="h-8 w-8 text-green-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Thank You for Speaking Your Truth!</h3>
      <p className="text-gray-300 mb-6">
        Your anonymous review has been posted. Together, we're making the interview process more transparent for everyone.
      </p>
      <Button
        onClick={resetForm}
        leftIcon={MessageSquare}
      >
        Share Another Experience
      </Button>
      
      <Card className="mt-6 text-center p-6 bg-gray-800/70 border border-gray-700">
        <h3 className="text-xl font-semibold mb-2 text-white">Want to keep track of your grudges and get back later?</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Create a free account to bookmark your reviews, track company behavior over time, and see who else shared your pain.
        </p>
        <Button 
          className="text-base font-medium" 
          variant="primary"
          title="Don't worry, your feedback stays anonymous unless you choose otherwise."
        >
          Sign Me Up, I'm Petty →
        </Button>
      </Card>
    </div>
  );
  
  // Render the form based on current step
  const renderForm = () => {
    if (isSubmitted) {
      return renderSuccessMessage();
    }
    
    return (
      <form onSubmit={handleSubmit} className="h-full">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FF8A00] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>Basics</span>
            <span>Details</span>
            <span>Salary</span>
            <span>Submit</span>
          </div>
        </div>
        
        {/* Form steps */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </form>
    );
  };
  
  // Render the Ghoster Hall of Shame card
  const renderGhosterCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-red-500/30 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Ghost className="h-5 w-5 mr-2 text-red-400" />
          <span>Ghoster Hall of Shame</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockGhosters.map((company, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 rounded-lg bg-gray-750 border border-gray-700"
            >
              <div className="flex items-center">
                <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full text-xs font-bold mr-3">
                  {index + 1}
                </span>
                <span className="text-white font-medium">{company.company}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-300 mr-2">{company.count}</span>
                {company.trend === 'up' && (
                  <Flame className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the Most Respectful Panels card
  const renderRespectfulCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-green-500/30 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Award className="h-5 w-5 mr-2 text-green-400" />
          <span>Most Respectful Panels</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockRespectful.map((company, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{company.company}</span>
                <span className="text-green-400 font-bold">{company.score}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${company.score}%` }}
                ></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {company.tags.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex} 
                    className="bg-green-900/30 text-green-300 px-2 py-0.5 rounded-full text-xs border border-green-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the Tags Wordcloud card
  const renderTagsCard = () => (
    <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-blue-500/30 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Hash className="h-5 w-5 mr-2 text-blue-400" />
          <span>Real Tags. Real People.</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center py-4">
          {mockTags.map((tag, index) => {
            // Calculate size based on count (1-5)
            const size = Math.max(1, Math.min(5, Math.floor(tag.count / 100) + 1));
            // Determine color based on sentiment
            const colorClass = tag.sentiment === 'positive' 
              ? 'bg-green-900/30 text-green-300 border-green-700/50' 
              : 'bg-red-900/30 text-red-300 border-red-700/50';
            
            return (
              <div 
                key={index} 
                className={`px-3 py-1.5 rounded-full border ${colorClass} cursor-pointer transition-transform hover:scale-110 group relative`}
                style={{ fontSize: `${0.75 + (size * 0.1)}rem` }}
              >
                {tag.text}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {tag.count} mentions
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
  
  // Render the signup modal
  const renderSignupModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 transition-opacity ${
      showSignupModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-[#FF8A00]/30 shadow-xl transform transition-transform duration-300 scale-100">
        <div className="text-right mb-2">
          <button 
            onClick={() => setShowSignupModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF8A00]/20 mb-4">
            <ThumbsUp className="h-8 w-8 text-[#FF8A00]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Thanks for sharing! 👊</h3>
          <p className="text-gray-300">
            Want to bookmark your review, track your companies, or get alerts when someone else rates them?
          </p>
        </div>
        <Button
          variant="primary"
          rightIcon={ArrowRight}
          fullWidth
          onClick={() => {
            // TODO: Implement signup flow
            setShowSignupModal(false);
          }}
        >
          Create My Interview Locker
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="py-16 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF8A00]/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Interview Truth Wall
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Share your real interview experiences anonymously. Help others know what to expect.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div>
            <Card className="border border-gray-700 bg-gray-800/50 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-[#FF8A00]" />
                  Speak Your Truth – Share Your Interview Experience Anonymously
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderForm()}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Visualizations */}
          <div className="space-y-6">
            {renderGhosterCard()}
            {renderRespectfulCard()}
            {renderTagsCard()}
          </div>
        </div>
        
        {/* Sticky CTA Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 py-3 px-4 z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white mb-3 sm:mb-0">
              Interviewed recently? Got ghosted or lowballed? 🔥 Speak up. Your story might help someone else.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                // Scroll to the form
                document.querySelector('.interview-truth-wall')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              rightIcon={ArrowRight}
            >
              Rate Now
            </Button>
          </div>
        </div>
      </div>
      
      {/* Signup Modal */}
      {renderSignupModal()}
    </div>
  );
}