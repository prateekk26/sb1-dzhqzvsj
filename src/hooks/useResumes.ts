import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface StorageFile {
  name: string;
  url: string;
  uploaded_at: string;
  fileType?: string;
}

export function useResumes(userId: string | null) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversionPending, setConversionPending] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const fetchResumes = async () => {
    if (!userId) {
      setResumes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .list(userId, {
          limit: 5,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const formattedResumes = data.map(file => {
          const { data: urlData } = supabase
            .storage
            .from('resumes')
            .getPublicUrl(`${userId}/${file.name}`);

          // Determine file type from the file name
          const fileType = file.name.toLowerCase().endsWith('.png') ? 'png' : 'pdf';

          return {
            name: file.name,
            url: urlData.publicUrl,
            uploaded_at: new Date(file.created_at).toLocaleDateString(),
            fileType: fileType
          };
        });

        setResumes(formattedResumes);
      } else {
        setResumes([]);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setError(err instanceof Error ? err.message : 'Error fetching resumes');
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!userId || !file) {
      return { url: null, error: 'Missing user ID or file' };
    }

    if (file.type !== 'application/pdf') {
      return { url: null, error: 'Only PDF files are allowed' };
    }

    try {
      // Use a folder structure with the user ID and a unique filename
      const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      console.log('Uploading resume with filename:', fileName);

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/pdf',
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      const resumeUrl = urlData.publicUrl;

      // ✅ Update user's profile with new resume URL
      try {
        const { error: updateError } = await supabase
          .from('users_profile')
          .update({ 
            resume_url: resumeUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating profile with new resume URL:', updateError);
        } else {
          console.log('Successfully updated profile with new resume URL');
        }
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue anyway to return the URL
      }

      console.log('✅ Resume uploaded and profile updated.');

      // Optional: Refresh resumes list
      fetchResumes();

      return { url: resumeUrl, error: null };
    } catch (error) {
      console.error("Upload error:", error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Error uploading resume'
      };
    }
  };
  

  const deleteResume = async (fileName: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }

    try {
      console.log('Deleting resume file:', fileName);
      console.log('User ID:', userId);
      
      // Also try to find and delete any PNG version
      const baseName = fileName.replace(/\.pdf$/i, '');
      
      // List files to find potential PNG versions
      const { data: files } = await supabase.storage
        .from('resumes')
        .list(userId);
      
      if (files) {
        console.log('Found files in storage:', files.map(f => f.name));
        
        // Delete the main file
        const { error: deleteError } = await supabase.storage
          .from('resumes')
          .remove([`${userId}/${fileName}`]);
          
        if (deleteError) {
          console.error('Error deleting file:', deleteError);
          throw deleteError;
        }
        
        console.log('Successfully deleted file from storage:', `${userId}/${fileName}`);
        
        // Find and delete any PNG versions
        const pngFiles = files.filter(file => 
          file.name.toLowerCase().endsWith('.png') && 
          file.name.includes(baseName)
        );
        
        console.log('Found PNG files to delete:', pngFiles.map(f => f.name));
        
        for (const pngFile of pngFiles) {
          const { error: pngDeleteError } = await supabase.storage
            .from('resumes')
            .remove([`${userId}/${pngFile.name}`]);
            
          if (pngDeleteError) {
            console.warn('Error deleting PNG version:', pngDeleteError);
          } else {
            console.log('Deleted PNG version:', pngFile.name);
          }
        }
      }

      // Update user's profile to remove the resume URL if it matches the deleted file
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('resume_url')
        .eq('user_id', userId)
        .single();
        
      if (profileData?.resume_url && profileData.resume_url.includes(fileName)) {
        console.log('Updating profile to remove deleted resume URL');
        const { error: profileUpdateError } = await supabase
          .from('users_profile')
          .update({ 
            resume_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (profileUpdateError) {
          console.error('Error updating profile after resume deletion:', profileUpdateError);
        } else {
          console.log('Updated user profile to remove deleted resume URL');
        }
      }

      // Refresh the list of resumes
      fetchResumes();

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting resume:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error deleting resume'
      };
    }
  };

  const viewResume = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // This function checks for PNG versions of a PDF resume with advanced pattern matching
  const getPngVersionUrl = async (pdfUrl: string): Promise<string | null> => {
    if (!userId || !pdfUrl) {
      return null;
    }

    try {
      // Extract the PDF filename from the URL
      const pdfFileName = pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1);
      
      // Extract the base name without the extension
      const baseName = pdfFileName.replace(/\.pdf$/i, '');
      
      // Get a list of all files in the user's folder to find potential matches
      const { data, error } = await supabase
        .storage
        .from('resumes')
        .list(userId);
      
      if (error) {
        console.error('Error listing resume files:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Look for PNG files that contain the base name
      // The conversion process might add timestamps or suffixes
      const pngFiles = data.filter(file => {
        return file.name.toLowerCase().endsWith('.png') && 
               file.name.includes(baseName);
      });
      
      console.log('Found potential PNG matches:', pngFiles.map(f => f.name));
      
      if (pngFiles.length === 0) {
        return null;
      }
      
      // Sort by creation time (newest first) and take the first one
      pngFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestPngFile = pngFiles[0];
      
      // Get the public URL
      const { data: urlData } = supabase
        .storage
        .from('resumes')
        .getPublicUrl(`${userId}/${latestPngFile.name}`);
      
      console.log('Using PNG file:', latestPngFile.name);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error getting PNG version URL:', err);
      return null;
    }
  };
  
  // Function to convert PDF to PNG using Edge Function with improved error handling
  const convertPdfToPng = async (pdfUrl: string): Promise<{ success: boolean; pngUrl?: string; error?: string }> => {
    if (!userId || !pdfUrl) {
      return { success: false, error: 'Missing user ID or PDF URL' };
    }
    
    setConversionPending(true);
    setConversionError(null);
    
    try {
      console.log('Starting PDF to PNG conversion for:', pdfUrl);
      
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('Cannot convert PDF to PNG while offline');
      }
      
      // Log headers and environment before making the request
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Using Supabase functions client');
      
      // Create a timeout promise to abort if it takes too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Conversion request timed out after 30 seconds')), 30000);
      });
      
      // Create the actual API call promise
      const apiCallPromise = supabase.functions.invoke('convert-pdf-to-png', {
        body: { 
          pdfUrl, 
          userId 
        },
      });
      
      // Race between the API call and the timeout
      const { data, error } = await Promise.race([
        apiCallPromise,
        timeoutPromise.then(() => { throw new Error('Request timed out'); })
      ]) as any;
      
      // Check for error from the Edge Function
      if (error) {
        console.error('Edge function returned error:', error);
        throw new Error(`Edge Function error: ${error.message || 'Unknown error'}`);
      }
      
      // Validate response data
      if (!data) {
        throw new Error('No data returned from Edge Function');
      }
      
      if (!data.pngUrl) {
        throw new Error('No PNG URL in Edge Function response');
      }
      
      console.log('Conversion successful! PNG URL:', data.pngUrl);
      
      setConversionPending(false);
      return { success: true, pngUrl: data.pngUrl };
    } catch (err) {
      console.error('Error converting PDF to PNG:', err);
      
      // Format a more descriptive error message based on the error type
      let errorMessage = 'Unknown error during conversion';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Conversion timed out. The server might be busy, please try again later.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error connecting to conversion service. Please check your internet connection.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'Conversion service endpoint not found. This feature might be temporarily unavailable.';
        } else {
          errorMessage = `Error converting PDF: ${err.message}`;
        }
      }
      
      setConversionError(errorMessage);
      setConversionPending(false);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [userId]);

  return {
    resumes,
    loading,
    error,
    uploadResume,
    deleteResume,
    viewResume,
    getPngVersionUrl,
    convertPdfToPng,
    conversionPending,
    conversionError,
    refresh: fetchResumes
  };
}