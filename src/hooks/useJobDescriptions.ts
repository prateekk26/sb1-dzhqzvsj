import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface JobDescription {
  id: string;
  name: string;
  url: string;
  company?: string;
  position?: string;
  uploadedAt: string;
}

export function useJobDescriptions(userId: string | null) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDescriptions = useCallback(async () => {
    if (!userId) {
      setJobDescriptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // List all JD files in the user's storage folder
      const { data: files, error: listError } = await supabase
        .storage
        .from('job-descriptions')
        .list(userId, {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        throw listError;
      }

      // Format the data
      const formattedJDs = files?.map(file => {
        // Extract company and position from filename if possible
        // Format: Company_Position_timestamp.pdf
        let company = undefined;
        let position = undefined;
        
        const nameParts = file.name.split('_');
        if (nameParts.length >= 3) {
          company = nameParts[0].replace(/-/g, ' ');
          position = nameParts[1].replace(/-/g, ' ');
        }
        
        // Get the public URL
        const { data: urlData } = supabase
          .storage
          .from('job-descriptions')
          .getPublicUrl(`${userId}/${file.name}`);

        return {
          id: file.id,
          name: file.name,
          url: urlData.publicUrl,
          company,
          position,
          uploadedAt: new Date(file.created_at).toLocaleDateString()
        };
      }) || [];

      setJobDescriptions(formattedJDs);
    } catch (err) {
      console.error('Error fetching job descriptions:', err);
      setError('Failed to load job descriptions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Upload a new job description
  const uploadJobDescription = async (file: File, company?: string, position?: string): Promise<{ url: string | null; error: string | null }> => {
    if (!userId) {
      return { url: null, error: 'Not authenticated' };
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return { url: null, error: 'Only PDF files are allowed' };
    }

    try {
      // Create a formatted filename
      let fileName = '';
      
      if (company && position) {
        // Format as Company_Position_timestamp.pdf
        const formattedCompany = company.replace(/\s+/g, '-');
        const formattedPosition = position.replace(/\s+/g, '-');
        fileName = `${formattedCompany}_${formattedPosition}_${Date.now()}.pdf`;
      } else {
        // Use the default format with timestamp
        fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      }
      
      const filePath = `${userId}/${fileName}`;

      // Upload the file
      const { data, error } = await supabase.storage
        .from('job-descriptions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('job-descriptions')
        .getPublicUrl(filePath);

      // Refresh the list
      fetchJobDescriptions();

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error("Upload error:", error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Error uploading job description'
      };
    }
  };

  // Delete a job description
  const deleteJobDescription = async (fileName: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase.storage
        .from('job-descriptions')
        .remove([`${userId}/${fileName}`]);

      if (error) {
        throw error;
      }

      // Refresh the list
      fetchJobDescriptions();

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting job description:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error deleting job description'
      };
    }
  };

  // View a job description (open in new tab)
  const viewJobDescription = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    fetchJobDescriptions();
  }, [fetchJobDescriptions]);

  return {
    jobDescriptions,
    loading,
    error,
    uploadJobDescription,
    deleteJobDescription,
    viewJobDescription,
    refresh: fetchJobDescriptions
  };
}