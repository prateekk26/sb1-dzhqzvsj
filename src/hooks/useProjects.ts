import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  experience_id: string;
  user_id: string;
  raw_input: string;
  title?: string;
  enhanced_description?: string;
  competencies?: string[];
  suggestions?: string[];
  impact_statement?: string;
  created_at: string;
  updated_at: string;
  competency_rationales?: Record<string, string>;
}

type ProjectInput = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

interface ProjectAddResult {
  success: boolean;
  error: string | null;
  data?: Project;
}

export function useProjects(userId: string | null, experienceId?: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    // Skip fetching if either userId or experienceId is null or undefined
    if (!userId || experienceId === null || experienceId === undefined) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);
      
      if (experienceId) {
        query = query.eq('experience_id', experienceId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Error fetching projects');
    } finally {
      setLoading(false);
    }
  }, [userId, experienceId]);

  const addProject = async (projectData: Omit<ProjectInput, 'user_id'>): Promise<ProjectAddResult> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      console.log('Adding project:', { ...projectData, user_id: userId });
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, user_id: userId }])
        .select();
      
      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      
      console.log('Project added successfully, data returned:', data?.length > 0);
      
      // Refresh the list of projects
      // Don't await this to avoid blocking the response
      fetchProjects().catch(err => {
        console.error('Error refreshing projects after add:', err);
      });
      
      return { 
        success: true, 
        error: null,
        data: data && data.length > 0 ? data[0] : undefined
      };
    } catch (error) {
      console.error('Error adding project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error adding project' 
      };
    }
  };

  const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'user_id' | 'experience_id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      console.log('Updating project:', id, updates);
      
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating project in Supabase:', error);
        throw error;
      }
      
      console.log('Project updated successfully in database');
      
      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === id ? { ...project, ...updates } : project
      ));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating project' 
      };
    }
  };

  const deleteProject = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state instead of refetching
      setProjects(prev => prev.filter(project => project.id !== id));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting project' 
      };
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    refresh: fetchProjects
  };
}