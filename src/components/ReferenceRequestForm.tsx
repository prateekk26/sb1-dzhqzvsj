import React, { useState } from 'react';
import { UserCheck, Building, AtSign, Phone, Briefcase, Linkedin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { FormInput } from './FormInput';
import { TextArea } from './TextArea';
import { Button } from './Button';
import { ErrorHandler } from './ErrorHandler';
import { useReferences } from '../hooks/useReferences';
import { emailValidator, nameValidator, phoneValidator, urlValidator } from '../utils/validation';

// Define the reference input type
interface ReferenceInput {
  referee_name: string;
  referee_email: string;
  referee_phone?: string;
  relationship: string;
  company: string;
  linkedin_url?: string;
  notes?: string;
}

interface ReferenceRequestFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReferenceRequestForm({ userId, onSuccess, onCancel }: ReferenceRequestFormProps) {
  const { createReference } = useReferences(userId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ReferenceInput>({
    referee_name: '',
    referee_email: '',
    referee_phone: '',
    relationship: '',
    company: '',
    linkedin_url: '',
    notes: ''
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle blur events for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setFormTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof ReferenceInput] as string);
  };
  
  // Validate a single field
  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'referee_name':
        const nameResult = nameValidator(value);
        if (!nameResult.valid) error = nameResult.message || 'Name is required';
        break;
      case 'referee_email':
        const emailResult = emailValidator(value);
        if (!emailResult.valid) error = emailResult.message || 'Valid email is required';
        break;
      case 'referee_phone':
        const phoneResult = phoneValidator(value);
        if (!phoneResult.valid) error = phoneResult.message || 'Invalid phone number';
        break;
      case 'relationship':
        if (!value.trim()) error = 'Relationship is required';
        break;
      case 'company':
        if (!value.trim()) error = 'Company is required';
        break;
      case 'linkedin_url':
        if (value.trim()) {
          if (!value.includes('linkedin.com/')) error = 'Please enter a valid LinkedIn URL';
        }
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate all fields
    let isValid = true;
    const allFields = ['referee_name', 'referee_email', 'relationship', 'company', 'referee_phone', 'linkedin_url'];
    
    for (const field of allFields) {
      const fieldValid = validateField(field, formData[field as keyof ReferenceInput] as string);
      isValid = isValid && fieldValid;
    }
    
    if (!isValid) {
      setError('Please correct the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createReference(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create reference request');
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error submitting reference request:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-gray-700 bg-gray-800/50 animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Request a Professional Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert 
          variant="info"
          message="Enter the contact information of someone who can vouch for your professional abilities. We'll reach out to them to collect feedback."
          className="mb-4"
        />
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            name="referee_name"
            value={formData.referee_name}
            onChange={handleChange}
            onBlur={handleBlur}
            label="Reference Name"
            placeholder="e.g., Jane Smith"
            icon={UserCheck}
            error={formTouched.referee_name ? formErrors.referee_name : undefined}
            validation={nameValidator}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="referee_email"
              value={formData.referee_email}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Email"
              type="email"
              placeholder="e.g., jane.smith@example.com"
              icon={AtSign}
              error={formTouched.referee_email ? formErrors.referee_email : undefined}
              validation={emailValidator}
            />
            
            <FormInput
              name="referee_phone"
              value={formData.referee_phone || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Phone (Optional)"
              placeholder="e.g., +1 (555) 123-4567"
              icon={Phone}
              optional
              error={formTouched.referee_phone ? formErrors.referee_phone : undefined}
              validation={phoneValidator}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Relationship"
              placeholder="e.g., Manager, Colleague"
              icon={Briefcase}
              error={formTouched.relationship ? formErrors.relationship : undefined}
            />
            
            <FormInput
              name="company"
              value={formData.company}
              onChange={handleChange}
              onBlur={handleBlur}
              label="Company"
              placeholder="e.g., Acme Corporation"
              icon={Building}
              error={formTouched.company ? formErrors.company : undefined}
            />
          </div>
          
          <FormInput
            name="linkedin_url"
            value={formData.linkedin_url || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            label="LinkedIn URL (Optional)"
            placeholder="e.g., https://linkedin.com/in/janesmith"
            icon={Linkedin}
            optional
            error={formTouched.linkedin_url ? formErrors.linkedin_url : undefined}
            helpText="LinkedIn profile of your reference (if available)"
          />
          
          <TextArea
            name="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            label="Additional Notes (Optional)"
            placeholder="Any additional information about this reference..."
            rows={3}
            optional
          />
          
          <ErrorHandler
            error={error}
            onClose={() => setError(null)}
          />
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              isLoading={loading}
            >
              Send Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}