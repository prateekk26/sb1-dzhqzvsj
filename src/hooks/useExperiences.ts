import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
  source: string;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ExperienceInput = Omit<Experience, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useExperiences(userId: string | null) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperiences = useCallback(async () => {
    if (!userId) {
      setExperiences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching experiences for user:', userId);
      
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching experiences:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} experiences`);
      setExperiences(data || []);
    } catch (err) {
      console.error('Error fetching experiences:', err);
      setError(err instanceof Error ? err.message : 'Error fetching experiences');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addExperience = async (experience: Partial<ExperienceInput>): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    // Ensure default values for source if not provided
    const experienceWithDefaults = {
      ...experience,
      source: experience.source || 'manual',
      user_id: userId
    };
    
    try {
      const { data, error } = await supabase
        .from('experiences')
        .insert([experienceWithDefaults])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update local state instead of refetching
      if (data && data.length > 0) {
        setExperiences(prev => [data[0], ...prev]);
      } else {
        // Fallback to refetching if we don't get the data back
        fetchExperiences();
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error adding experience:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error adding experience' 
      };
    }
  };

  const updateExperience = async (id: string, experience: Partial<ExperienceInput>): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { data, error } = await supabase
        .from('experiences')
        .update(experience)
        .eq('id', id)
        .eq('user_id', userId)
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update local state
      if (data && data.length > 0) {
        setExperiences(prev => 
          prev.map(exp => exp.id === id ? data[0] : exp)
        );
      } else {
        // Fallback to refetching
        fetchExperiences();
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating experience:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating experience' 
      };
    }
  };

  const deleteExperience = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setExperiences(prev => prev.filter(exp => exp.id !== id));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting experience:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting experience' 
      };
    }
  };

  const deleteLinkedInExperiences = async (): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'linkedin');
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setExperiences(prev => prev.filter(exp => exp.source !== 'linkedin'));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting LinkedIn experiences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting LinkedIn experiences' 
      };
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  return {
    experiences,
    loading,
    error,
    addExperience,
    updateExperience,
    deleteExperience,
    deleteLinkedInExperiences,
    refresh: fetchExperiences
  };
}