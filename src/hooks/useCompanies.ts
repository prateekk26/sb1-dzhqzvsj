import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new company
  const addCompany = useCallback(async (name: string): Promise<{ id: string | null; error: string | null }> => {
    try {
      // First check if company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', name)
        .single();
      
      if (existingCompany) {
        return { id: existingCompany.id, error: null };
      }
      
      // If not, add the new company
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setCompanies(prev => [...prev, data]);
      
      return { id: data.id, error: null };
    } catch (err) {
      console.error('Error adding company:', err);
      return { 
        id: null, 
        error: err instanceof Error ? err.message : 'Failed to add company' 
      };
    }
  }, []);

  // Bulk add companies
  const bulkAddCompanies = useCallback(async (names: string[]): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Filter out duplicates
      const uniqueNames = [...new Set(names)];
      
      // Add each company
      for (const name of uniqueNames) {
        if (name.trim()) {
          await addCompany(name.trim());
        }
      }
      
      // Refresh the list
      await fetchCompanies();
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error bulk adding companies:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add companies' 
      };
    }
  }, [addCompany, fetchCompanies]);
  
  // Delete a company (admin only)
  const deleteCompany = useCallback(async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setCompanies(prev => prev.filter(company => company.id !== id));
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error deleting company:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete company' 
      };
    }
  }, []);

  // Load companies on mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    addCompany,
    bulkAddCompanies,
    deleteCompany
  };
}