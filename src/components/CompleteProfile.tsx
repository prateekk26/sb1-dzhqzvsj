
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { FormInput } from '../components/Form/FormInput';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import { Alert } from '../components/Alert';

export default memo(function CompleteProfile() {
  const { user, profile, refreshProfile, initialized, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = new URLSearchParams(location.search).get('edit') === 'true';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    linkedinUrl: '',
    resumeUrl: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialized && profile && !isEditMode && profile.profileCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, profile, isEditMode, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        linkedinUrl: profile.linkedinUrl || '',
        resumeUrl: profile.resumeUrl || '',
      });
    }
  }, [profile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.linkedinUrl.trim()) newErrors.linkedinUrl = 'LinkedIn URL is required';
    return newErrors;
  };

  const uploadResume = async (): Promise<string | null> => {
    if (!resumeFile) return formData.resumeUrl || null;

    const fileExt = resumeFile.name.split('.').pop();
    const filePath = `resumes/${user?.id}.${fileExt}`;

    const { error } = await supabase.storage.from('resumes').upload(filePath, resumeFile, {
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitting(false);
      return;
    }

    try {
      const resumeUrl = await uploadResume();
      const updates = {
        ...formData,
        resumeUrl,
        profileCompleted: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('users').update(updates).eq('id', user?.id);
      if (error) throw error;

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized || authLoading) return <LoadingState text="Loading Profile..." />;

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <h1 className="text-xl font-semibold mb-4">Complete Your Profile</h1>

          <FormInput
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            error={errors.firstName}
          />
          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            error={errors.lastName}
          />
          <FormInput
            label="LinkedIn URL"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            error={errors.linkedinUrl}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium">Upload Resume</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {formData.resumeUrl && (
              <a
                href={formData.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline mt-1 block"
              >
                View Uploaded Resume
              </a>
            )}
          </div>

          {submitError && <Alert type="error" className="mt-4">{submitError}</Alert>}

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
});
