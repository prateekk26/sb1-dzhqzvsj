import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Reference {
  id: string;
  user_id: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string | null;
  relationship: string;
  company: string;
  linkedin_url: string | null;
  status: 'pending' | 'sent' | 'completed' | 'declined';
  feedback: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  completed_at: string | null;
}

export interface ReferenceInput {
  referee_name: string;
  referee_email: string;
  referee_phone?: string;
  relationship: string;
  company: string;
  linkedin_url?: string;
}

export function useReferences(userId: string | null) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch references
  const fetchReferences = useCallback(async () => {
    if (!userId) {
      setReferences([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('references')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReferences(data || []);
    } catch (err) {
      console.error('Error fetching references:', err);
      setError(err instanceof Error ? err.message : 'Failed to load references');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create a reference request
  const createReference = async (input: ReferenceInput): Promise<{ success: boolean; error: string | null; reference?: Reference }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { data, error: createError } = await supabase
        .from('references')
        .insert([{
          user_id: userId,
          referee_name: input.referee_name,
          referee_email: input.referee_email,
          referee_phone: input.referee_phone || null,
          relationship: input.relationship,
          company: input.company,
          linkedin_url: input.linkedin_url || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Refresh the references list
      fetchReferences();

      return { success: true, error: null, reference: data as Reference };
    } catch (err) {
      console.error('Error creating reference:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create reference request' 
      };
    }
  };

  // Delete a reference request (only if status is 'pending')
  const deleteReference = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('references')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (deleteError) throw deleteError;

      // Refresh the references list
      setReferences(prev => prev.filter(ref => ref.id !== id));

      return { success: true, error: null };
    } catch (err) {
      console.error('Error deleting reference:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete reference request' 
      };
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  return {
    references,
    loading,
    error,
    createReference,
    deleteReference,
    refresh: fetchReferences
  };
}